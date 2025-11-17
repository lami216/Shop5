import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import useTranslation from "../hooks/useTranslation";
import { useCartStore } from "../stores/useCartStore";
import { formatMRU } from "../lib/formatMRU";
import { formatNumberEn } from "../lib/formatNumberEn";
import { getProductPricing } from "../lib/getProductPricing";
import apiClient from "../lib/apiClient";

const CheckoutPage = () => {
        const { cart, total, subtotal, coupon, totalDiscountAmount, clearCart, isCouponApplied } =
                useCartStore();
        const navigate = useNavigate();
        const [customerName, setCustomerName] = useState("");
        const [whatsAppNumber, setWhatsAppNumber] = useState("");
        const [manualAddress, setManualAddress] = useState("");
        const [location, setLocation] = useState(null);
        const [locationError, setLocationError] = useState("");
        const [isRequestingLocation, setIsRequestingLocation] = useState(false);
        const [whatsAppError, setWhatsAppError] = useState("");
        const [isSubmitting, setIsSubmitting] = useState(false);
        const { t } = useTranslation();

        useEffect(() => {
                const hasPendingWhatsAppRedirect = sessionStorage.getItem("whatsappOrderSent");

                if (cart.length === 0 && !hasPendingWhatsAppRedirect) {
                        toast.error(t("common.messages.cartEmptyToast"));
                        navigate("/cart", { replace: true });
                }
        }, [cart, navigate, t]);

        useEffect(() => {
                const shouldRedirect = sessionStorage.getItem("whatsappOrderSent");

                if (shouldRedirect) {
                        sessionStorage.removeItem("whatsappOrderSent");
                        navigate("/purchase-success", { replace: true });
                }
        }, [navigate]);

        const normalizedWhatsAppNumber = whatsAppNumber.replace(/\D/g, "");
        const isWhatsAppValid = /^\d{8,15}$/.test(normalizedWhatsAppNumber);
        const hasLocation = Boolean(location);
        const hasManualAddress = manualAddress.trim() !== "";
        const isFormValid =
                customerName.trim() !== "" && cart.length > 0 && isWhatsAppValid && (hasLocation || hasManualAddress);

        const handleShareLocation = () => {
                setLocationError("");

                if (!navigator.geolocation) {
                        setLocationError(t("checkout.form.locationError"));
                        return;
                }

                setIsRequestingLocation(true);

                navigator.geolocation.getCurrentPosition(
                        (position) => {
                                const { latitude, longitude } = position.coords;
                                setLocation({ lat: latitude, lng: longitude });
                                setLocationError("");
                                setIsRequestingLocation(false);
                        },
                        () => {
                                setLocationError(t("checkout.form.locationError"));
                                setIsRequestingLocation(false);
                        }
                );
        };

        const handleWhatsAppChange = (event) => {
                const value = event.target.value;
                setWhatsAppNumber(value);

                const digitsOnly = value.replace(/\D/g, "");

                if (value.trim() === "") {
                        setWhatsAppError("");
                        return;
                }

                if (!/^\d{8,15}$/.test(digitsOnly)) {
                        setWhatsAppError(t("common.messages.whatsAppInvalid"));
                } else {
                        setWhatsAppError("");
                }
        };

        const productsSummary = useMemo(
                () =>
                        cart.map((item, index) => {
                                const { discountedPrice } = getProductPricing(item);
                                const lineTotal = discountedPrice * item.quantity;
                                const productIndex = formatNumberEn(index + 1);
                                const quantity = formatNumberEn(item.quantity);
                                return `${productIndex}. ${item.name} × ${quantity} = ${formatMRU(lineTotal)}`;
                        }),
                [cart]
        );

        const savings = Math.max(Number(totalDiscountAmount) || 0, subtotal - total, 0);

        const handleSubmit = async (event) => {
                event.preventDefault();

                if (isSubmitting) {
                        return;
                }

                if (!customerName.trim() || !whatsAppNumber.trim() || (!hasLocation && !hasManualAddress)) {
                        toast.error(t("common.messages.fillAllFields"));
                        return;
                }

                if (!/^\d{8,15}$/.test(normalizedWhatsAppNumber)) {
                        setWhatsAppError(t("common.messages.whatsAppInvalid"));
                        toast.error(t("common.messages.whatsAppInvalid"));
                        return;
                }

                if (cart.length === 0) {
                        toast.error(t("common.messages.cartEmpty"));
                        navigate("/cart");
                        return;
                }

                const sanitizedPhone = normalizedWhatsAppNumber;
                const locationLink = location
                        ? `https://www.google.com/maps?q=${encodeURIComponent(location.lat)},${encodeURIComponent(
                                        location.lng
                                )}`
                        : "";
                const resolvedAddress = manualAddress.trim() || locationLink;
                const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

                const baseOrderDetails = {
                        customerName: customerName.trim(),
                        phone: sanitizedPhone,
                        address: resolvedAddress,
                        items: cart.map((item) => {
                                const { price, discountedPrice, discountPercentage, isDiscounted } =
                                        getProductPricing(item);
                                return {
                                        id: item._id,
                                        name: item.name,
                                        description: item.description,
                                        image: item.image,
                                        price: discountedPrice,
                                        originalPrice: price,
                                        discountPercentage,
                                        isDiscounted,
                                        quantity: item.quantity,
                                };
                        }),
                        summary: {
                                subtotal,
                                total,
                                totalQuantity,
                                coupon: coupon?.code && isCouponApplied ? { ...coupon } : null,
                        },
                };

                const requestPayload = {
                        items: cart.map((item) => ({
                                productId: item._id || item.id,
                                quantity: item.quantity,
                        })),
                        customerName: baseOrderDetails.customerName,
                        phone: sanitizedPhone,
                        address: baseOrderDetails.address,
                };

                if (coupon?.code && isCouponApplied) {
                        requestPayload.couponCode = coupon.code;
                }

                const STORE_WHATSAPP_NUMBER = "22247764130";

                setIsSubmitting(true);

                try {
                        const response = await apiClient.post("/orders/whatsapp-checkout", requestPayload);

                        const orderId = response?.orderId;
                        const orderNumber = response?.orderNumber;
                        const serverSubtotal = Number(response?.subtotal ?? subtotal);
                        const serverTotal = Number(response?.total ?? total);
                        const serverTotalDiscount = Number(
                                response?.totalDiscountAmount ?? Math.max(serverSubtotal - serverTotal, 0)
                        );
                        const serverCoupon = response?.coupon ?? (isCouponApplied ? coupon : null);

                        if (!orderId || !orderNumber) {
                                throw new Error("Missing order information from server");
                        }

                        const enrichedOrderDetails = {
                                ...baseOrderDetails,
                                orderId,
                                orderNumber,
                                summary: {
                                        ...baseOrderDetails.summary,
                                        subtotal: serverSubtotal,
                                        total: serverTotal,
                                        coupon: serverCoupon,
                                        totalDiscountAmount: Math.max(serverTotalDiscount, 0),
                                },
                        };

                        sessionStorage.setItem("lastOrderDetails", JSON.stringify(enrichedOrderDetails));
                        sessionStorage.setItem("lastWhatsAppOrderId", orderId);

                        const appliedSavings = Math.max(serverTotalDiscount, serverSubtotal - serverTotal, 0);

                        const messageLines = [
                                t("checkout.messages.newOrder", { name: baseOrderDetails.customerName }),
                                t("checkout.messages.orderNumber", { number: formatNumberEn(orderNumber) }),
                                t("checkout.messages.customerWhatsApp", { number: sanitizedPhone }),
                                t("checkout.messages.address", { address: baseOrderDetails.address }),
                                "",
                                t("checkout.messages.productsHeader"),
                                ...productsSummary,
                        ];

                        if (productsSummary.length === 0) {
                                messageLines.push(t("checkout.messages.noProducts"));
                        }

                        if (serverCoupon?.code) {
                                const discountPercentage = formatNumberEn(
                                        Number(serverCoupon.discountPercentage) || 0
                                );
                                messageLines.push("", t("checkout.messages.couponHeader"));
                                messageLines.push(
                                        t("checkout.messages.coupon", {
                                                code: serverCoupon.code,
                                                discount: discountPercentage,
                                        })
                                );
                        }

                        if (appliedSavings > 0) {
                                messageLines.push(
                                        "",
                                        t("checkout.messages.savings", { amount: formatMRU(appliedSavings) })
                                );
                        }

                        if (locationLink) {
                                messageLines.push(t("checkout.messages.mapLink", { link: locationLink }));
                        }

                        messageLines.push("", t("checkout.messages.total", { amount: formatMRU(serverTotal) }));
                        messageLines.push("", t("checkout.messages.thanks"));

                        const whatsappURL = new URL("https://wa.me/" + STORE_WHATSAPP_NUMBER);
                        whatsappURL.searchParams.set("text", messageLines.join("\n"));

                        toast.success(t("checkout.messages.orderCreated"));

                        const whatsappWindow = window.open(whatsappURL.toString(), "_blank");

                        if (!whatsappWindow) {
                                toast.error(t("common.messages.whatsAppOpenFailed"));
                        }

                        sessionStorage.setItem("whatsappOrderSent", "true");
                        await clearCart();
                        navigate("/purchase-success", {
                                state: { orderType: "whatsapp", orderDetails: enrichedOrderDetails },
                        });
                } catch (error) {
                        console.error("Unable to process WhatsApp order", error);
                        const errorMessage =
                                error.response?.data?.message || t("checkout.messages.orderCreationFailed");
                        toast.error(errorMessage);
                } finally {
                        setIsSubmitting(false);
                }
        };

        return (
                <div className='checkout-page py-10'>
                        <div className='mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 lg:flex-row'>
                                <motion.section
                                        className='w-full rounded-xl border border-payzone-indigo/40 bg-white/80 p-6 shadow-lg backdrop-blur-sm'
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.4 }}
                                >
                                        <h1 className='mb-6 text-2xl font-bold'>{t("checkout.title")}</h1>
                                        <form className='space-y-5' onSubmit={handleSubmit}>
                                                <div className='space-y-2'>
                                                        <label className='block text-sm font-medium' htmlFor='customerName'>
                                                                {t("checkout.form.fullName")}
                                                        </label>
                                                        <input
                                                                id='customerName'
                                                                type='text'
                                                                value={customerName}
                                                                onChange={(event) => setCustomerName(event.target.value)}
                                                                className='w-full rounded-lg border border-payzone-indigo/40 bg-white px-4 py-2 text-[var(--text-dark)] placeholder-[var(--placeholder-color)] focus:border-payzone-gold focus:outline-none focus:ring-2 focus:ring-payzone-indigo'
                                                                placeholder={t("checkout.form.fullNamePlaceholder")}
                                                                required
                                                        />
                                                </div>

                                                <div className='space-y-2'>
                                                        <label className='block text-sm font-medium' htmlFor='whatsAppNumber'>
                                                                {t("checkout.form.whatsApp")}
                                                        </label>
                                                        <input
                                                                id='whatsAppNumber'
                                                                type='tel'
                                                                value={whatsAppNumber}
                                                                onChange={handleWhatsAppChange}
                                                                className='w-full rounded-lg border border-payzone-indigo/40 bg-white px-4 py-2 text-[var(--text-dark)] placeholder-[var(--placeholder-color)] focus:border-payzone-gold focus:outline-none focus:ring-2 focus:ring-payzone-indigo'
                                                                placeholder={t("checkout.form.whatsAppPlaceholder")}
                                                                required
                                                        />
                                                        {whatsAppError && <p className='text-sm text-red-400'>{whatsAppError}</p>}
                                                </div>

                                                <div className='space-y-3'>
                                                        <div className='space-y-1'>
                                                                <p className='text-sm font-medium text-payzone-navy'>
                                                                        {t("checkout.form.mapTitle")}
                                                                </p>
                                                                <div className='overflow-hidden rounded-xl border border-payzone-indigo/30 bg-white/70 shadow-sm'>
                                                                        {location ? (
                                                                                import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
                                                                                        <img
                                                                                                src={`https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=15&size=900x360&markers=color:red%7C${location.lat},${location.lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`}
                                                                                                alt={t("checkout.form.mapAlt")}
                                                                                                className='h-64 w-full object-cover'
                                                                                        />
                                                                                ) : (
                                                                                        <div className='flex h-64 w-full flex-col items-center justify-center gap-2 bg-white/60 px-4 text-center text-payzone-navy'>
                                                                                                <p className='text-base font-semibold'>
                                                                                                        {t("checkout.form.locationCoordinates", {
                                                                                                                lat: location.lat.toFixed(5),
                                                                                                                lng: location.lng.toFixed(5),
                                                                                                        })}
                                                                                                </p>
                                                                                                <a
                                                                                                        href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                                                                                                        target='_blank'
                                                                                                        rel='noreferrer'
                                                                                                        className='text-sm font-semibold text-payzone-indigo underline'
                                                                                                >
                                                                                                        {t("checkout.form.locationLinkLabel")}
                                                                                                </a>
                                                                                        </div>
                                                                                )
                                                                        ) : (
                                                                                <div className='flex h-64 w-full items-center justify-center bg-white/50 text-payzone-navy/70'>
                                                                                        <span>{t("checkout.form.locationPlaceholder")}</span>
                                                                                </div>
                                                                        )}
                                                                </div>
                                                        </div>

                                                        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                                                                <motion.button
                                                                        type='button'
                                                                        onClick={handleShareLocation}
                                                                        disabled={isRequestingLocation}
                                                                        className='btn-primary w-full rounded-lg px-5 py-3 text-base font-semibold transition duration-300 focus:outline-none focus:ring-4 focus:ring-payzone-indigo/40 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto'
                                                                        whileHover={{ scale: 1.02 }}
                                                                        whileTap={{ scale: 0.97 }}
                                                                >
                                                                        {isRequestingLocation
                                                                                ? t("common.status.processing")
                                                                                : t("checkout.form.shareLocationButton")}
                                                                </motion.button>
                                                                {locationError && (
                                                                        <p className='text-sm text-payzone-navy/70'>
                                                                                {t("checkout.form.locationError")}
                                                                        </p>
                                                                )}
                                                        </div>

                                                        {locationError && (
                                                                <div className='space-y-2 rounded-lg border border-payzone-indigo/30 bg-white/60 p-3'>
                                                                        <label className='block text-sm font-medium' htmlFor='manualAddress'>
                                                                                {t("checkout.form.manualAddress")}
                                                                        </label>
                                                                        <textarea
                                                                                id='manualAddress'
                                                                                value={manualAddress}
                                                                                onChange={(event) => setManualAddress(event.target.value)}
                                                                                rows={3}
                                                                                className='w-full rounded-lg border border-payzone-indigo/40 bg-white px-4 py-2 text-[var(--text-dark)] placeholder-[var(--placeholder-color)] focus:border-payzone-gold focus:outline-none focus:ring-2 focus:ring-payzone-indigo'
                                                                                placeholder={t("checkout.form.manualAddressPlaceholder")}
                                                                                required={!location}
                                                                        />
                                                                </div>
                                                        )}
                                                </div>

                                                <motion.button
                                                        type='submit'
                                                        disabled={!isFormValid || isSubmitting}
                                                        className='btn-primary w-full rounded-lg px-5 py-3 text-base font-semibold transition duration-300 focus:outline-none focus:ring-4 focus:ring-payzone-indigo/40 disabled:cursor-not-allowed disabled:opacity-50'
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.97 }}
                                                >
                                                        {isSubmitting ? t("common.status.processing") : t("checkout.sendButton")}
                                                </motion.button>
                                        </form>
                                </motion.section>

                                <motion.aside
                                        className='w-full rounded-xl border border-payzone-indigo/40 bg-white/80 p-6 shadow-lg backdrop-blur-sm lg:max-w-sm'
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.4, delay: 0.1 }}
                                >
                                        <h2 className='text-xl font-semibold'>{t("checkout.summary.title")}</h2>
                                        <ul className='mt-4 space-y-3 text-sm'>
                                                {cart.map((item) => {
                                                        const { price, discountedPrice, isDiscounted } = getProductPricing(item);
                                                        return (
                                                                <li key={item._id} className='flex justify-between gap-4'>
                                                                        <span className='font-medium'>{item.name}</span>
                                                                        <span className='flex flex-col items-end text-[var(--text-dark)]'>
                                                                                {isDiscounted && (
                                                                                        <span className='text-xs text-payzone-gold/80 line-through'>
                                                                                                {formatNumberEn(item.quantity)} × {formatMRU(price)}
                                                                                        </span>
                                                                                )}
                                                                                <span>
                                                                                        {formatNumberEn(item.quantity)} × {formatMRU(discountedPrice)}
                                                                                </span>
                                                                        </span>
                                                                </li>
                                                        );
                                                })}
                                        </ul>

                                        <div className='mt-6 space-y-2 border-t border-payzone-indigo/20 pt-4 text-sm'>
                                                <div className='flex justify-between'>
                                                        <span>{t("checkout.summary.subtotal")}</span>
                                                        <span>{formatMRU(subtotal)}</span>
                                                </div>
                                                {savings > 0 && (
                                                        <div className='flex justify-between text-payzone-gold'>
                                                                <span>{t("checkout.summary.savings")}</span>
                                                                <span>-{formatMRU(savings)}</span>
                                                        </div>
                                                )}
                                                <div className='flex justify-between text-base font-semibold'>
                                                        <span>{t("checkout.summary.total")}</span>
                                                        <span>{formatMRU(total)}</span>
                                                </div>
                                        </div>

                                        <p className='mt-4 text-xs text-[var(--text-dark)] opacity-80'>{t("checkout.summary.notice")}</p>
                                </motion.aside>
                        </div>
                </div>
        );
};

export default CheckoutPage;

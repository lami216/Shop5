import { ArrowRight, CheckCircle, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useTranslation from "../hooks/useTranslation";
import { useCartStore } from "../stores/useCartStore";
import apiClient from "../lib/apiClient";
import { formatMRU } from "../lib/formatMRU";
import { formatNumberEn } from "../lib/formatNumberEn";
import { getProductPricing } from "../lib/getProductPricing";

const ORDER_DETAILS_KEY = "lastOrderDetails";

const PurchaseSuccessPage = () => {
        const [isProcessing, setIsProcessing] = useState(true);
        const { clearCart } = useCartStore();
        const [error, setError] = useState(null);
        const [isWhatsAppOrder, setIsWhatsAppOrder] = useState(false);
        const [orderDetails, setOrderDetails] = useState(null);
        const location = useLocation();
        const navigate = useNavigate();
        const { t } = useTranslation();

        useEffect(() => {
                if (isWhatsAppOrder) return;

                const pendingWhatsAppOrder = sessionStorage.getItem("whatsappOrderSent");
                const isWhatsAppState = location.state?.orderType === "whatsapp";

                const handleCheckoutSuccess = async (sessionId) => {
                        try {
                                await apiClient.post("/payments/checkout-success", { sessionId });
                                await clearCart();
                        } catch (requestError) {
                                console.log(requestError);
                        } finally {
                                setIsProcessing(false);
                        }
                };

                const finalizeWhatsAppOrder = async () => {
                        setIsWhatsAppOrder(true);
                        await clearCart();
                        setIsProcessing(false);
                        setError(null);
                };

                const sessionId = new URLSearchParams(window.location.search).get("session_id");
                if (isWhatsAppState) {
                        sessionStorage.removeItem("whatsappOrderSent");
                        finalizeWhatsAppOrder();
                        navigate(window.location.pathname, { replace: true, state: null });
                } else if (sessionId) {
                        sessionStorage.removeItem("whatsappOrderSent");
                        handleCheckoutSuccess(sessionId);
                } else if (pendingWhatsAppOrder) {
                        sessionStorage.removeItem("whatsappOrderSent");
                        finalizeWhatsAppOrder();
                } else {
                        setIsProcessing(false);
                        setError(t("common.messages.noSessionId"));
                }
        }, [clearCart, isWhatsAppOrder, location, navigate, t]);

        useEffect(() => {
                if (location.state?.orderDetails) {
                        setOrderDetails(location.state.orderDetails);
                        sessionStorage.setItem(ORDER_DETAILS_KEY, JSON.stringify(location.state.orderDetails));
                        return;
                }

                const storedOrderDetails = sessionStorage.getItem(ORDER_DETAILS_KEY);

                if (!storedOrderDetails) return;

                try {
                        const parsed = JSON.parse(storedOrderDetails);
                        setOrderDetails(parsed);
                } catch (parseError) {
                        console.error("Unable to parse stored order details", parseError);
                }
        }, [location.state]);

        const storedItems = useMemo(() => orderDetails?.items ?? [], [orderDetails?.items]);

        const derivedSummary = useMemo(() => {
                const totals = storedItems.reduce(
                        (accumulator, item) => {
                                const quantity = Number(item.quantity) || 0;
                                const { discountedPrice } = getProductPricing(item);
                                accumulator.count += quantity;
                                accumulator.total += discountedPrice * quantity;
                                return accumulator;
                        },
                        { count: 0, total: 0 }
                );

                return totals;
        }, [storedItems]);

        const totalCount = orderDetails?.summary?.totalQuantity ?? derivedSummary.count;
        const totalAmount = orderDetails?.summary?.total ?? derivedSummary.total;

        if (isProcessing)
                return (
                        <div className='flex h-screen items-center justify-center text-white'>
                                {t("purchase.success.processing")}
                        </div>
                );

        if (error)
                return (
                        <div className='flex h-screen items-center justify-center text-white'>
                                {t("purchase.success.error", { message: error })}
                        </div>
                );

        const heading = isWhatsAppOrder
                ? t("purchase.success.headingWhatsApp")
                : t("purchase.success.heading");
        const description = isWhatsAppOrder
                ? t("purchase.success.subheadingWhatsApp")
                : "شكرًا لاختيارك متجرنا. سنتواصل معك للتحقق من تفاصيل العنوان.";

        return (
                <div className='min-h-screen bg-payzone-navy px-4 py-10 text-payzone-navy sm:py-16' dir='rtl'>
                        <div className='mx-auto w-full max-w-4xl'>
                                <div className='h-5 sm:h-7' aria-hidden='true' />
                                <section className='rounded-3xl bg-white/95 p-6 shadow-xl ring-1 ring-black/5 sm:p-10'>
                                        <div className='flex flex-col items-center text-center'>
                                                <span className='flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600'>
                                                        <CheckCircle className='h-6 w-6' />
                                                </span>
                                                <h1 className='mt-4 text-3xl font-bold sm:text-4xl'>{heading}</h1>
                                                <p className='mt-3 max-w-2xl text-base text-payzone-navy/70 sm:text-lg'>{description}</p>
                                        </div>

                                        <div className='mt-6 flex justify-center'>
                                                <button
                                                        type='button'
                                                        onClick={() => navigate("/")}
                                                        className='inline-flex min-h-[3.25rem] min-w-[14rem] items-center justify-center gap-2 rounded-full bg-payzone-navy px-8 text-base font-semibold text-white shadow-lg transition hover:bg-payzone-navy/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-payzone-navy/60'
                                                >
                                                        <ArrowRight className='h-5 w-5' style={{ transform: "scaleX(-1)" }} />
                                                        {t("purchase.success.backToStore")}
                                                </button>
                                        </div>

                                        {orderDetails?.orderNumber && (
                                                <div className='mt-6 flex justify-center'>
                                                        <div className='rounded-2xl border border-payzone-gold/40 bg-payzone-gold/10 px-6 py-3 text-center text-payzone-navy shadow-sm'>
                                                                <div className='text-sm font-semibold text-payzone-navy'>
                                                                        {t("purchase.success.details.orderNumberLabel", {
                                                                                orderNumber: formatNumberEn(orderDetails.orderNumber),
                                                                        })}
                                                                </div>
                                                                <div className='mt-1 text-xs text-payzone-navy/70'>
                                                                        {t("purchase.success.details.orderTotalLabel", {
                                                                                amount: formatMRU(totalAmount),
                                                                        })}
                                                                </div>
                                                        </div>
                                                </div>
                                        )}

                                        <section className='mt-8 space-y-6'>
                                                {orderDetails ? (
                                                        <>
                                                                <div className='rounded-2xl border border-payzone-navy/10 bg-white p-5 shadow-sm sm:p-6'>
                                                                        <div className='text-sm font-semibold text-payzone-navy/50'>
                                                                                {t("purchase.success.details.customer")}
                                                                        </div>
                                                                        <div className='mt-4 space-y-3 text-right text-base font-medium'>
                                                                                <div className='flex items-baseline justify-between gap-4'>
                                                                                        <span className='text-payzone-navy/50'>
                                                                                                {t("purchase.success.details.name")}
                                                                                        </span>
                                                                                        <span className='flex-1 text-left text-payzone-navy'>{orderDetails?.customerName || "-"}</span>
                                                                                </div>
                                                                                <div className='flex items-baseline justify-between gap-4'>
                                                                                        <span className='text-payzone-navy/50'>
                                                                                                {t("purchase.success.details.phone")}
                                                                                        </span>
                                                                                        <span className='flex-1 text-left text-payzone-navy'>{orderDetails?.phone || "-"}</span>
                                                                                </div>
                                                                                <div className='flex items-baseline justify-between gap-4'>
                                                                                        <span className='text-payzone-navy/50'>
                                                                                                {t("purchase.success.details.address")}
                                                                                        </span>
                                                                                        <span className='flex-1 text-left text-payzone-navy'>{orderDetails?.address || "-"}</span>
                                                                                </div>
                                                                        </div>
                                                                </div>

                                                                <div className='overflow-hidden rounded-2xl border border-payzone-navy/15 bg-white shadow-sm'>
                                                                        <table className='min-w-full border-collapse text-right text-sm sm:text-base'>
                                                                                <thead className='bg-payzone-navy/5 text-payzone-navy/70'>
                                                                                        <tr>
                                                                                                <th scope='col' className='px-4 py-3 font-medium'>
                                                                                                        {t("purchase.success.details.image")}
                                                                                                </th>
                                                                                                <th scope='col' className='px-4 py-3 font-medium'>
                                                                                                        {t("purchase.success.details.products")}
                                                                                                </th>
                                                                                                <th scope='col' className='px-4 py-3 text-left font-medium'>
                                                                                                        {t("purchase.success.details.quantity")}
                                                                                                </th>
                                                                                                <th scope='col' className='px-4 py-3 text-left font-medium'>
                                                                                                        {t("purchase.success.details.unitPrice")}
                                                                                                </th>
                                                                                                <th scope='col' className='px-4 py-3 text-left font-medium'>
                                                                                                        {t("purchase.success.details.total")}
                                                                                                </th>
                                                                                        </tr>
                                                                                </thead>
                                                                                <tbody className='text-payzone-navy'>
                                                                                        {storedItems.length > 0 ? (
                                                                                                storedItems.map((item) => {
                                                                                                        const {
                                                                                                                price: originalPrice,
                                                                                                                discountedPrice,
                                                                                                                isDiscounted,
                                                                                                        } = getProductPricing(item);
                                                                                                        const lineTotal = discountedPrice * (item.quantity || 0);
                                                                                                        return (
                                                                                                                <tr
                                                                                                                        key={item.id || item._id || item.name}
                                                                                                                        className='border-b border-payzone-navy/10 last:border-b-0'
                                                                                                                >
                                                                                                                        <td className='px-4 py-4 align-middle'>
                                                                                                                                <div className='flex justify-center'>
                                                                                                                                        {item.image ? (
                                                                                                                                                <img
                                                                                                                                                        src={item.image}
                                                                                                                                                        alt={item.name}
                                                                                                                                                        className='h-16 w-16 rounded-lg object-cover'
                                                                                                                                                />
                                                                                                                                        ) : (
                                                                                                                                                <div className='grid h-16 w-16 place-items-center rounded-lg bg-payzone-navy/10 text-payzone-navy/40'>
                                                                                                                                                        <ShoppingBag className='h-6 w-6' />
                                                                                                                                                </div>
                                                                                                                                        )}
                                                                                                                                </div>
                                                                                                                        </td>
                                                                                                                        <td className='px-4 py-4 align-middle text-right'>
                                                                                                                                <span
                                                                                                                                        className='block font-semibold'
                                                                                                                                        style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" }}
                                                                                                                                >
                                                                                                                                        {item.name}
                                                                                                                                </span>
                                                                                                                        </td>
                                                                                                                        <td className='px-4 py-4 align-middle text-left font-semibold'>
                                                                                                                                {formatNumberEn(item.quantity || 0)}
                                                                                                                        </td>
                                                                                                                        <td className='px-4 py-4 align-middle text-left text-payzone-navy/70'>
                                                                                                                                <div className='flex flex-col items-start'>
                                                                                                                                        {isDiscounted && (
                                                                                                                                                <span className='text-xs text-payzone-navy/50 line-through'>
                                                                                                                                                        {formatMRU(originalPrice)}
                                                                                                                                                </span>
                                                                                                                                        )}
                                                                                                                                        <span className='font-semibold text-payzone-navy'>
                                                                                                                                                {formatMRU(discountedPrice)}
                                                                                                                                        </span>
                                                                                                                                </div>
                                                                                                                        </td>
                                                                                                                        <td className='px-4 py-4 align-middle text-left font-semibold'>
                                                                                                                                {formatMRU(lineTotal)}
                                                                                                                        </td>
                                                                                                                </tr>
                                                                                                        );
                                                                                                })
                                                                                        ) : (
                                                                                                <tr>
                                                                                                        <td colSpan={5} className='px-4 py-6 text-center text-payzone-navy/50'>
                                                                                                                {t("purchase.success.details.empty")}
                                                                                                        </td>
                                                                                                </tr>
                                                                                        )}
                                                                                </tbody>
                                                                        </table>
                                                                </div>

                                                                <div className='rounded-2xl border border-payzone-navy/15 bg-white p-5 shadow-sm sm:p-6'>
                                                                        <div className='flex items-center justify-between text-base text-payzone-navy/70'>
                                                                                <span>{t("purchase.success.details.countLabel")}</span>
                                                                                <span className='text-lg font-semibold text-payzone-navy'>{formatNumberEn(totalCount)}</span>
                                                                        </div>
                                                                        <div className='mt-3 flex items-center justify-between border-t border-payzone-navy/10 pt-3 text-base text-payzone-navy/70'>
                                                                                <span>{t("purchase.success.details.grandTotalLabel")}</span>
                                                                                <span className='text-lg font-semibold text-payzone-navy'>{formatMRU(totalAmount)}</span>
                                                                        </div>
                                                                </div>
                                                        </>
                                                ) : (
                                                        <div className='rounded-2xl border border-payzone-navy/15 bg-white p-6 text-center text-payzone-navy/70'>
                                                                {t("purchase.success.noDetails")}
                                                        </div>
                                                )}
                                        </section>
                                </section>
                        </div>
                </div>
        );
};

export default PurchaseSuccessPage;

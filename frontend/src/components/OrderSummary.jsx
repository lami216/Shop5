import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import { useNavigate } from "react-router-dom";
import useTranslation from "../hooks/useTranslation";
import { formatMRU } from "../lib/formatMRU";
import { formatNumberEn } from "../lib/formatNumberEn";

const OrderSummary = () => {
        const { cart, total, discountedSubtotal, coupon, totalDiscountAmount, isCouponApplied } =
                useCartStore();
        const navigate = useNavigate();
        const { t } = useTranslation();

        const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
        const isDisabled = totalQuantity === 0;
        const couponSavings = Math.max(
                Number.isFinite(totalDiscountAmount) ? totalDiscountAmount : 0,
                discountedSubtotal - total,
                0
        );
        const hasCouponSavings = Boolean(coupon?.code) && couponSavings > 0 && isCouponApplied;

        const handleCheckout = () => {
                if (isDisabled) return;
                navigate("/checkout");
        };

        return (
                <motion.section
                        className='space-y-5 rounded-3xl border border-white/12 bg-white/5 p-6 text-white shadow-xl shadow-black/20 backdrop-blur-md'
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        dir='rtl'
                >
                        <h2 className='text-[clamp(1.4rem,3.2vw,1.7rem)] font-semibold text-payzone-gold text-right'>
                                {t("cart.summary.title")}
                        </h2>

                        <div className='space-y-3 rounded-2xl border border-white/12 bg-payzone-navy/70 p-5 text-[clamp(0.95rem,2.4vw,1rem)] text-white/80 shadow-inner'>
                                <div className='flex items-center justify-between'>
                                        <span>{t("cart.summary.productsCount")}</span>
                                        <span className='text-[clamp(1.05rem,2.6vw,1.2rem)] font-semibold text-white'>
                                                {formatNumberEn(totalQuantity)}
                                        </span>
                                </div>
                                <div className='flex items-center justify-between border-t border-white/12 pt-3'>
                                        <span>{t("cart.summary.discountedSubtotal")}</span>
                                        <span className='text-[clamp(1.05rem,2.6vw,1.2rem)] font-semibold text-white'>
                                                {formatMRU(discountedSubtotal)}
                                        </span>
                                </div>
                                {hasCouponSavings && (
                                        <div className='flex items-center justify-between border-t border-white/12 pt-3 text-sm text-emerald-300'>
                                                <span>{t("cart.summary.couponSavings")}</span>
                                                <span>-{formatMRU(couponSavings)}</span>
                                        </div>
                                )}
                                <div className='flex items-center justify-between border-t border-white/12 pt-3 text-[clamp(1.1rem,2.8vw,1.3rem)] font-semibold'>
                                        <span className='text-payzone-gold'>{t("cart.summary.grandTotal")}</span>
                                        <span className='text-white'>{formatMRU(total)}</span>
                                </div>
                        </div>

                        <motion.button
                                type='button'
                                className='w-full rounded-full bg-payzone-gold px-6 py-3 text-sm font-semibold text-payzone-navy transition-colors duration-300 hover:bg-[#b8873d] focus:outline-none focus-visible:ring-2 focus-visible:ring-payzone-gold focus-visible:ring-offset-2 focus-visible:ring-offset-payzone-navy disabled:cursor-not-allowed disabled:opacity-60 md:w-1/2 md:self-end'
                                whileHover={!isDisabled ? { scale: 1.02 } : undefined}
                                whileTap={!isDisabled ? { scale: 0.97 } : undefined}
                                onClick={handleCheckout}
                                disabled={isDisabled}
                        >
                                {t("cart.summary.proceed")}
                        </motion.button>
                </motion.section>
        );
};
export default OrderSummary;

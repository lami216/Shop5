import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import useTranslation from "../hooks/useTranslation";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";

const GiftCouponCard = () => {
        const [userInputCode, setUserInputCode] = useState("");
        const user = useUserStore((state) => state.user);
        const { coupon, isCouponApplied, applyCoupon, removeCoupon } = useCartStore();
        const { t } = useTranslation();

        useEffect(() => {
                if (!user) {
                        setUserInputCode("");
                        return;
                }

                if (coupon?.code) {
                        setUserInputCode(coupon.code);
                        return;
                }

                setUserInputCode("");
        }, [coupon, user]);

        const handleApplyCoupon = () => {
                if (!userInputCode) return;

                if (!user) {
                        toast.error(t("common.messages.loginRequiredForCoupon"));
                        return;
                }

                applyCoupon(userInputCode);
                setUserInputCode("");
        };

        const handleRemoveCoupon = () => {
                removeCoupon();
        };

        return (
                <motion.div
                        className='space-y-4 rounded-xl border border-brand-border bg-white p-4 shadow-sm sm:p-6'
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                >
                        <div className='space-y-4'>
                                <div>
                                        <label htmlFor='voucher' className='mb-2 block text-sm font-medium text-payzone-gold/80'>
                                                {t("cart.coupon.label")}
                                        </label>
                                        <input
                                                type='text'
                                                id='voucher'
                                                className='block w-full rounded-lg border border-brand-border/70 bg-white p-2.5 text-sm text-payzone-gold placeholder-[rgba(30,30,30,0.6)] focus:border-payzone-gold focus:outline-none focus:ring-2 focus:ring-payzone-gold/60'
                                                placeholder={t("cart.coupon.placeholder")}
                                                value={userInputCode}
                                                onChange={(e) => setUserInputCode(e.target.value)}
                                                required
                                        />
                                </div>

                                <motion.button
                                        type='button'
                                        className='flex w-full items-center justify-center rounded-lg bg-payzone-gold px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-[#222222] focus:outline-none focus:ring-4 focus:ring-payzone-indigo/40'
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleApplyCoupon}
                                >
                                        {t("cart.coupon.apply")}
                                </motion.button>
                        </div>
                        {isCouponApplied && coupon?.code && (
                                <div className='mt-4 rounded-lg border border-brand-border/60 bg-[#fce6ec] p-4'>
                                        <h3 className='text-lg font-medium text-payzone-gold'>
                                                {t("cart.coupon.appliedTitle")}
                                        </h3>

                                        <p className='mt-2 text-sm text-payzone-gold/80'>
                                                {t("cart.coupon.discount", {
                                                        code: coupon.code,
                                                        discount: coupon.discountPercentage,
                                                })}
                                        </p>

                                        <motion.button
                                                type='button'
                                                className='mt-3 flex w-full items-center justify-center rounded-lg border border-brand-border bg-white px-5 py-2.5 text-sm font-medium text-payzone-gold transition-colors duration-300 hover:bg-[#fce6ec] focus:outline-none focus:ring-4 focus:ring-payzone-gold/40'
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleRemoveCoupon}
                                        >
                                                {t("cart.coupon.remove")}
                                        </motion.button>
                                </div>
                        )}
                </motion.div>
        );
};
export default GiftCouponCard;

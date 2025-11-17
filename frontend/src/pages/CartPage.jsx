import { Link } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import useTranslation from "../hooks/useTranslation";
import CartItem from "../components/CartItem";
import OrderSummary from "../components/OrderSummary";
import GiftCouponCard from "../components/GiftCouponCard";

const CartPage = () => {
        const { cart } = useCartStore();
        const { t } = useTranslation();
        const leadText = t("cart.summary.lead");

        return (
                <div className='min-h-screen bg-gradient-to-b from-payzone-navy via-[#0b1f3a] to-[#08112a] py-10 text-white sm:py-16' dir='rtl'>
                        <div className='mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8'>
                                <header className='space-y-2 text-center md:text-right'>
                                        <h1 className='text-[clamp(2rem,4vw,2.6rem)] font-bold text-white'>{t("cart.title")}</h1>
                                        {leadText && <p className='text-sm text-white/70'>{leadText}</p>}
                                </header>

                                <section className='mt-8 space-y-5'>
                                        {cart.length === 0 ? (
                                                <EmptyCartUI t={t} />
                                        ) : (
                                                <div className='space-y-4'>
                                                        {cart.map((item) => (
                                                                <CartItem key={item._id} item={item} />
                                                        ))}
                                                </div>
                                        )}
                                </section>

                                {cart.length > 0 && (
                                        <div className='mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)] xl:grid-cols-[1fr,0.9fr]'>
                                                <GiftCouponCard />
                                                <OrderSummary />
                                        </div>
                                )}
                        </div>
                </div>
        );
};
export default CartPage;

const EmptyCartUI = ({ t }) => (
        <motion.div
                className='flex flex-col items-center justify-center space-y-4 rounded-3xl border border-white/10 bg-white/5 px-8 py-16 text-center shadow-xl shadow-black/20 backdrop-blur-md'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
        >
                <ShoppingCart className='h-20 w-20 text-payzone-gold' />
                <h3 className='text-[clamp(1.5rem,3vw,1.9rem)] font-semibold text-white'>{t("cart.empty.title")}</h3>
                <p className='max-w-md text-sm text-white/70'>{t("cart.empty.description")}</p>
                <Link
                        className='mt-4 inline-flex min-h-[3rem] min-w-[12rem] items-center justify-center rounded-full bg-payzone-gold px-6 text-sm font-semibold text-payzone-navy transition duration-300 hover:bg-[#b8873d] focus:outline-none focus-visible:ring-2 focus-visible:ring-payzone-gold focus-visible:ring-offset-2 focus-visible:ring-offset-payzone-navy'
                        to='/'
                >
                        {t("cart.empty.cta")}
                </Link>
        </motion.div>
);

import { ShoppingCart, UserPlus, LogIn, LogOut, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import useTranslation from "../hooks/useTranslation";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";

const Navbar = () => {
        const { user, logout } = useUserStore();
        const isAdmin = user?.role === "admin";
        const { cart } = useCartStore();
        const cartItemCount = cart.reduce((total, item) => total + (item.quantity ?? 0), 0);
        const { t } = useTranslation();

        const cartLink = (
                <Link
                        to={'/cart'}
                        className='relative group flex items-center gap-2 rounded-md border border-brand-border bg-[#fce6ec] px-3.5 py-1.5 text-sm font-semibold text-payzone-gold shadow-sm transition-colors duration-300 hover:bg-[#f6dde2] md:px-4 md:py-2'
                >
                        <ShoppingCart size={18} />
                        <span className='hidden sm:inline'>{t("nav.cart")}</span>
                        {cartItemCount > 0 && (
                                <span className='absolute -top-2 -right-2 rounded-full border border-[#e28aae] bg-[#e28aae] px-2 py-0.5 text-xs font-semibold text-black shadow-sm transition duration-300 ease-in-out group-hover:bg-[#ec9cb8]'>
                                        {cartItemCount}
                                </span>
                        )}
                </Link>
        );

        return (
                <header className='navbar fixed top-0 right-0 w-full border-b border-brand-border shadow-lg backdrop-blur-xl transition-all duration-300 z-40'>
                        <div className='navbar-inner container mx-auto px-4 py-2 md:py-3'>
                                <div className='mobile-navbar flex flex-wrap items-center justify-between gap-3 md:gap-4'>
                                        <Link to='/' className='order-1 flex items-center gap-3 text-payzone-gold'>
                                                <img
                                                        src='/logo.png'
                                                        alt='شعار بوتيك'
                                                        className='h-12 w-12 object-contain drop-shadow-[0_4px_12px_rgba(226,138,174,0.35)]'
                                                />
                                                <span className='text-2xl font-semibold uppercase tracking-wide'>{t("common.appName")}</span>
                                        </Link>

                                        <div className='mobile-auth-actions order-2 flex items-center gap-2 text-sm font-medium md:order-3 md:gap-3'>
                                                {user ? (
                                                        <button
                                                                className='flex items-center gap-2 rounded-md border border-brand-border bg-white px-3.5 py-1.5 text-payzone-gold shadow-sm transition-colors duration-300 hover:bg-[#fce6ec] md:px-4 md:py-2'
                                                                onClick={logout}
                                                        >
                                                                <LogOut size={18} />
                                                                <span className='hidden sm:inline'>{t("nav.logout")}</span>
                                                        </button>
                                                ) : (
                                                        <>
                                                                <Link
                                                                        to={'/signup'}
                                                                className='flex items-center gap-2 rounded-md border border-brand-border bg-payzone-gold px-3 py-1 text-sm font-semibold text-white shadow-sm transition-colors duration-300 hover:bg-[#222222] hover:text-white active:text-white md:px-3.5 md:py-1.5'
                                                                >
                                                                        <UserPlus size={16} />
                                                                        {t("nav.signup")}
                                                                </Link>
                                                                <Link
                                                                        to={'/login'}
                                                                        className='flex items-center gap-2 rounded-md border border-brand-border bg-white px-3 py-1 text-sm text-payzone-gold shadow-sm transition-colors duration-300 hover:bg-[#fce6ec] md:px-3.5 md:py-1.5'
                                                                >
                                                                        <LogIn size={16} />
                                                                        {t("nav.login")}
                                                                </Link>
                                                        </>
                                                )}
                                        </div>

                                        <div className='mobile-nav-row order-3 flex w-full flex-wrap items-center justify-between gap-2 text-sm font-medium md:order-2 md:w-auto md:flex-nowrap md:gap-4'>
                                                <nav className='flex items-center gap-3 md:gap-4'>
                                                        <Link
                                                                to={'/'}
                                                                className='brand-link text-payzone-gold hover:text-[#222222]'
                                                        >
                                                                {t("nav.home")}
                                                        </Link>
                                                        {isAdmin && (
                                                                <Link
                                                                        className='flex items-center gap-2 rounded-md border border-brand-border bg-white px-3 py-1 text-payzone-gold shadow-sm transition-colors duration-300 hover:bg-[#fce6ec]'
                                                                        to={'/secret-dashboard'}
                                                                >
                                                                        <Lock className='inline-block' size={18} />
                                                                        <span className='hidden sm:inline'>{t("nav.dashboard")}</span>
                                                                </Link>
                                                        )}
                                                </nav>

                                                <div className='md:hidden'>{cartLink}</div>
                                        </div>

                                        <div className='hidden items-center gap-3 md:flex'>{cartLink}</div>
                                </div>
                        </div>
                </header>
        );
};
export default Navbar;

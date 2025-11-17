import { Bike } from "lucide-react";
import { Link } from "react-router-dom";

const CourierInviteSection = () => {
        return (
                <section className='border-t border-brand-border bg-payzone-white/90' aria-label='انضمام الموصّلين'>
                        <div className='mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 text-center sm:flex-row sm:text-right' dir='rtl'>
                                <div className='space-y-2 sm:text-right'>
                                        <p className='text-xs font-semibold uppercase tracking-[0.3em] text-payzone-navy/60'>فرصة عمل</p>
                                        <h2 className='text-2xl font-bold text-payzone-navy sm:text-3xl'>معك دراجة وتحب تشتغل توصيل؟</h2>
                                        <p className='max-w-3xl text-base text-payzone-navy/80 sm:text-lg'>
                                                انضم لفريق الموصّلين لدينا واشتغل على طلبات بوتيك MK عبر واتساب
                                        </p>
                                </div>
                                <div className='flex w-full justify-center sm:w-auto'>
                                        <Link
                                                to='/become-driver'
                                                className='courier-cta-button courier-cta-pulse group inline-flex w-full flex-row-reverse items-center justify-center gap-3 rounded-full px-6 py-3 text-lg font-semibold sm:w-auto sm:px-8 sm:py-3.5'
                                                aria-label='التوجه لنموذج انضمام الموصّلين'
                                        >
                                                <span className='whitespace-nowrap text-payzone-navy'>انضم لطاقم التوصيل</span>
                                                <Bike className='h-5 w-5 text-payzone-navy transition-transform duration-500 ease-out group-hover:translate-y-[-2px] group-hover:scale-110 group-active:translate-y-[-1px]' />
                                        </Link>
                                </div>
                        </div>
                </section>
        );
};

export default CourierInviteSection;

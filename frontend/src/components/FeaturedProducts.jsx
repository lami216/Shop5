import { useEffect, useMemo, useState } from "react";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import useTranslation from "../hooks/useTranslation";
import { useCartStore } from "../stores/useCartStore";
import { formatMRU } from "../lib/formatMRU";
import { getProductPricing } from "../lib/getProductPricing";

const FeaturedProducts = ({ featuredProducts }) => {
        const [currentIndex, setCurrentIndex] = useState(0);
        const [itemsPerPage, setItemsPerPage] = useState(4);

        const { addToCart } = useCartStore();
        const { t } = useTranslation();

        const products = useMemo(
                () => (Array.isArray(featuredProducts) ? featuredProducts : []),
                [featuredProducts]
        );
        const totalItems = products.length;

        useEffect(() => {
                const handleResize = () => {
                        if (window.innerWidth < 640) setItemsPerPage(1);
                        else if (window.innerWidth < 1024) setItemsPerPage(2);
                        else if (window.innerWidth < 1280) setItemsPerPage(3);
                        else setItemsPerPage(4);
                };

                handleResize();
                window.addEventListener("resize", handleResize);
                return () => window.removeEventListener("resize", handleResize);
        }, []);

        useEffect(() => {
                setCurrentIndex((previous) =>
                        Math.min(previous, Math.max(totalItems - itemsPerPage, 0))
                );
        }, [totalItems, itemsPerPage]);

        const nextSlide = () => {
                setCurrentIndex((prevIndex) =>
                        Math.min(prevIndex + itemsPerPage, Math.max(totalItems - itemsPerPage, 0))
                );
        };

        const prevSlide = () => {
                setCurrentIndex((prevIndex) => Math.max(prevIndex - itemsPerPage, 0));
        };

        const isStartDisabled = currentIndex === 0;
        const isEndDisabled = currentIndex >= Math.max(totalItems - itemsPerPage, 0);

        return (
                <div className='py-12'>
                        <div className='container mx-auto px-4'>
                                <h2 className='mb-4 text-center text-5xl font-bold sm:text-6xl'>
                                        <span className='bg-gradient-to-r from-payzone-gold via-payzone-gold/80 to-payzone-indigo bg-clip-text text-transparent'>
                                                {t("home.featuredTitle")}
                                        </span>
                                </h2>
                                <div className='relative'>
                                        <div className='overflow-hidden'>
                                                <div
                                                        className='flex transition-transform duration-300 ease-in-out'
                                                        style={{ transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)` }}
                                                >
                                                        {products.map((product) => {
                                                                const { price, discountedPrice, isDiscounted, discountPercentage } =
                                                                        getProductPricing(product);
                                                                const enrichedProduct = {
                                                                        ...product,
                                                                        discountedPrice,
                                                                        isDiscounted,
                                                                        discountPercentage,
                                                                };
                                                                return (
                                                                        <div key={product._id} className='w-full flex-shrink-0 px-2 sm:w-1/2 lg:w-1/3 xl:w-1/4'>
                                                                                <div className='group flex h-full flex-col overflow-hidden rounded-xl border border-payzone-indigo/30 bg-white/5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-payzone-gold/60 hover:shadow-xl'>
                                                                                        <div className='relative overflow-hidden'>
                                                                                                {isDiscounted && (
                                                                                                        <span className='absolute right-3 top-3 z-10 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-lg'>
                                                                                                                -{discountPercentage}%
                                                                                                        </span>
                                                                                                )}
                                                                                                <img
                                                                                                        src={product.image}
                                                                                                        alt={product.name}
                                                                                                        className='h-48 w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110'
                                                                                                />
                                                                                        </div>
                                                                                        <div className='p-4'>
                                                                                                <h3 className='mb-2 text-lg font-semibold text-white'>{product.name}</h3>
                                                                                                <div className='mb-4 flex flex-wrap items-baseline gap-2'>
                                                                                                        {isDiscounted ? (
                                                                                                                <>
                                                                                                                        <span className='max-w-full break-words text-sm text-white/60 line-through'>
                                                                                                                                {formatMRU(price)}
                                                                                                                        </span>
                                                                                                                        <span className='max-w-full break-words text-lg font-bold text-red-300'>
                                                                                                                                {formatMRU(discountedPrice)}
                                                                                                                        </span>
                                                                                                                </>
                                                                                                        ) : (
                                                                                                                <span className='max-w-full break-words text-lg font-medium text-payzone-gold'>
                                                                                                                        {formatMRU(price)}
                                                                                                                </span>
                                                                                                        )}
                                                                                                </div>
                                                                                                <button
                                                                                                        onClick={() => addToCart(enrichedProduct)}
                                                                                                        className='flex w-full items-center justify-center gap-2 rounded bg-payzone-gold py-2 px-4 font-semibold text-payzone-navy transition-colors duration-300 hover:bg-[#b8873d]'
                                                                                                >
                                                                                                        <ShoppingCart className='h-5 w-5' />
                                                                                                        {t("common.actions.addToCart")}
                                                                                                </button>
                                                                                        </div>
                                                                                </div>
                                                                        </div>
                                                                );
                                                        })}
                                                </div>
                                        </div>
                                        <button
                                                onClick={prevSlide}
                                                disabled={isStartDisabled}
                                                className={`absolute top-1/2 -right-4 flex -translate-y-1/2 transform items-center justify-center rounded-full p-2 transition-colors duration-300 ${
                                                        isStartDisabled
                                                                ? "cursor-not-allowed bg-white/10 text-white/40"
                                                                : "bg-payzone-indigo text-white hover:bg-[#3b3ad6]"
                                                }`}
                                        >
                                                <ChevronRight className='h-6 w-6' />
                                        </button>

                                        <button
                                                onClick={nextSlide}
                                                disabled={isEndDisabled}
                                                className={`absolute top-1/2 -left-4 flex -translate-y-1/2 transform items-center justify-center rounded-full p-2 transition-colors duration-300 ${
                                                        isEndDisabled
                                                                ? "cursor-not-allowed bg-white/10 text-white/40"
                                                                : "bg-payzone-indigo text-white hover:bg-[#3b3ad6]"
                                                }`}
                                        >
                                                <ChevronLeft className='h-6 w-6' />
                                        </button>
                                </div>
                        </div>
                </div>
        );
};
export default FeaturedProducts;

import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import useTranslation from "../hooks/useTranslation";
import { useCartStore } from "../stores/useCartStore";
import { formatMRU } from "../lib/formatMRU";
import { getProductPricing } from "../lib/getProductPricing";

const ProductCard = ({ product }) => {
        const { addToCart } = useCartStore();
        const { t } = useTranslation();
        const { price, discountedPrice, isDiscounted, discountPercentage } = getProductPricing(product);
        const productForCart = {
                ...product,
                discountedPrice,
                isDiscounted,
                discountPercentage,
        };
        const coverImage =
                product.image ||
                (Array.isArray(product.images) && product.images.length > 0
                        ? typeof product.images[0] === "string"
                                ? product.images[0]
                                : product.images[0]?.url
                        : "");

        const handleAddToCart = () => {
                addToCart(productForCart);
        };

        return (
                <div className='group relative flex w-full flex-col overflow-hidden rounded-xl border border-payzone-indigo/30 bg-white/5 shadow-lg transition-all duration-300 hover:border-payzone-gold/60 hover:shadow-xl sm:aspect-[3/4] lg:aspect-square'>
                        <Link
                                to={`/products/${product._id}`}
                                className='relative aspect-[4/5] w-full overflow-hidden min-h-[14rem] sm:min-h-0 sm:aspect-square'
                                aria-label={t("product.viewDetails", { name: product.name })}
                        >
                                {isDiscounted && (
                                        <span className='absolute right-3 top-3 z-10 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-lg'>
                                                -{discountPercentage}%
                                        </span>
                                )}
                                {coverImage ? (
                                        <img
                                                className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-110'
                                                src={coverImage}
                                                alt={product.name}
                                        />
                                ) : (
                                        <div className='flex h-full w-full items-center justify-center bg-payzone-navy/70 text-sm text-white/60'>
                                                {t("common.status.noImage")}
                                        </div>
                                )}
                                <div className='pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-payzone-navy/60 via-payzone-navy/20 to-transparent' />
                        </Link>

                        <div className='mt-4 flex flex-1 flex-col px-5 pb-5'>
                                <Link to={`/products/${product._id}`} className='block transition-colors duration-300 hover:text-payzone-gold'>
                                        <h5 className='text-lg font-semibold tracking-tight text-white'>{product.name}</h5>
                                </Link>
                                <div className='mt-3 flex flex-wrap items-baseline gap-2'>
                                        {isDiscounted ? (
                                                <>
                                                        <span className='max-w-full break-words text-sm text-white/60 line-through'>{formatMRU(price)}</span>
                                                        <span className='max-w-full break-words text-lg font-bold text-red-300'>{formatMRU(discountedPrice)}</span>
                                                </>
                                        ) : (
                                                <span className='max-w-full break-words text-lg font-semibold leading-tight text-payzone-gold'>
                                                        {formatMRU(price)}
                                                </span>
                                        )}
                                </div>
                                <button
                                        className='mt-auto flex items-center justify-center gap-2 rounded-lg bg-payzone-gold px-5 py-2 text-sm font-medium text-payzone-navy transition-colors duration-300 hover:bg-[#b8873d] focus:outline-none focus:ring-4 focus:ring-payzone-indigo/40'
                                        onClick={handleAddToCart}
                                >
                                        <ShoppingCart size={20} />
                                        {t("common.actions.addToCart")}
                                </button>
                        </div>
                </div>
        );
};
export default ProductCard;

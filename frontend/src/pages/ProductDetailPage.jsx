import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useParams } from "react-router-dom";
import { useProductStore } from "../stores/useProductStore";
import { useCartStore } from "../stores/useCartStore";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatMRU } from "../lib/formatMRU";
import PeopleAlsoBought from "../components/PeopleAlsoBought";
import useTranslation from "../hooks/useTranslation";
import { getProductPricing } from "../lib/getProductPricing";

const resolveCoverImage = (product) => {
        if (!product) return null;

        if (product.image) {
                return product.image;
        }

        if (Array.isArray(product.images) && product.images.length > 0) {
                const [firstImage] = product.images;
                return typeof firstImage === "string" ? firstImage : firstImage?.url || null;
        }

        return null;
};

const mapGalleryImages = (product) => {
        if (!product) return [];

        if (Array.isArray(product.images) && product.images.length > 0) {
                return product.images
                        .map((image) => (typeof image === "string" ? image : image?.url))
                        .filter(Boolean);
        }

        return product.image ? [product.image] : [];
};

const ProductDetailPage = () => {
        const { id } = useParams();
        const { selectedProduct, fetchProductById, productDetailsLoading, clearSelectedProduct } = useProductStore(
                (state) => ({
                        selectedProduct: state.selectedProduct,
                        fetchProductById: state.fetchProductById,
                        productDetailsLoading: state.productDetailsLoading,
                        clearSelectedProduct: state.clearSelectedProduct,
                })
        );
        const addToCart = useCartStore((state) => state.addToCart);
        const { t } = useTranslation();
        const [activeImage, setActiveImage] = useState(null);
        const [quantity, setQuantity] = useState(1);

        useEffect(() => {
                let isMounted = true;

                fetchProductById(id)
                        .then((product) => {
                                if (isMounted) {
                                        setActiveImage(resolveCoverImage(product));
                                }
                        })

                return () => {
                        isMounted = false;
                        clearSelectedProduct();
                };
        }, [fetchProductById, id, clearSelectedProduct]);

        useEffect(() => {
                if (selectedProduct && !activeImage) {
                        setActiveImage(resolveCoverImage(selectedProduct));
                }
        }, [selectedProduct, activeImage]);

        useEffect(() => {
                if (selectedProduct) {
                        setQuantity(1);
                }
        }, [selectedProduct]);

        if (productDetailsLoading && !selectedProduct) {
                return <LoadingSpinner />;
        }

        if (!selectedProduct) {
                return (
                        <div className='relative min-h-screen text-payzone-white'>
                                <div className='relative z-10 mx-auto max-w-4xl px-4 py-24 text-center'>
                                        <h1 className='text-3xl font-semibold text-payzone-gold'>{t("products.detail.notFound.title")}</h1>
                                        <p className='mt-4 text-white/70'>{t("products.detail.notFound.description")}</p>
                                </div>
                        </div>
                );
        }

        const galleryImages = mapGalleryImages(selectedProduct);
        const { price, discountedPrice, isDiscounted, discountPercentage } = getProductPricing(selectedProduct);

        const handleAddToCart = async () => {
                await addToCart(
                        {
                                ...selectedProduct,
                                discountedPrice,
                                isDiscounted,
                                discountPercentage,
                        },
                        quantity
                );
                setQuantity(1);
        };

        const handleDecreaseQuantity = () => {
                setQuantity((prev) => Math.max(1, prev - 1));
        };

        const handleIncreaseQuantity = () => {
                setQuantity((prev) => prev + 1);
        };

        return (
                <div className='relative min-h-screen overflow-hidden text-payzone-white'>
                        <div className='relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8'>
                                <div className='grid gap-10 lg:grid-cols-2'>
                                        <div>
                                                <div className='relative flex h-96 items-center justify-center overflow-hidden rounded-2xl border border-payzone-indigo/40 bg-payzone-navy/60'>
                                                        {isDiscounted && (
                                                                <span className='absolute right-4 top-4 rounded-full bg-red-600 px-4 py-1 text-sm font-semibold text-white shadow-lg'>
                                                                        -{discountPercentage}%
                                                                </span>
                                                        )}
                                                        {activeImage ? (
                                                                <img
                                                                        src={activeImage}
                                                                        alt={selectedProduct.name}
                                                                        className='h-full w-full object-contain'
                                                                />
                                                        ) : (
                                                                <div className='text-white/60'>{t("common.status.noImage")}</div>
                                                        )}
                                                </div>
                                                {galleryImages.length > 1 && (
                                                        <div className='mt-4 flex gap-3 overflow-x-auto pb-2'>
                                                                {galleryImages.map((imageUrl, index) => {
                                                                        const isActive = imageUrl === activeImage;
                                                                        const localizedIndex = new Intl.NumberFormat("ar").format(index + 1);
                                                                        return (
                                                                                <button
                                                                                        key={`${imageUrl}-${index}`}
                                                                                        type='button'
                                                                                        onClick={() => setActiveImage(imageUrl)}
                                                                                        className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border transition-colors duration-200 ${
                                                                                                isActive
                                                                                                        ? "border-payzone-gold"
                                                                                                        : "border-transparent"
                                                                                        }`}
                                                                                        aria-label={t("products.detail.viewImage", { index: localizedIndex })}
                                                                                >
                                                                                        <img src={imageUrl} alt='' className='h-full w-full object-cover' />
                                                                                </button>
                                                                        );
                                                                })}
                                                        </div>
                                                )}
                                        </div>

                                        <div className='flex flex-col gap-8 py-2 lg:pl-4'>
                                                <div className='space-y-6'>
                                                        {selectedProduct.category && (
                                                                <p className='text-sm font-medium uppercase tracking-wide text-payzone-gold/80'>
                                                                        {selectedProduct.category}
                                                                </p>
                                                        )}
                                                        <div className='space-y-2'>
                                                                <p className='text-sm font-semibold text-white/70'>الإسم</p>
                                                                <h1 className='text-3xl font-bold text-payzone-gold'>
                                                                        {selectedProduct.name}
                                                                </h1>
                                                        </div>
                                                        <div className='space-y-2'>
                                                                <p className='text-sm font-semibold text-white/70'>السعر</p>
                                                                <div className='flex flex-wrap items-center gap-4 text-3xl font-semibold text-payzone-gold'>
                                                                        {isDiscounted ? (
                                                                                <>
                                                                                        <span className='text-2xl font-normal text-white/60 line-through'>
                                                                                                {formatMRU(price)}
                                                                                        </span>
                                                                                        <span className='text-4xl font-bold text-red-300'>
                                                                                                {formatMRU(discountedPrice)}
                                                                                        </span>
                                                                                        <span className='rounded-full bg-red-600/80 px-3 py-1 text-base font-semibold text-white shadow'>
                                                                                                -{discountPercentage}%
                                                                                        </span>
                                                                                </>
                                                                        ) : (
                                                                                <span>{formatMRU(price)}</span>
                                                                        )}
                                                                </div>
                                                        </div>
                                                </div>

                                                <div className='flex flex-wrap items-center gap-3 text-white/80'>
                                                        <span className='text-sm font-medium text-white/70'>
                                                                {t("cart.item.chooseQuantity")}
                                                        </span>
                                                        <div className='flex items-center gap-3'>
                                                                <button
                                                                        type='button'
                                                                        onClick={handleDecreaseQuantity}
                                                                        className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:border-payzone-gold/80 hover:bg-payzone-navy/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-payzone-gold'
                                                                        aria-label={t("cart.item.decrease")}
                                                                >
                                                                        <Minus className='h-4 w-4' />
                                                                </button>
                                                                <span className='flex h-9 min-w-[3rem] items-center justify-center rounded-xl bg-white/10 text-base font-semibold text-white'>
                                                                        {quantity}
                                                                </span>
                                                                <button
                                                                        type='button'
                                                                        onClick={handleIncreaseQuantity}
                                                                        className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:border-payzone-gold/80 hover:bg-payzone-navy/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-payzone-gold'
                                                                        aria-label={t("cart.item.increase")}
                                                                >
                                                                        <Plus className='h-4 w-4' />
                                                                </button>
                                                        </div>
                                                </div>

                                                <div className='space-y-3 text-white/80'>
                                                        <h2 className='text-lg font-semibold text-payzone-gold'>
                                                                {t("products.detail.descriptionTitle")}
                                                        </h2>
                                                        <p className='text-base leading-relaxed'>
                                                                {selectedProduct.description || t("products.detail.descriptionFallback")}
                                                        </p>
                                                </div>

                                                <button
                                                        onClick={handleAddToCart}
                                                        className='inline-flex items-center justify-center rounded-full bg-payzone-gold px-6 py-3 text-lg font-semibold text-payzone-navy transition-colors duration-300 hover:bg-[#b8873d] focus:outline-none focus:ring-4 focus:ring-payzone-indigo/40'
                                                >
                                                        {t("common.actions.addToCart")}
                                                </button>
                                        </div>
                                </div>

                                <div className='mt-16'>
                                        <PeopleAlsoBought
                                                productId={selectedProduct._id}
                                                category={selectedProduct.category}
                                        />
                                </div>
                        </div>
                </div>
        );
};

export default ProductDetailPage;

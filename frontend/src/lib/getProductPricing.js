export const getProductPricing = (product = {}) => {
        const basePriceInput =
                product.originalPrice !== undefined && product.originalPrice !== null
                        ? product.originalPrice
                        : product.price;
        const price = Number(basePriceInput) || 0;

        let rawDiscountPercentage = Number(product.discountPercentage);
        if (Number.isNaN(rawDiscountPercentage)) {
                rawDiscountPercentage = 0;
        }

        let discountedPriceInput =
                product.discountedPrice !== undefined && product.discountedPrice !== null
                        ? Number(product.discountedPrice)
                        : undefined;

        if (
                discountedPriceInput === undefined &&
                product.isDiscounted &&
                product.originalPrice !== undefined &&
                product.originalPrice !== null &&
                product.price !== undefined &&
                product.price !== null
        ) {
                discountedPriceInput = Number(product.price);
        }

        if (Number.isNaN(discountedPriceInput)) {
                discountedPriceInput = undefined;
        }

        let isDiscounted = Boolean(product.isDiscounted) && rawDiscountPercentage > 0;
        let normalizedDiscount = rawDiscountPercentage;

        let discountedPrice = discountedPriceInput;
        if (discountedPrice === undefined) {
                discountedPrice = isDiscounted
                        ? Number((price - price * (normalizedDiscount / 100)).toFixed(2))
                        : price;
        }

        if (price > 0 && discountedPrice < price && normalizedDiscount <= 0) {
                normalizedDiscount = Number((((price - discountedPrice) / price) * 100).toFixed(2));
        }

        if (price <= 0) {
                discountedPrice = 0;
        }

        isDiscounted = isDiscounted || discountedPrice < price;

        if (!isDiscounted) {
                normalizedDiscount = 0;
                discountedPrice = price;
        }

        return {
                price,
                discountedPrice,
                isDiscounted,
                discountPercentage: normalizedDiscount > 0 ? Number(normalizedDiscount.toFixed(2)) : 0,
        };
};

export default getProductPricing;

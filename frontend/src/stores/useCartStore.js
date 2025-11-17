import { create } from "zustand";
import { toast } from "react-hot-toast";
import apiClient from "../lib/apiClient";
import { useUserStore } from "./useUserStore";
import { translate } from "../lib/locale";
import { getProductPricing } from "../lib/getProductPricing";

const LOCAL_CART_KEY = "guest_cart_items";

const isBrowser = typeof window !== "undefined";

const enrichCartItem = (item) => {
        const { discountedPrice, isDiscounted, discountPercentage } = getProductPricing(item);
        return {
                ...item,
                discountedPrice,
                isDiscounted,
                discountPercentage,
        };
};

const loadCartFromStorage = () => {
        if (!isBrowser) return [];

        try {
                const storedCart = window.localStorage.getItem(LOCAL_CART_KEY);
                if (!storedCart) return [];

                const parsedCart = JSON.parse(storedCart);
                if (!Array.isArray(parsedCart)) return [];

                return parsedCart.map((item) => enrichCartItem({ ...item, quantity: item.quantity || 1 }));
        } catch (error) {
                console.error("Failed to load cart from storage", error);
                return [];
        }
};

const persistCartToStorage = (cart) => {
        if (!isBrowser) return;

        try {
                window.localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cart));
        } catch (error) {
                console.error("Failed to persist cart to storage", error);
        }
};

const getAuthenticatedUser = () => useUserStore.getState().user;

export const useCartStore = create((set, get) => ({
        cart: loadCartFromStorage(),
        coupon: null,
        isCouponApplied: false,
        totalDiscountAmount: 0,
        total: 0,
        subtotal: 0,
        discountedSubtotal: 0,

        initializeCart: () => {
                const localCart = loadCartFromStorage();
                set({ cart: localCart });
                get().calculateTotals();
        },

        applyCoupon: async (code) => {
                const user = getAuthenticatedUser();
                const normalizedCode =
                        typeof code === "string"
                                ? code.replace(/\s+/g, "").toUpperCase()
                                : "";

                if (!normalizedCode) {
                        toast.error(translate("toast.applyCouponError"));
                        return;
                }

                if (!user) {
                        toast.error(translate("common.messages.loginRequiredForCoupon"));
                        return;
                }

                try {
                        const data = await apiClient.post("/coupons/validate", { code: normalizedCode });
                        const coupon = data?.coupon ?? null;

                        if (!coupon) {
                                toast.error(translate("toast.applyCouponError"));
                                return;
                        }

                        set({
                                coupon: {
                                        code: coupon.code,
                                        discountPercentage: Number(coupon.discountPercentage) || 0,
                                },
                                isCouponApplied: true,
                        });

                        get().calculateTotals();
                        toast.success(translate("common.messages.couponAppliedSuccess"));
                } catch (error) {
                        toast.error(error.response?.data?.message || translate("toast.applyCouponError"));
                }
        },
        removeCoupon: () => {
                if (!get().coupon?.code) {
                        return;
                }

                set({ coupon: null, isCouponApplied: false });

                get().calculateTotals();
                toast.success(translate("common.messages.couponRemoved"));
        },

        getCartItems: async () => {
                const user = getAuthenticatedUser();

                if (!user) {
                        const localCart = loadCartFromStorage();
                        set({ cart: localCart });
                        get().calculateTotals();
                        return;
                }

                try {
                        const data = await apiClient.get("/cart");
                        const enriched = Array.isArray(data) ? data.map(enrichCartItem) : [];
                        set({ cart: enriched });
                        persistCartToStorage(enriched);
                        get().calculateTotals();
                } catch (error) {
                        const fallbackCart = loadCartFromStorage();
                        set({ cart: fallbackCart });
                        toast.error(error.response?.data?.message || translate("toast.cartFetchError"));
                        get().calculateTotals();
                }
        },
        clearCart: async () => {
                const user = getAuthenticatedUser();

                persistCartToStorage([]);
                set({
                        cart: [],
                        coupon: null,
                        totalDiscountAmount: 0,
                        total: 0,
                        subtotal: 0,
                        discountedSubtotal: 0,
                        isCouponApplied: false,
                });

                if (!user) return;

                try {
                        await apiClient.delete("/cart", { body: {} });
                } catch (error) {
                        console.error("Failed to clear remote cart", error);
                }
        },
        addToCart: async (product, quantity = 1) => {
                const user = getAuthenticatedUser();
                const normalizedQuantity = Math.max(1, Number(quantity) || 1);

                const updateLocalCart = () => {
                        const enrichedProduct = enrichCartItem({
                                ...product,
                                quantity: normalizedQuantity,
                        });
                        set((prevState) => {
                                const existingItem = prevState.cart.find((item) => item._id === product._id);
                                const newCart = existingItem
                                        ? prevState.cart.map((item) =>
                                                        item._id === product._id
                                                                ? enrichCartItem({
                                                                          ...item,
                                                                          ...product,
                                                                          quantity: Number(item.quantity || 0) + normalizedQuantity,
                                                                  })
                                                                : item
                                          )
                                        : [...prevState.cart, enrichedProduct];

                                persistCartToStorage(newCart);
                                return { cart: newCart };
                        });
                        get().calculateTotals();
                };

                if (!user) {
                        updateLocalCart();
                        toast.success(translate("common.messages.productAddedToCart"));
                        return;
                }

                try {
                        await apiClient.post("/cart", {
                                productId: product._id,
                                quantity: normalizedQuantity,
                        });
                        toast.success(translate("common.messages.productAddedToCart"));
                } catch (error) {
                        toast.error(error.response?.data?.message || translate("toast.addToCartError"));
                }

                updateLocalCart();
        },
        removeFromCart: async (productId) => {
                const user = getAuthenticatedUser();

                set((prevState) => {
                        const newCart = prevState.cart.filter((item) => item._id !== productId);
                        persistCartToStorage(newCart);
                        return { cart: newCart };
                });
                get().calculateTotals();

                if (!user) return;

                try {
                        await apiClient.delete(`/cart`, { body: { productId } });
                } catch (error) {
                        toast.error(error.response?.data?.message || translate("toast.removeItemError"));
                }
        },
        updateQuantity: async (productId, quantity) => {
                if (quantity === 0) {
                        get().removeFromCart(productId);
                        return;
                }

                const user = getAuthenticatedUser();

                set((prevState) => {
                        const newCart = prevState.cart.map((item) =>
                                item._id === productId ? { ...item, quantity } : item
                        );
                        persistCartToStorage(newCart);
                        return { cart: newCart };
                });
                get().calculateTotals();

                if (!user) return;

                try {
                        await apiClient.put(`/cart/${productId}`, { quantity });
                } catch (error) {
                        toast.error(error.response?.data?.message || translate("toast.updateQuantityError"));
                }
        },
        calculateTotals: () => {
                const { cart, coupon } = get();

                let originalSubtotal = 0;
                let discountedSubtotal = 0;

                cart.forEach((item) => {
                        const { price, discountedPrice } = getProductPricing(item);
                        const quantity = Number(item.quantity) || 0;
                        originalSubtotal += price * quantity;
                        discountedSubtotal += discountedPrice * quantity;
                });

                originalSubtotal = Number(originalSubtotal.toFixed(2));
                discountedSubtotal = Number(discountedSubtotal.toFixed(2));

                let total = discountedSubtotal;
                let totalDiscountAmount = 0;
                let enrichedCoupon = null;

                if (coupon && coupon.code) {
                        const percentage = Number(coupon.discountPercentage) || 0;

                        if (percentage > 0 && discountedSubtotal > 0) {
                                totalDiscountAmount = Number(
                                        ((discountedSubtotal * Math.min(percentage, 100)) / 100).toFixed(2)
                                );
                                total = Number(
                                        Math.max(0, discountedSubtotal - totalDiscountAmount).toFixed(2)
                                );
                        }

                        enrichedCoupon = {
                                ...coupon,
                                discountAmount: totalDiscountAmount,
                        };
                }

                set({
                        subtotal: originalSubtotal,
                        discountedSubtotal,
                        total,
                        totalDiscountAmount,
                        coupon: enrichedCoupon,
                        isCouponApplied: Boolean(enrichedCoupon),
                });
        },
}));

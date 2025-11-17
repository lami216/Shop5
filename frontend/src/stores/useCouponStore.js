import { create } from "zustand";
import toast from "react-hot-toast";
import apiClient from "../lib/apiClient";
import { translate } from "../lib/locale";

const clampLimit = (value) => {
        const limit = Number.parseInt(value, 10);
        if (!Number.isFinite(limit) || limit <= 0) {
                return 10;
        }
        return Math.min(limit, 50);
};

const sortCoupons = (coupons, sortBy, sortOrder) => {
        const sorted = [...coupons];
        const direction = sortOrder === "asc" ? 1 : -1;

        sorted.sort((a, b) => {
                const compare = (valueA, valueB) => {
                        if (valueA === valueB) return 0;
                        return valueA > valueB ? 1 : -1;
                };

                switch (sortBy) {
                        case "code":
                                return compare(a.code || "", b.code || "") * direction;
                        case "discountPercentage":
                                return compare(
                                        Number(a.discountPercentage) || 0,
                                        Number(b.discountPercentage) || 0
                                ) * direction;
                        case "expiresAt":
                                return (
                                        compare(
                                                new Date(a.expiresAt || 0).getTime(),
                                                new Date(b.expiresAt || 0).getTime()
                                        ) * direction
                                );
                        case "isActive":
                                return compare(a.isActive ? 1 : 0, b.isActive ? 1 : 0) * direction;
                        case "createdAt":
                        default:
                                return (
                                        compare(
                                                new Date(a.createdAt || 0).getTime(),
                                                new Date(b.createdAt || 0).getTime()
                                        ) * direction
                                );
                }
        });

        return sorted;
};

const matchesSearch = (coupon, searchTerm) => {
        if (!searchTerm) {
                return true;
        }

        return (coupon.code || "").toUpperCase().includes(searchTerm.toUpperCase());
};

export const useCouponStore = create((set, get) => ({
        coupons: [],
        total: 0,
        page: 1,
        limit: 10,
        search: "",
        sortBy: "createdAt",
        sortOrder: "desc",
        loading: false,
        mutationLoading: false,

        fetchCoupons: async (options = {}) => {
                const currentState = get();
                const nextPage = Math.max(options.page ?? currentState.page, 1);
                const nextLimit = clampLimit(options.limit ?? currentState.limit);
                const nextSearch = typeof options.search === "string" ? options.search : currentState.search;
                const nextSortBy = options.sortBy ?? currentState.sortBy;
                const nextSortOrder = options.sortOrder ?? currentState.sortOrder;

                const params = new URLSearchParams();
                params.set("page", String(nextPage));
                params.set("limit", String(nextLimit));
                if (nextSearch) {
                        params.set("search", nextSearch);
                }
                params.set("sortBy", nextSortBy);
                params.set("sortOrder", nextSortOrder);

                set({
                        loading: true,
                        page: nextPage,
                        limit: nextLimit,
                        search: nextSearch,
                        sortBy: nextSortBy,
                        sortOrder: nextSortOrder,
                });

                try {
                        const data = await apiClient.get(`/coupons?${params.toString()}`);
                        const pagination = data.pagination || {};

                        const resolvedCoupons = Array.isArray(data.coupons) ? data.coupons : [];
                        const resolvedTotal =
                                typeof pagination.total === "number"
                                        ? pagination.total
                                        : typeof data.total === "number"
                                        ? data.total
                                        : resolvedCoupons.length;

                        set({
                                coupons: resolvedCoupons,
                                total: resolvedTotal,
                                page: pagination.page ?? nextPage,
                                limit: pagination.limit ?? nextLimit,
                                loading: false,
                        });
                } catch (error) {
                        set({ loading: false });
                        toast.error(error.response?.data?.message || translate("toast.couponFetchError"));
                        throw error;
                }
        },

        createCoupon: async (payload) => {
                set({ mutationLoading: true });
                try {
                        const response = await apiClient.post(`/coupons`, payload);
                        const createdCoupons = Array.isArray(response?.coupons)
                                ? response.coupons
                                : response
                                ? [response]
                                : [];

                        set((state) => {
                                if (!createdCoupons.length) {
                                        return { mutationLoading: false };
                                }

                                const matchingCoupons = createdCoupons.filter((coupon) =>
                                        matchesSearch(coupon, state.search)
                                );

                                let coupons = state.coupons;
                                let total = state.total;

                                if (matchingCoupons.length) {
                                        total += matchingCoupons.length;

                                        if (state.page === 1) {
                                                coupons = sortCoupons(
                                                        [...matchingCoupons, ...state.coupons],
                                                        state.sortBy,
                                                        state.sortOrder
                                                ).slice(0, state.limit);
                                        }
                                }

                                return {
                                        coupons,
                                        total,
                                        mutationLoading: false,
                                };
                        });

                        const createdCount = createdCoupons.length;
                        if (createdCount > 1) {
                                toast.success(
                                        translate("common.messages.couponsCreated", { count: createdCount })
                                );
                        } else if (createdCount === 1) {
                                toast.success(translate("common.messages.couponCreated"));
                        }

                        return createdCoupons;
                } catch (error) {
                        set({ mutationLoading: false });
                        toast.error(error.response?.data?.message || translate("toast.couponCreateError"));
                        throw error;
                }
        },

        updateCoupon: async (couponId, payload) => {
                set({ mutationLoading: true });
                try {
                        const updatedCoupon = await apiClient.patch(`/coupons/${couponId}`, payload);
                        set((state) => {
                                const doesMatch = matchesSearch(updatedCoupon, state.search);
                                const existingIndex = state.coupons.findIndex((coupon) => coupon._id === updatedCoupon._id);
                                let coupons = state.coupons;
                                let total = state.total;

                                if (existingIndex !== -1) {
                                        coupons = [...state.coupons];
                                        if (doesMatch) {
                                                coupons[existingIndex] = updatedCoupon;
                                                coupons = sortCoupons(coupons, state.sortBy, state.sortOrder);
                                        } else {
                                                coupons.splice(existingIndex, 1);
                                                total = Math.max(0, total - 1);
                                        }
                                } else if (doesMatch && state.page === 1) {
                                        coupons = sortCoupons([...state.coupons, updatedCoupon], state.sortBy, state.sortOrder).slice(
                                                0,
                                                state.limit
                                        );
                                        total += 1;
                                }

                                return {
                                        coupons,
                                        total,
                                        mutationLoading: false,
                                };
                        });
                        toast.success(translate("common.messages.couponUpdated"));
                        return updatedCoupon;
                } catch (error) {
                        set({ mutationLoading: false });
                        toast.error(error.response?.data?.message || translate("toast.couponUpdateError"));
                        throw error;
                }
        },
}));

export default useCouponStore;

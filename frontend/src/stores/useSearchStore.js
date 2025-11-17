import { create } from "zustand";
import apiClient from "../lib/apiClient";
import { translate } from "../lib/locale";

let activeController = null;

export const useSearchStore = create((set, get) => ({
        query: "",
        category: null,
        results: [],
        totalCount: 0,
        loading: false,
        error: null,
        lastFetchedQuery: "",
        lastFetchedCategory: null,
        setQuery: (value) => set({ query: value }),
        setCategory: (value) => set({ category: value || null }),
        clearResults: () => {
                if (activeController) {
                        activeController.abort();
                        activeController = null;
                }
                set({
                        results: [],
                        totalCount: 0,
                        loading: false,
                        error: null,
                        lastFetchedQuery: "",
                        lastFetchedCategory: null,
                });
        },
        cancelOngoing: () => {
                if (activeController) {
                        activeController.abort();
                        activeController = null;
                }
        },
        searchProducts: async ({ query, category } = {}) => {
                const trimmedQuery = (query ?? get().query ?? "").trim();
                const normalizedCategory = category ?? get().category ?? null;

                if (!trimmedQuery && !normalizedCategory) {
                        set({
                                results: [],
                                totalCount: 0,
                                loading: false,
                                error: null,
                                lastFetchedQuery: "",
                                lastFetchedCategory: null,
                        });
                        return [];
                }

                if (activeController) {
                        activeController.abort();
                }

                const controller = new AbortController();
                activeController = controller;

                set({ loading: true, error: null });

                try {
                        const queryParts = [];
                        if (trimmedQuery) {
                                queryParts.push(`q=${encodeURIComponent(trimmedQuery)}`);
                        }
                        if (normalizedCategory) {
                                queryParts.push(`category=${encodeURIComponent(normalizedCategory)}`);
                        }

                        const queryString = queryParts.join("&");
                        const endpoint = `/products/search${queryString ? `?${queryString}` : ""}`;
                        const data = await apiClient.get(endpoint, { signal: controller.signal });

                        if (controller.signal.aborted) {
                                return [];
                        }

                        const items = Array.isArray(data?.items) ? data.items : [];
                        const totalCount = typeof data?.count === "number" ? data.count : items.length;

                        set({
                                results: items,
                                totalCount,
                                loading: false,
                                error: null,
                                lastFetchedQuery: trimmedQuery,
                                lastFetchedCategory: normalizedCategory,
                        });

                        activeController = null;
                        return items;
                } catch (error) {
                        if (controller.signal.aborted) {
                                return [];
                        }

                        set({
                                loading: false,
                                error: error.response?.data?.message || translate("search.genericError"),
                        });

                        activeController = null;
                        throw error;
                }
        },
}));

export default useSearchStore;

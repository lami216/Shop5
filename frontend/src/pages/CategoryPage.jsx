import { useEffect, useMemo } from "react";
import { useProductStore } from "../stores/useProductStore";
import { useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import useTranslation from "../hooks/useTranslation";
import ProductCard from "../components/ProductCard";
import { useCategoryStore } from "../stores/useCategoryStore";
import SearchBar from "../components/SearchBar";
import { useSearchStore } from "../stores/useSearchStore";

const CategoryPage = () => {
        const { fetchProductsByCategory, products } = useProductStore();
        const { categories, fetchCategories } = useCategoryStore();
        const { category } = useParams();
        const { t } = useTranslation();
        const {
                query: searchQuery,
                results: searchResults,
                loading: searchLoading,
                error: searchError,
                category: activeSearchCategory,
                setQuery,
                setCategory,
        } = useSearchStore((state) => ({
                query: state.query,
                results: state.results,
                loading: state.loading,
                error: state.error,
                category: state.category,
                setQuery: state.setQuery,
                setCategory: state.setCategory,
        }));
        const [searchParams] = useSearchParams();

        useEffect(() => {
                fetchProductsByCategory(category);
        }, [fetchProductsByCategory, category]);

        useEffect(() => {
                if (!categories.length) {
                        fetchCategories();
                }
        }, [categories.length, fetchCategories]);

        useEffect(() => {
                const nextQuery = searchParams.get("q") ?? "";
                const nextCategory = searchParams.get("category");

                setQuery(nextQuery);
                if (nextCategory) {
                        setCategory(nextCategory);
                } else {
                        setCategory(category);
                }
        }, [searchParams, setQuery, setCategory, category]);

        const categoryName = useMemo(() => {
                const match = categories.find((item) => item.slug === category);
                if (match) {
                        return match.name;
                }
                const fallback = category ? category.charAt(0).toUpperCase() + category.slice(1) : "";
                return fallback;
        }, [categories, category]);

        const isFilteringCurrentCategory = Boolean(searchQuery.trim()) && activeSearchCategory === category;
        const displayedProducts = isFilteringCurrentCategory ? searchResults : products;
        const showSearchEmptyState =
                isFilteringCurrentCategory && !searchLoading && !searchError && searchResults.length === 0;

        return (
                <div className='min-h-screen'>
                        <div className='relative z-10 mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8'>
                                <div className='mb-12'>
                                        <SearchBar variant='category' categorySlug={category} />
                                </div>
                                <motion.h1
                                        className='mb-8 text-center text-4xl font-bold text-payzone-gold sm:text-5xl'
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8 }}
                                >
                                        {categoryName}
                                </motion.h1>

                                {searchError && isFilteringCurrentCategory && (
                                        <div className='mb-6 rounded-3xl border border-red-500/40 bg-red-500/10 p-4 text-center text-sm text-red-200'>
                                                {searchError}
                                        </div>
                                )}

                                {searchLoading && isFilteringCurrentCategory && (
                                        <div className='mb-6 flex justify-center'>
                                                <motion.div
                                                        className='rounded-full border-4 border-payzone-gold/40 border-t-payzone-gold p-6'
                                                        animate={{ rotate: 360 }}
                                                        transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
                                                />
                                        </div>
                                )}

                                {showSearchEmptyState && (
                                        <div className='mb-6 rounded-3xl border border-white/10 bg-payzone-navy p-6 text-center text-lg text-payzone-white/70'>
                                                {t("search.noResults", { query: searchQuery.trim() })}
                                        </div>
                                )}

                                <motion.div
                                        className='grid grid-cols-2 gap-6 justify-items-center lg:grid-cols-3'
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8, delay: 0.2 }}
                                >
                                        {!isFilteringCurrentCategory && displayedProducts?.length === 0 && (
                                                <h2 className='col-span-full text-center text-3xl font-semibold text-white/70'>
                                                        {t("categoryPage.noProducts")}
                                                </h2>
                                        )}

                                        {displayedProducts?.map((product) => (
                                                <ProductCard key={product._id} product={product} />
                                        ))}
                                </motion.div>
                        </div>
                </div>
        );
};
export default CategoryPage;

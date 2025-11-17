import { useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import SearchBar from "../components/SearchBar";
import ProductCard from "../components/ProductCard";
import useTranslation from "../hooks/useTranslation";
import { useSearchStore } from "../stores/useSearchStore";

const SearchPage = () => {
        const [searchParams] = useSearchParams();
        const { t } = useTranslation();
        const { query, setQuery, results, loading, error, category, setCategory } = useSearchStore(
                (state) => ({
                        query: state.query,
                        setQuery: state.setQuery,
                        results: state.results,
                        loading: state.loading,
                        error: state.error,
                        category: state.category,
                        setCategory: state.setCategory,
                })
        );

        useEffect(() => {
                const nextQuery = searchParams.get("q") ?? "";
                const nextCategory = searchParams.get("category");

                setQuery(nextQuery);
                setCategory(nextCategory || null);
        }, [searchParams, setQuery, setCategory]);

        const hasSearched = useMemo(() => {
                return Boolean(query.trim() || category);
        }, [query, category]);

        return (
                <div className='min-h-screen'>
                        <div className='relative z-10 mx-auto max-w-screen-xl px-4 py-16 sm:px-6 lg:px-8'>
                                <SearchBar variant='search' />

                                <div className='mt-10'>
                                        {error && !loading && (
                                                <div className='rounded-3xl border border-red-500/40 bg-red-500/10 p-6 text-center text-sm text-red-200'>
                                                        {error}
                                                </div>
                                        )}

                                        {loading && (
                                                <div className='flex justify-center py-12'>
                                                        <Loader2 className='h-10 w-10 animate-spin text-payzone-gold' />
                                                </div>
                                        )}

                                        {!loading && hasSearched && results.length === 0 && !error && (
                                                <div className='rounded-3xl border border-white/10 bg-payzone-navy p-6 text-center text-lg text-payzone-white/70'>
                                                        {query.trim()
                                                                ? t("search.noResults", { query })
                                                                : t("common.status.noProducts")}
                                                </div>
                                        )}

                                        {!loading && results.length > 0 && (
                                                <div className='grid grid-cols-2 gap-6 pt-4 text-right lg:grid-cols-3'>
                                                        {results.map((product) => (
                                                                <ProductCard key={product._id} product={product} />
                                                        ))}
                                                </div>
                                        )}

                                        {!loading && !hasSearched && !error && (
                                                <div className='rounded-3xl border border-white/10 bg-payzone-navy p-6 text-center text-payzone-white/70'>
                                                        {t("search.placeholder")}
                                                </div>
                                        )}
                                </div>
                        </div>
                </div>
        );
};

export default SearchPage;

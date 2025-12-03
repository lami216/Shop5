import { useEffect } from "react";
import useTranslation from "../hooks/useTranslation";
import CategoryItem from "../components/CategoryItem";
import { useProductStore } from "../stores/useProductStore";
import FeaturedProducts from "../components/FeaturedProducts";
import { useCategoryStore } from "../stores/useCategoryStore";
import SearchBar from "../components/SearchBar";

const HomePage = () => {
        const { fetchFeaturedProducts, products, loading: productsLoading } = useProductStore();
        const { categories, fetchCategories, loading: categoriesLoading } = useCategoryStore();
        const { t } = useTranslation();

        useEffect(() => {
                fetchFeaturedProducts();
        }, [fetchFeaturedProducts]);

        useEffect(() => {
                fetchCategories();
        }, [fetchCategories]);

        return (
                <div className='relative min-h-screen overflow-hidden text-payzone-navy'>
                        <div className='home-hero relative z-10 mx-auto max-w-7xl px-4 pt-12 pb-14 sm:px-6 sm:pt-16 sm:pb-16 lg:px-8'>
                                <h1 className='mb-3 text-center text-5xl font-bold sm:text-6xl'>
                                        <span className='block text-payzone-navy'>{t("home.titleLine1")}</span>
                                        <span className='bg-gradient-to-r from-payzone-gold via-payzone-gold/80 to-payzone-indigo bg-clip-text text-transparent'>
                                                {t("home.titleHighlight")}
                                        </span>
                                </h1>
                                <p className='mb-10 text-center text-lg text-payzone-navy/70 sm:mb-12'>
                                        {t("home.subtitle")}
                                </p>

                                <SearchBar />

                                <div className='grid grid-cols-2 gap-4 lg:grid-cols-3'>
                                        {categories.length === 0 && !categoriesLoading && (
                                                <div className='col-span-full text-center text-white/70'>
                                                        {t("categories.manager.list.empty")}
                                                </div>
                                        )}
                                        {categories.map((category) => (
                                                <CategoryItem category={category} key={category._id} />
                                        ))}
                                </div>

                                {!productsLoading && products.length > 0 && (
                                        <FeaturedProducts featuredProducts={products} />
                                )}
                        </div>
                </div>
	);
};
export default HomePage;

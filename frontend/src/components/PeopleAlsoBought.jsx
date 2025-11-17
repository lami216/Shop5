import { useEffect, useState } from "react";
import useTranslation from "../hooks/useTranslation";
import ProductCard from "./ProductCard";
import toast from "react-hot-toast";
import LoadingSpinner from "./LoadingSpinner";
import apiClient from "../lib/apiClient";

const PeopleAlsoBought = ({ productId, category }) => {
        const [recommendations, setRecommendations] = useState([]);
        const [isLoading, setIsLoading] = useState(true);
        const { t } = useTranslation();
        const recommendationsErrorMessage = t("toast.recommendationsError");

        useEffect(() => {
                let isCancelled = false;

                const fetchRecommendations = async () => {
                        setIsLoading(true);

                        try {
                                const queryParams = new URLSearchParams();

                                if (productId) {
                                        queryParams.append("productId", productId);
                                }

                                if (category) {
                                        queryParams.append("category", category);
                                }

                                const endpoint = queryParams.toString()
                                        ? `/products/recommendations?${queryParams.toString()}`
                                        : `/products/recommendations`;

                                const data = await apiClient.get(endpoint);

                                if (!isCancelled) {
                                        setRecommendations(Array.isArray(data) ? data : []);
                                }
                        } catch (error) {
                                if (!isCancelled) {
                                        toast.error(
                                                error.response?.data?.message || recommendationsErrorMessage
                                        );
                                }
                        } finally {
                                if (!isCancelled) {
                                        setIsLoading(false);
                                }
                        }
                };

                fetchRecommendations();

                return () => {
                        isCancelled = true;
                };
        }, [productId, category, recommendationsErrorMessage]);

        if (isLoading) return <LoadingSpinner />;

        return (
                <div className='mt-8'>
                        <h3 className='text-2xl font-semibold text-payzone-gold'>
                                {t("cart.recommendations.title")}
                        </h3>
                        <div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                                {recommendations.map((product) => (
                                        <ProductCard key={product._id} product={product} />
                                ))}
                        </div>
		</div>
	);
};
export default PeopleAlsoBought;

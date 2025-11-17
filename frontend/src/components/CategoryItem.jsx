import { Link } from "react-router-dom";
import useTranslation from "../hooks/useTranslation";

const CategoryItem = ({ category }) => {
        const { t } = useTranslation();
        return (
                <div className='group relative h-96 w-full overflow-hidden rounded-xl shadow-lg ring-1 ring-white/10'>
                        <Link to={`/category/${category.slug}`}>
                                <div className='w-full h-full cursor-pointer'>
                                        <div className='absolute inset-0 z-10 bg-gradient-to-b from-transparent via-payzone-navy/40 to-payzone-navy/90 transition-opacity duration-500 group-hover:opacity-90' />
                                        <img
                                                src={category.imageUrl}
                                                alt={category.name}
                                                className='w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110'
                                                loading='lazy'
                                        />
                                        <div className='absolute bottom-0 left-0 right-0 z-20 p-5'>
                                                <h3 className='mb-1 text-2xl font-semibold text-white'>{category.name}</h3>
                                                <p className='text-sm text-payzone-gold/90'>
                                                        {t("categories.explore", { category: category.name })}
                                                </p>
                                        </div>
                                </div>
                        </Link>
                </div>
        );
};

export default CategoryItem;

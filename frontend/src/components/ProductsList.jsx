import { motion } from "framer-motion";
import { Trash, Star, Edit3 } from "lucide-react";
import useTranslation from "../hooks/useTranslation";
import { useProductStore } from "../stores/useProductStore";
import { formatMRU } from "../lib/formatMRU";

const ProductsList = ({ onEdit }) => {
        const { deleteProduct, toggleFeaturedProduct, products, setSelectedProduct } = useProductStore();
        const { t } = useTranslation();

        const handleEdit = (product) => {
                const confirmed = window.confirm(
                        t("admin.productsTable.confirmations.edit", { name: product.name })
                );

                if (!confirmed) return;

                setSelectedProduct(product);
                if (typeof onEdit === "function") {
                        onEdit();
                }
        };

        const handleDelete = (product) => {
                const confirmed = window.confirm(
                        t("admin.productsTable.confirmations.delete", { name: product.name })
                );

                if (!confirmed) return;

                deleteProduct(product._id);
        };

        return (
                <motion.div
                        className='mx-auto max-w-4xl rounded-xl border border-payzone-indigo/40 bg-white/5 shadow-lg backdrop-blur-sm'
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                >
                        <div className='overflow-x-auto'>
                                <table className='min-w-full divide-y divide-white/10'>
                                <thead className='bg-payzone-navy/80'>
                                        <tr>
                                                {[ 
                                                        t("admin.productsTable.headers.product"),
                                                        t("admin.productsTable.headers.price"),
                                                        t("admin.productsTable.headers.discount"),
                                                        t("admin.productsTable.headers.category"),
                                                        t("admin.productsTable.headers.featured"),
                                                        t("admin.productsTable.headers.actions"),
                                                ].map((heading) => (
                                                        <th
                                                                key={heading}
                                                                scope='col'
                                                                className='px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/70'
                                                        >
                                                                {heading}
                                                        </th>
                                                ))}
                                        </tr>
                                </thead>

                                <tbody className='divide-y divide-white/10 bg-white/5'>
                                        {products?.map((product) => (
                                                <tr key={product._id} className='transition-colors duration-200 hover:bg-payzone-navy/40'>
                                                        <td className='whitespace-nowrap px-6 py-4'>
                                                                <div className='flex items-center gap-3'>
                                                                        <div className='h-10 w-10 flex-shrink-0 overflow-hidden rounded-full ring-1 ring-payzone-indigo/40'>
                                                                                <img className='h-full w-full object-cover' src={product.image} alt={product.name} />
                                                                        </div>
                                                                        <div>
                                                                                <div className='text-sm font-medium text-white'>{product.name}</div>
                                                                        </div>
                                                                </div>
                                                        </td>
                                                        <td className='whitespace-nowrap px-6 py-4'>
                                                                <div className='flex flex-col items-end text-sm'>
                                                                        {product.isDiscounted && product.discountPercentage > 0 ? (
                                                                                <span className='text-xs text-white/60 line-through'>
                                                                                        {formatMRU(product.price)}
                                                                                </span>
                                                                        ) : (
                                                                                <span className='text-payzone-gold'>
                                                                                        {formatMRU(product.price)}
                                                                                </span>
                                                                        )}
                                                                </div>
                                                        </td>
                                                        <td className='whitespace-nowrap px-6 py-4'>
                                                                {product.isDiscounted && product.discountPercentage > 0 ? (
                                                                        <div className='flex items-center justify-end gap-2'>
                                                                                <span className='rounded-full bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-200'>
                                                                                        -{product.discountPercentage}%
                                                                                </span>
                                                                                <span className='text-sm text-red-200'>
                                                                                        {formatMRU(product.discountedPrice ?? product.price)}
                                                                                </span>
                                                                        </div>
                                                                ) : (
                                                                        <span className='text-sm text-white/60'>—</span>
                                                                )}
                                                        </td>
                                                        <td className='whitespace-nowrap px-6 py-4'>
                                                                <div className='text-sm text-white/70'>{product.category}</div>
                                                        </td>
                                                        <td className='whitespace-nowrap px-6 py-4'>
                                                                <button
                                                                        onClick={() => toggleFeaturedProduct(product._id)}
                                                                        className={`rounded-full p-1 transition-colors duration-200 ${
                                                                                product.isFeatured
                                                                                        ? "bg-payzone-gold text-payzone-navy"
                                                                                        : "bg-payzone-navy/60 text-white/70"
                                                                        } hover:ring-2 hover:ring-payzone-indigo/40`}
                                                                >
                                                                        <Star className='h-5 w-5' />
                                                                </button>
                                                        </td>
                                                        <td className='whitespace-nowrap px-6 py-4 text-sm font-medium'>
                                                                <div className='flex items-center justify-end gap-4'>
                                                                        <button
                                                                                onClick={() => handleEdit(product)}
                                                                                className='inline-flex items-center text-white/80 transition-colors duration-200 hover:text-payzone-gold'
                                                                        >
                                                                                <Edit3 className='h-5 w-5' />
                                                                        </button>
                                                                        <button
                                                                                onClick={() => handleDelete(product)}
                                                                                className='text-red-400 transition-colors duration-200 hover:text-red-300'
                                                                        >
                                                                                <Trash className='h-5 w-5' />
                                                                        </button>
                                                                </div>
                                                        </td>
                                                </tr>
                                        ))}
                                </tbody>
                                </table>
                        </div>
                </motion.div>
        );
};
export default ProductsList;

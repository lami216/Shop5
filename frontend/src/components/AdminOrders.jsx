import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import useTranslation from "../hooks/useTranslation";
import apiClient from "../lib/apiClient";
import { formatMRU } from "../lib/formatMRU";
import { formatNumberEn } from "../lib/formatNumberEn";
import { translate } from "../lib/locale";
import { useUserStore } from "../stores/useUserStore";

const STATUS_OPTIONS = ["paid_whatsapp", "paid", "processing", "shipped", "delivered"];

const AdminOrders = () => {
        const [orders, setOrders] = useState([]);
        const [loading, setLoading] = useState(true);
        const [updatingOrderId, setUpdatingOrderId] = useState(null);
        const { t } = useTranslation();
        const { user, checkingAuth } = useUserStore((state) => ({
                user: state.user,
                checkingAuth: state.checkingAuth,
        }));

        const fetchOrders = useCallback(async () => {
                setLoading(true);
                try {
                        const data = await apiClient.get("/orders");
                        setOrders(Array.isArray(data?.orders) ? data.orders : []);
                } catch (error) {
                        console.error("Failed to load orders", error);
                        const fallbackMessage = translate("admin.orders.messages.fetchError");
                        toast.error(error.response?.data?.message || fallbackMessage);
                } finally {
                        setLoading(false);
                }
        }, []);

        useEffect(() => {
                if (checkingAuth) {
                        return;
                }

                if (user?.role === "admin") {
                        fetchOrders();
                } else {
                        setOrders([]);
                        setLoading(false);
                }
        }, [checkingAuth, user?.role, fetchOrders]);

        const statusOptions = useMemo(
                () =>
                        STATUS_OPTIONS.map((status) => ({
                                value: status,
                                label: t(`admin.orders.statusLabels.${status}`),
                        })),
                [t]
        );

        const handleStatusChange = async (order, newStatus) => {
                if (!newStatus || order.status === newStatus) {
                        return;
                }

                setUpdatingOrderId(order._id);
                try {
                        const response = await apiClient.patch(`/orders/${order._id}/status`, {
                                status: newStatus,
                        });

                        if (response?.order) {
                                setOrders((previousOrders) =>
                                        previousOrders.map((currentOrder) =>
                                                currentOrder._id === order._id ? response.order : currentOrder
                                        )
                                );
                                toast.success(t("admin.orders.messages.statusUpdated"));
                        }
                } catch (error) {
                        console.error("Failed to update order status", error);
                        toast.error(error.response?.data?.message || t("admin.orders.messages.statusUpdateError"));
                } finally {
                        setUpdatingOrderId(null);
                }
        };

        const handleCancelOrder = async (order) => {
                if (order.status === "cancelled") {
                        return;
                }

                const reasonInput = window.prompt(t("admin.orders.prompts.cancelReason")) || "";
                const reason = reasonInput.trim();

                setUpdatingOrderId(order._id);
                try {
                        const response = await apiClient.patch(`/orders/${order._id}/cancel`, {
                                reason,
                        });

                        if (response?.order) {
                                setOrders((previousOrders) =>
                                        previousOrders.map((currentOrder) =>
                                                currentOrder._id === order._id ? response.order : currentOrder
                                        )
                                );
                                toast.success(t("admin.orders.messages.cancelled"));
                        }
                } catch (error) {
                        console.error("Failed to cancel order", error);
                        toast.error(error.response?.data?.message || t("admin.orders.messages.cancelError"));
                } finally {
                        setUpdatingOrderId(null);
                }
        };

        if (loading) {
                return (
                        <div className='flex justify-center py-16 text-white/80'>
                                {t("common.status.processing")}
                        </div>
                );
        }

        if (!orders.length) {
                return (
                        <motion.div
                                className='rounded-xl border border-white/10 bg-white/5 p-8 text-center text-white/70'
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                        >
                                {t("admin.orders.empty")}
                        </motion.div>
                );
        }

        return (
                <motion.div
                        className='space-y-6 rounded-xl border border-payzone-indigo/40 bg-white/5 p-6 text-white shadow-lg backdrop-blur-sm'
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                >
                        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                                <h2 className='text-2xl font-semibold text-payzone-gold'>{t("admin.orders.title")}</h2>
                                <button
                                        type='button'
                                        onClick={fetchOrders}
                                        className='inline-flex items-center rounded-lg border border-payzone-gold/40 px-4 py-2 text-sm font-medium text-payzone-gold transition hover:bg-payzone-gold/10'
                                >
                                        {t("admin.orders.refresh")}
                                </button>
                        </div>

                        <div className='overflow-x-auto'>
                                <table className='min-w-full divide-y divide-white/10 text-right text-sm text-white'>
                                        <thead className='bg-payzone-navy/60 text-xs uppercase tracking-wide text-white/60'>
                                                <tr>
                                                        <th className='px-4 py-3 font-medium'>{t("admin.orders.table.orderNumber")}</th>
                                                        <th className='px-4 py-3 font-medium'>{t("admin.orders.table.customer")}</th>
                                                        <th className='px-4 py-3 font-medium'>{t("admin.orders.table.total")}</th>
                                                        <th className='px-4 py-3 font-medium'>{t("admin.orders.table.status")}</th>
                                                        <th className='px-4 py-3 font-medium'>{t("admin.orders.table.createdAt")}</th>
                                                        <th className='px-4 py-3 font-medium'>{t("admin.orders.table.actions")}</th>
                                                </tr>
                                        </thead>
                                        <tbody className='divide-y divide-white/5'>
                                                {orders.map((order) => {
                                                        const itemCount = order.items?.reduce(
                                                                (sum, item) => sum + Number(item.quantity || 0),
                                                                0
                                                        );
                                                        const formattedCount = formatNumberEn(itemCount || 0);
                                                        const formattedTotal = formatMRU(order.total || 0);
                                                        const createdAt = order.createdAt
                                                                ? new Date(order.createdAt).toLocaleString("en-US")
                                                                : "-";
                                                        const paymentLabel = t(
                                                                `admin.orders.paymentMethods.${order.paymentMethod || "whatsapp"}`
                                                        );
                                                        const orderNumberDisplay = order.orderNumber
                                                                ? `#${formatNumberEn(order.orderNumber)}`
                                                                : "-";

                                                        return (
                                                                <tr key={order._id} className='bg-white/5 hover:bg-white/10'>
                                                                        <td className='px-4 py-4 align-middle text-base font-semibold text-payzone-gold'>
                                                                                {orderNumberDisplay}
                                                                        </td>
                                                                        <td className='px-4 py-4 align-middle'>
                                                                                <div className='flex flex-col text-sm'>
                                                                                        <span className='font-semibold text-white'>
                                                                                                {order.customerName}
                                                                                        </span>
                                                                                        <span className='text-xs text-white/70'>
                                                                                                {order.phone}
                                                                                        </span>
                                                                                </div>
                                                                        </td>
                                                                        <td className='px-4 py-4 align-middle'>
                                                                                <div className='flex flex-col items-end'>
                                                                                        <span className='font-semibold text-white'>{formattedTotal}</span>
                                                                                        <span className='text-xs text-white/60'>
                                                                                                {t("admin.orders.itemCount", { count: formattedCount })}
                                                                                        </span>
                                                                                        <span className='text-[11px] text-payzone-gold/80'>{paymentLabel}</span>
                                                                                </div>
                                                                        </td>
                                                                        <td className='px-4 py-4 align-middle'>
                                                                                <select
                                                                                        className='min-w-[10rem] rounded-lg border border-white/20 bg-payzone-navy/60 px-3 py-2 text-sm text-white focus:border-payzone-gold focus:outline-none'
                                                                                        value={order.status}
                                                                                        onChange={(event) => handleStatusChange(order, event.target.value)}
                                                                                        disabled={order.status === "cancelled" || updatingOrderId === order._id}
                                                                                >
                                                                                        <option value='pending'>
                                                                                                {t("admin.orders.statusLabels.pending")}
                                                                                        </option>
                                                                                        {statusOptions.map((option) => (
                                                                                                <option key={option.value} value={option.value}>
                                                                                                        {option.label}
                                                                                                </option>
                                                                                        ))}
                                                                                        <option value='cancelled' disabled>
                                                                                                {t("admin.orders.statusLabels.cancelled")}
                                                                                        </option>
                                                                                </select>
                                                                                {order.status === "cancelled" && (
                                                                                        <span className='mt-2 block text-xs text-red-300'>
                                                                                                {t("admin.orders.statusNotes.cancelled")}
                                                                                        </span>
                                                                                )}
                                                                        </td>
                                                                        <td className='px-4 py-4 align-middle text-sm text-white/80'>
                                                                                {createdAt}
                                                                        </td>
                                                                        <td className='px-4 py-4 align-middle text-left'>
                                                                                <div className='flex flex-wrap items-center justify-end gap-2'>
                                                                                        <button
                                                                                                type='button'
                                                                                                onClick={() => handleCancelOrder(order)}
                                                                                                disabled={order.status === "cancelled" || updatingOrderId === order._id}
                                                                                                className='rounded-lg border border-red-400/60 px-3 py-2 text-xs font-medium text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60'
                                                                                        >
                                                                                                {t("admin.orders.actions.cancel")}
                                                                                        </button>
                                                                                </div>
                                                                        </td>
                                                                </tr>
                                                        );
                                                })}
                                        </tbody>
                                </table>
                        </div>
                </motion.div>
        );
};

export default AdminOrders;

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Users, Package, ShoppingCart, DollarSign } from "lucide-react";
import useTranslation from "../hooks/useTranslation";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import apiClient from "../lib/apiClient";
import { formatMRU } from "../lib/formatMRU";
import { formatNumberEn } from "../lib/formatNumberEn";

const AnalyticsTab = () => {
        const [analyticsData, setAnalyticsData] = useState({
                users: 0,
                products: 0,
                totalSales: 0,
                totalRevenue: 0,
        });
        const [isLoading, setIsLoading] = useState(true);
        const [dailySalesData, setDailySalesData] = useState([]);
        const { t } = useTranslation();

        useEffect(() => {
                const fetchAnalyticsData = async () => {
                        try {
                                const data = await apiClient.get("/analytics");
                                setAnalyticsData(data.analyticsData);
                                const normalizedDailyData = Array.isArray(data.dailySalesData)
                                        ? data.dailySalesData.map((entry) => ({
                                                  date: entry.date,
                                                  sales: Number(entry.sales || 0),
                                                  revenue: Number(entry.revenue || 0),
                                          }))
                                        : [];
                                setDailySalesData(normalizedDailyData);
                        } catch (error) {
                                console.error("Error fetching analytics data:", error);
                        } finally {
                                setIsLoading(false);
                        }
                };

                fetchAnalyticsData();
        }, []);

        if (isLoading) {
                return <div>{t("admin.analytics.loading")}</div>;
        }

        return (
                <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
                        <div className='mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4'>
                                <AnalyticsCard
                                        title={t("admin.analytics.cards.users")}
                                        value={formatNumberEn(analyticsData.users)}
                                        icon={Users}
                                        gradient='from-payzone-indigo/70 via-payzone-indigo/60 to-payzone-navy'
                                />
                                <AnalyticsCard
                                        title={t("admin.analytics.cards.products")}
                                        value={formatNumberEn(analyticsData.products)}
                                        icon={Package}
                                        gradient='from-payzone-gold/80 via-payzone-gold/60 to-payzone-navy'
                                />
                                <AnalyticsCard
                                        title={t("admin.analytics.cards.sales")}
                                        value={formatNumberEn(analyticsData.totalSales)}
                                        icon={ShoppingCart}
                                        gradient='from-payzone-indigo/60 via-payzone-gold/40 to-payzone-navy'
                                />
                                <AnalyticsCard
                                        title={t("admin.analytics.cards.revenue")}
                                        value={formatMRU(analyticsData.totalRevenue)}
                                        icon={DollarSign}
                                        gradient='from-payzone-gold via-payzone-indigo/50 to-payzone-navy'
                                />
                        </div>
                        <motion.div
                                className='rounded-xl border border-payzone-indigo/40 bg-white/5 p-6 shadow-lg backdrop-blur-sm'
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.25 }}
                        >
                                <ResponsiveContainer width='100%' height={400}>
                                        <LineChart data={dailySalesData}>
                                                <CartesianGrid stroke='rgba(255,255,255,0.1)' strokeDasharray='3 3' />
                                                <XAxis dataKey='date' stroke='#F8FAFC' tick={{ fill: "#F8FAFC" }} />
                                                <YAxis yAxisId='left' stroke='#F8FAFC' tick={{ fill: "#F8FAFC" }} />
                                                <YAxis yAxisId='right' orientation='right' stroke='#F8FAFC' tick={{ fill: "#F8FAFC" }} />
                                                <Tooltip
                                                        contentStyle={{ backgroundColor: "rgba(14,39,72,0.95)", borderRadius: "0.75rem", border: "1px solid rgba(210,156,74,0.4)", color: "#FFFFFF" }}
                                                />
                                                <Legend wrapperStyle={{ color: "#FFFFFF" }} />
                                                <Line
                                                        yAxisId='left'
                                                        type='monotone'
                                                        dataKey='sales'
                                                        stroke='#D29C4A'
                                                        strokeWidth={3}
                                                        activeDot={{ r: 8 }}
                                                        name={t("admin.analytics.chart.sales")}
                                                />
                                                <Line
                                                        yAxisId='right'
                                                        type='monotone'
                                                        dataKey='revenue'
                                                        stroke='#4B4ACF'
                                                        strokeWidth={3}
                                                        activeDot={{ r: 8 }}
                                                        name={t("admin.analytics.chart.revenue")}
                                                />
                                        </LineChart>
                                </ResponsiveContainer>
                        </motion.div>
                </div>
        );
};
export default AnalyticsTab;

const AnalyticsCard = ({ title, value, icon: Icon, gradient }) => (
        <motion.div
                className='relative overflow-hidden rounded-xl border border-white/10 bg-payzone-navy/80 p-6 shadow-lg'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
        >
                <div className='absolute inset-0 opacity-70'>
                        <div className={`h-full w-full bg-gradient-to-br ${gradient}`} />
                </div>
                <div className='relative z-10 flex justify-between'>
                        <div>
                                <p className='mb-1 text-xs font-semibold uppercase tracking-wide text-white/70'>{title}</p>
                                <h3 className='text-3xl font-bold text-white'>{value}</h3>
                        </div>
                        <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 text-payzone-gold'>
                                <Icon className='h-6 w-6' />
                        </div>
                </div>
                <div className='absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-70' />
        </motion.div>
);

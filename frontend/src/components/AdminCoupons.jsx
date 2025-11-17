import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Ban, CheckCircle, Edit3, Loader2, PlusCircle, Search, SortAsc, SortDesc, X } from "lucide-react";
import { useCouponStore } from "../stores/useCouponStore";
import useTranslation from "../hooks/useTranslation";

const SORT_OPTIONS = [
        { value: "createdAt", labelKey: "admin.coupons.sort.createdAt" },
        { value: "code", labelKey: "admin.coupons.sort.code" },
        { value: "discountPercentage", labelKey: "admin.coupons.sort.discount" },
        { value: "expiresAt", labelKey: "admin.coupons.sort.expiresAt" },
        { value: "isActive", labelKey: "admin.coupons.sort.isActive" },
];

const toInputDateTimeValue = (date) => {
        const parsed = new Date(date);
        if (Number.isNaN(parsed.getTime())) {
                return "";
        }
        const offset = parsed.getTimezoneOffset();
        const localDate = new Date(parsed.getTime() - offset * 60 * 1000);
        return localDate.toISOString().slice(0, 16);
};

const toISOStringFromInput = (value) => {
        if (!value) {
                return "";
        }
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
                return "";
        }
        return parsed.toISOString();
};

const buildInitialFormState = () => ({
        code: "",
        bulkCodes: "",
        discountPercentage: "",
        expiresAt: "",
        isActive: true,
});

const extractBulkCodes = (value) => {
        if (typeof value !== "string") {
                return [];
        }

        return value
                .split(/[\s,;]+/)
                .map((segment) => segment.replace(/[^A-Z0-9]/gi, "").toUpperCase())
                .filter(Boolean);
};

const AdminCoupons = () => {
        const {
                coupons,
                total,
                page,
                limit,
                loading,
                mutationLoading,
                sortBy,
                sortOrder,
                fetchCoupons,
                createCoupon,
                updateCoupon,
        } = useCouponStore();
        const { t } = useTranslation();

        const [searchTerm, setSearchTerm] = useState("");
        const [localSortBy, setLocalSortBy] = useState(sortBy);
        const [localSortOrder, setLocalSortOrder] = useState(sortOrder);
        const [isFormOpen, setIsFormOpen] = useState(false);
        const [formValues, setFormValues] = useState(buildInitialFormState);
        const [formErrors, setFormErrors] = useState({});
        const [editingCoupon, setEditingCoupon] = useState(null);
        const [isBulkMode, setIsBulkMode] = useState(false);

        const totalPages = useMemo(() => Math.max(1, Math.ceil(total / (limit || 1))), [total, limit]);

        useEffect(() => {
                fetchCoupons({ page: 1, search: "", sortBy: "createdAt", sortOrder: "desc" });
        }, [fetchCoupons]);

        useEffect(() => {
                const handler = setTimeout(() => {
                        fetchCoupons({ page: 1, search: searchTerm, sortBy: localSortBy, sortOrder: localSortOrder });
                }, 300);

                return () => clearTimeout(handler);
        }, [searchTerm, localSortBy, localSortOrder, fetchCoupons]);

        const resetForm = () => {
                setFormValues(buildInitialFormState());
                setFormErrors({});
                setEditingCoupon(null);
                setIsBulkMode(false);
        };

        const openCreateForm = () => {
                resetForm();
                setIsFormOpen(true);
        };

        const openEditForm = (coupon) => {
                setEditingCoupon(coupon);
                setFormValues({
                        code: coupon.code || "",
                        bulkCodes: "",
                        discountPercentage: String(coupon.discountPercentage ?? ""),
                        expiresAt: toInputDateTimeValue(coupon.expiresAt),
                        isActive: Boolean(coupon.isActive),
                });
                setFormErrors({});
                setIsBulkMode(false);
                setIsFormOpen(true);
        };

        const closeForm = () => {
                setIsFormOpen(false);
                resetForm();
        };

        const handleSortToggle = () => {
                setLocalSortOrder((previous) => (previous === "asc" ? "desc" : "asc"));
        };

        const handlePageChange = (nextPage) => {
                fetchCoupons({ page: nextPage, search: searchTerm, sortBy: localSortBy, sortOrder: localSortOrder });
        };

        const handleFieldChange = (field, value) => {
                setFormValues((previous) => {
                        if (field === "code") {
                                const cleaned = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
                                return { ...previous, code: cleaned };
                        }
                        if (field === "bulkCodes") {
                                return {
                                        ...previous,
                                        bulkCodes: value.toUpperCase().replace(/[^A-Z0-9,\s;]/g, ""),
                                };
                        }
                        if (field === "discountPercentage") {
                                return { ...previous, discountPercentage: value.replace(/[^0-9]/g, "") };
                        }
                        return { ...previous, [field]: value };
                });
        };

        const handleBulkToggle = () => {
                if (editingCoupon) {
                        return;
                }

                setIsBulkMode((previous) => !previous);
                setFormErrors({});
        };

        const validateForm = () => {
                const errors = {};
                const { code, bulkCodes, discountPercentage, expiresAt } = formValues;

                if (isBulkMode) {
                        const parsedCodes = extractBulkCodes(bulkCodes);

                        if (!parsedCodes.length) {
                                errors.bulkCodes = t("admin.coupons.validation.bulkRequired");
                        } else {
                                const hasInvalidCode = parsedCodes.some((value) => !/^[A-Z0-9]+$/.test(value));
                                const hasDuplicates = new Set(parsedCodes).size !== parsedCodes.length;

                                if (hasInvalidCode) {
                                        errors.bulkCodes = t("admin.coupons.validation.bulkFormat");
                                } else if (hasDuplicates) {
                                        errors.bulkCodes = t("admin.coupons.validation.bulkDuplicate");
                                }
                        }
                } else {
                        const normalizedCode = code.trim().toUpperCase();

                        if (!normalizedCode) {
                                errors.code = t("admin.coupons.validation.codeRequired");
                        } else if (!/^[A-Z0-9]+$/.test(normalizedCode)) {
                                errors.code = t("admin.coupons.validation.codeFormat");
                        }
                }

                if (discountPercentage === "") {
                        errors.discountPercentage = t("admin.coupons.validation.discountRequired");
                } else {
                        const discountValue = Number(discountPercentage);
                        if (!Number.isFinite(discountValue)) {
                                errors.discountPercentage = t("admin.coupons.validation.discountRequired");
                        } else if (discountValue < 1 || discountValue > 90) {
                                errors.discountPercentage = t("admin.coupons.validation.discountRange");
                        }
                }

                const expiresValue = toISOStringFromInput(expiresAt);
                if (!expiresValue) {
                        errors.expiresAt = t("admin.coupons.validation.expiresRequired");
                } else if (new Date(expiresValue) <= new Date()) {
                        errors.expiresAt = t("admin.coupons.validation.expiresFuture");
                }

                setFormErrors(errors);
                return Object.keys(errors).length === 0;
        };

        const handleSubmit = async (event) => {
                event.preventDefault();
                if (!validateForm()) {
                        return;
                }

                const payload = {
                        discountPercentage: Number(formValues.discountPercentage),
                        expiresAt: toISOStringFromInput(formValues.expiresAt),
                        isActive: Boolean(formValues.isActive),
                };

                if (isBulkMode) {
                        payload.codes = Array.from(new Set(extractBulkCodes(formValues.bulkCodes)));
                } else {
                        payload.code = formValues.code;
                }

                try {
                        if (editingCoupon) {
                                await updateCoupon(editingCoupon._id, payload);
                        } else {
                                await createCoupon(payload);
                        }
                        closeForm();
                } catch {
                        // Errors handled by store toasts
                }
        };

        const handleToggleActive = async (coupon) => {
                try {
                        await updateCoupon(coupon._id, { isActive: !coupon.isActive });
                } catch {
                        // Error handled by store toast
                }
        };

        return (
                <div className='rounded-xl bg-white/10 p-6 shadow-lg backdrop-blur'>
                        <div className='mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                                <div>
                                        <h2 className='text-2xl font-semibold text-white'>{t("admin.coupons.title")}</h2>
                                        <p className='text-sm text-white/70'>{t("admin.coupons.subtitle")}</p>
                                </div>
                                <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
                                        <div className='flex items-center rounded-lg bg-white/10 px-3 py-2 shadow-inner'>
                                                <Search className='mr-2 h-5 w-5 text-payzone-gold' />
                                                <input
                                                        type='text'
                                                        value={searchTerm}
                                                        onChange={(event) => setSearchTerm(event.target.value)}
                                                        placeholder={t("admin.coupons.searchPlaceholder")}
                                                        className='w-48 bg-transparent text-sm text-white placeholder-white/60 focus:outline-none'
                                                />
                                        </div>
                                        <div className='flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 shadow-inner'>
                                                <select
                                                        value={localSortBy}
                                                        onChange={(event) => setLocalSortBy(event.target.value)}
                                                        className='bg-transparent text-sm text-white focus:outline-none'
                                                >
                                                        {SORT_OPTIONS.map((option) => (
                                                                <option key={option.value} value={option.value} className='text-black'>
                                                                        {t(option.labelKey)}
                                                                </option>
                                                        ))}
                                                </select>
                                                <button
                                                        type='button'
                                                        onClick={handleSortToggle}
                                                        className='rounded-md bg-payzone-gold/10 p-1 text-payzone-gold transition hover:bg-payzone-gold/20'
                                                >
                                                        {localSortOrder === "asc" ? (
                                                                <SortAsc className='h-5 w-5' />
                                                        ) : (
                                                                <SortDesc className='h-5 w-5' />
                                                        )}
                                                </button>
                                        </div>
                                        <button
                                                type='button'
                                                onClick={openCreateForm}
                                                className='flex items-center justify-center gap-2 rounded-lg bg-payzone-gold px-4 py-2 font-semibold text-payzone-navy shadow transition hover:bg-yellow-400'
                                        >
                                                <PlusCircle className='h-5 w-5' />
                                                {t("admin.coupons.addButton")}
                                        </button>
                                </div>
                        </div>

                        <div className='overflow-x-auto rounded-lg bg-white/5 shadow-inner'>
                                <table className='min-w-full divide-y divide-white/10 text-left text-sm text-white'>
                                        <thead className='bg-white/10 text-xs uppercase tracking-wider text-white/80'>
                                                <tr>
                                                        <th className='px-4 py-3'>{t("admin.coupons.table.code")}</th>
                                                        <th className='px-4 py-3'>{t("admin.coupons.table.discount")}</th>
                                                        <th className='px-4 py-3'>{t("admin.coupons.table.expiresAt")}</th>
                                                        <th className='px-4 py-3'>{t("admin.coupons.table.isActive")}</th>
                                                        <th className='px-4 py-3'>{t("admin.coupons.table.createdAt")}</th>
                                                        <th className='px-4 py-3 text-right'>{t("admin.coupons.table.actions")}</th>
                                                </tr>
                                        </thead>
                                        <tbody className='divide-y divide-white/10'>
                                                {loading ? (
                                                        <tr>
                                                                <td colSpan={6} className='px-4 py-6 text-center text-white'>
                                                                        <div className='flex items-center justify-center gap-2'>
                                                                                <Loader2 className='h-5 w-5 animate-spin text-payzone-gold' />
                                                                                {t("common.loading")}
                                                                        </div>
                                                                </td>
                                                        </tr>
                                                ) : coupons.length === 0 ? (
                                                        <tr>
                                                                <td colSpan={6} className='px-4 py-6 text-center text-white/70'>
                                                                        {t("admin.coupons.empty")}
                                                                </td>
                                                        </tr>
                                                ) : (
                                                        coupons.map((coupon) => (
                                                                <tr key={coupon._id} className='hover:bg-white/5'>
                                                                        <td className='whitespace-nowrap px-4 py-3 font-semibold'>
                                                                                {coupon.code}
                                                                        </td>
                                                                        <td className='whitespace-nowrap px-4 py-3'>
                                                                                {Number(coupon.discountPercentage || 0).toLocaleString("en-US", {
                                                                                        maximumFractionDigits: 2,
                                                                                })}
                                                                                %
                                                                        </td>
                                                                        <td className='whitespace-nowrap px-4 py-3'>
                                                                                {new Date(coupon.expiresAt).toLocaleString("en-US")}
                                                                        </td>
                                                                        <td className='px-4 py-3'>
                                                                                <span
                                                                                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                                                                                                coupon.isActive
                                                                                                        ? "bg-emerald-500/10 text-emerald-200"
                                                                                                        : "bg-rose-500/10 text-rose-200"
                                                                                        }`}
                                                                                >
                                                                                        {coupon.isActive ? (
                                                                                                <>
                                                                                                        <CheckCircle className='h-4 w-4 text-emerald-400' />
                                                                                                        {t("admin.coupons.status.active")}
                                                                                                </>
                                                                                        ) : (
                                                                                                <>
                                                                                                        <Ban className='h-4 w-4 text-rose-400' />
                                                                                                        {t("admin.coupons.status.inactive")}
                                                                                                </>
                                                                                        )}
                                                                                </span>
                                                                        </td>
                                                                        <td className='whitespace-nowrap px-4 py-3'>
                                                                                {new Date(coupon.createdAt).toLocaleString("en-US")}
                                                                        </td>
                                                                        <td className='px-4 py-3 text-right'>
                                                                                <div className='flex items-center justify-end gap-2'>
                                                                                        <button
                                                                                                type='button'
                                                                                                onClick={() => openEditForm(coupon)}
                                                                                                className='inline-flex items-center gap-1 rounded-md bg-payzone-gold/10 px-3 py-1 text-sm text-payzone-gold transition hover:bg-payzone-gold/20'
                                                                                                disabled={mutationLoading}
                                                                                        >
                                                                                                <Edit3 className='h-4 w-4' />
                                                                                                {t("common.actions.edit")}
                                                                                        </button>
                                                                                        <button
                                                                                                type='button'
                                                                                                onClick={() => handleToggleActive(coupon)}
                                                                                                className='inline-flex items-center gap-1 rounded-md bg-white/10 px-3 py-1 text-sm text-white transition hover:bg-white/20 disabled:opacity-60'
                                                                                                disabled={mutationLoading}
                                                                                        >
                                                                                                {coupon.isActive ? (
                                                                                                        <>
                                                                                                                <Ban className='h-4 w-4 text-rose-400' />
                                                                                                                {t("admin.coupons.actions.deactivate")}
                                                                                                        </>
                                                                                                ) : (
                                                                                                        <>
                                                                                                                <BadgeCheck className='h-4 w-4 text-emerald-400' />
                                                                                                                {t("admin.coupons.actions.activate")}
                                                                                                        </>
                                                                                                )}
                                                                                        </button>
                                                                                </div>
                                                                        </td>
                                                                </tr>
                                                        ))
                                                )}
                                        </tbody>
                                </table>
                        </div>

                        <div className='mt-4 flex flex-col items-center justify-between gap-3 text-sm text-white/80 sm:flex-row'>
                                <div>
                                        {t("admin.coupons.pagination.summary", {
                                                page: page.toLocaleString("en-US"),
                                                totalPages: totalPages.toLocaleString("en-US"),
                                                total: total.toLocaleString("en-US"),
                                        })}
                                </div>
                                <div className='flex items-center gap-2'>
                                        <button
                                                type='button'
                                                onClick={() => handlePageChange(Math.max(1, page - 1))}
                                                disabled={page <= 1 || loading}
                                                className='rounded-md bg-white/10 px-3 py-1 text-white transition hover:bg-white/20 disabled:opacity-60'
                                        >
                                                {t("admin.coupons.pagination.prev")}
                                        </button>
                                        <span className='rounded-md bg-white/10 px-3 py-1 text-white'>
                                                {page.toLocaleString("en-US")}
                                        </span>
                                        <button
                                                type='button'
                                                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                                                disabled={page >= totalPages || loading}
                                                className='rounded-md bg-white/10 px-3 py-1 text-white transition hover:bg-white/20 disabled:opacity-60'
                                        >
                                                {t("admin.coupons.pagination.next")}
                                        </button>
                                </div>
                        </div>

                        {isFormOpen && (
                                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4'>
                                        <div className='w-full max-w-md rounded-2xl bg-payzone-navy p-6 shadow-2xl'>
                                                <div className='mb-4 flex items-start justify-between'>
                                                        <div>
                                                                <h3 className='text-xl font-semibold text-white'>
                                                                        {editingCoupon
                                                                                ? t("admin.coupons.form.editTitle", { code: editingCoupon.code })
                                                                                : t("admin.coupons.form.createTitle")}
                                                                </h3>
                                                                <p className='text-sm text-white/70'>
                                                                        {editingCoupon
                                                                                ? t("admin.coupons.form.editSubtitle")
                                                                                : t("admin.coupons.form.createSubtitle")}
                                                                </p>
                                                        </div>
                                                        <button
                                                                type='button'
                                                                onClick={closeForm}
                                                                className='rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20'
                                                                disabled={mutationLoading}
                                                                aria-label={t("common.actions.close")}
                                                        >
                                                                <X className='h-5 w-5' />
                                                        </button>
                                                </div>
                                                <form onSubmit={handleSubmit} className='space-y-4'>
                                                        <div>
                                                                <div className='mb-1 flex items-center justify-between gap-3'>
                                                                        <label className='block text-sm font-medium text-white'>
                                                                                {isBulkMode
                                                                                        ? t("admin.coupons.form.bulkCodes")
                                                                                        : t("admin.coupons.form.code")}
                                                                        </label>
                                                                        <button
                                                                                type='button'
                                                                                onClick={handleBulkToggle}
                                                                                className='rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-60'
                                                                                disabled={Boolean(editingCoupon) || mutationLoading}
                                                                        >
                                                                                {isBulkMode
                                                                                        ? t("admin.coupons.form.bulkModeSingle")
                                                                                        : t("admin.coupons.form.bulkModeMultiple")}
                                                                        </button>
                                                                </div>
                                                                {isBulkMode ? (
                                                                        <>
                                                                                <textarea
                                                                                        rows={4}
                                                                                        value={formValues.bulkCodes}
                                                                                        onChange={(event) =>
                                                                                                handleFieldChange("bulkCodes", event.target.value)
                                                                                        }
                                                                                        className='w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white focus:border-payzone-gold focus:outline-none'
                                                                                />
                                                                                <p className='mt-1 text-xs text-white/60'>
                                                                                        {t("admin.coupons.form.bulkHint")}
                                                                                </p>
                                                                                {formErrors.bulkCodes && (
                                                                                        <p className='mt-1 text-xs text-rose-400'>
                                                                                                {formErrors.bulkCodes}
                                                                                        </p>
                                                                                )}
                                                                        </>
                                                                ) : (
                                                                        <>
                                                                                <input
                                                                                        type='text'
                                                                                        value={formValues.code}
                                                                                        onChange={(event) =>
                                                                                                handleFieldChange("code", event.target.value)
                                                                                        }
                                                                                        className='w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white focus:border-payzone-gold focus:outline-none'
                                                                                        maxLength={32}
                                                                                        required
                                                                                />
                                                                                {formErrors.code && (
                                                                                        <p className='mt-1 text-xs text-rose-400'>
                                                                                                {formErrors.code}
                                                                                        </p>
                                                                                )}
                                                                        </>
                                                                )}
                                                        </div>
                                                        <div>
                                                                <label className='mb-1 block text-sm font-medium text-white'>
                                                                        {t("admin.coupons.form.discountPercentage")}
                                                                </label>
                                                                <input
                                                                        type='number'
                                                                        min='1'
                                                                        max='90'
                                                                        step='1'
                                                                        value={formValues.discountPercentage}
                                                                        onChange={(event) => handleFieldChange("discountPercentage", event.target.value)}
                                                                        className='w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white focus:border-payzone-gold focus:outline-none'
                                                                        required
                                                                />
                                                                {formErrors.discountPercentage && (
                                                                        <p className='mt-1 text-xs text-rose-400'>
                                                                                {formErrors.discountPercentage}
                                                                        </p>
                                                                )}
                                                        </div>
                                                        <div>
                                                                <label className='mb-1 block text-sm font-medium text-white'>
                                                                        {t("admin.coupons.form.expiresAt")}
                                                                </label>
                                                                <input
                                                                        type='datetime-local'
                                                                        value={formValues.expiresAt}
                                                                        onChange={(event) => handleFieldChange("expiresAt", event.target.value)}
                                                                        className='w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white focus:border-payzone-gold focus:outline-none'
                                                                        required
                                                                />
                                                                {formErrors.expiresAt && (
                                                                        <p className='mt-1 text-xs text-rose-400'>{formErrors.expiresAt}</p>
                                                                )}
                                                        </div>
                                                        <div className='flex items-center justify-between'>
                                                                <span className='text-sm text-white'>
                                                                        {t("admin.coupons.form.isActive")}
                                                                </span>
                                                                <button
                                                                        type='button'
                                                                        onClick={() =>
                                                                                setFormValues((previous) => ({
                                                                                        ...previous,
                                                                                        isActive: !previous.isActive,
                                                                                }))
                                                                        }
                                                                        className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm transition ${
                                                                                formValues.isActive
                                                                                        ? "bg-emerald-500/20 text-emerald-300"
                                                                                        : "bg-rose-500/20 text-rose-300"
                                                                        }`}
                                                                        disabled={mutationLoading}
                                                                >
                                                                        {formValues.isActive ? (
                                                                                <CheckCircle className='h-4 w-4' />
                                                                        ) : (
                                                                                <Ban className='h-4 w-4' />
                                                                        )}
                                                                        {formValues.isActive
                                                                                ? t("admin.coupons.status.active")
                                                                                : t("admin.coupons.status.inactive")}
                                                                </button>
                                                        </div>
                                                        <div className='flex justify-end gap-2 pt-2'>
                                                                <button
                                                                        type='button'
                                                                        onClick={closeForm}
                                                                        className='rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-60'
                                                                        disabled={mutationLoading}
                                                                >
                                                                        {t("common.actions.cancel")}
                                                                </button>
                                                                <button
                                                                        type='submit'
                                                                        className='flex items-center gap-2 rounded-lg bg-payzone-gold px-4 py-2 text-sm font-semibold text-payzone-navy transition hover:bg-yellow-400 disabled:opacity-60'
                                                                        disabled={mutationLoading}
                                                                >
                                                                        {mutationLoading && <Loader2 className='h-4 w-4 animate-spin' />}
                                                                        {editingCoupon
                                                                                ? t("admin.coupons.form.submitEdit")
                                                                                : t("admin.coupons.form.submitCreate")}
                                                                </button>
                                                        </div>
                                                </form>
                                        </div>
                                </div>
                        )}
                </div>
        );
};

export default AdminCoupons;

export const formatMRU = (value) =>
        new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "MRU",
                minimumFractionDigits: 0,
        }).format(value);

export default formatMRU;

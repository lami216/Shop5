import ar from "../locales/ar/translation.json";

export const LANGUAGE = "ar";

const getNestedValue = (key) => {
        return key.split(".").reduce((accumulator, segment) => {
                if (accumulator && Object.prototype.hasOwnProperty.call(accumulator, segment)) {
                        return accumulator[segment];
                }
                return undefined;
        }, ar);
};

const formatTemplate = (template, options = {}) => {
        if (typeof template !== "string") return template;
        return template.replace(/{{(.*?)}}/g, (_, token) => {
                const cleanedToken = token.trim();
                return Object.prototype.hasOwnProperty.call(options, cleanedToken)
                        ? options[cleanedToken]
                        : "";
        });
};

export const translate = (key, options = {}) => {
        const value = getNestedValue(key);

        if (value === undefined) {
                return key;
        }

        if (typeof value === "string") {
                        return formatTemplate(value, options);
        }

        if (Array.isArray(value)) {
                return value.map((item) =>
                        typeof item === "string" ? formatTemplate(item, options) : item
                );
        }

        if (typeof value === "object" && value !== null) {
                return JSON.parse(JSON.stringify(value));
        }

        return value;
};

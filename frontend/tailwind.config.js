/** @type {import('tailwindcss').Config} */
export default {
        content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
        theme: {
                extend: {
                        colors: {
                                "payzone-navy": "var(--color-background)",
                                "payzone-white": "var(--color-ivory)",
                                "payzone-gold": "var(--color-accent)",
                                "payzone-indigo": "var(--color-text-secondary)",
                                "brand-border": "var(--color-border)",
                                "brand-surface": "var(--color-background)",
                                "brand-card": "var(--color-card)",
                        },
                },
        },
        plugins: [],
};

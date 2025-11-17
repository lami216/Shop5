/** @type {import('tailwindcss').Config} */
export default {
        content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
        theme: {
                extend: {
                        colors: {
                                "payzone-navy": "#0E2748",
                                "payzone-white": "#FFFFFF",
                                "payzone-gold": "#D29C4A",
                                "payzone-indigo": "#4B4ACF",
                        },
                },
        },
        plugins: [],
};

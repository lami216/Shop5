import { useEffect } from "react";

const LanguageProvider = ({ children }) => {
        useEffect(() => {
                document.documentElement.lang = "ar";
                document.documentElement.dir = "rtl";
        }, []);

        return children;
};

export default LanguageProvider;

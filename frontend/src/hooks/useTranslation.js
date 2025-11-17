import { LANGUAGE, translate } from "../lib/locale";

export const useTranslation = () => {
        const t = (key, options) => translate(key, options);

        return {
                t,
                i18n: {
                        language: LANGUAGE,
                        changeLanguage: () => {},
                        t,
                },
        };
};

export default useTranslation;

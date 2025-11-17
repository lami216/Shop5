import useTranslation from "../hooks/useTranslation";

const LoadingSpinner = () => {
        const { t } = useTranslation();
        return (
                <div className='flex min-h-screen items-center justify-center bg-payzone-navy'>
                        <div className='relative'>
                                <div className='h-20 w-20 rounded-full border-2 border-payzone-indigo/30' />
                                <div className='absolute left-0 top-0 h-20 w-20 animate-spin rounded-full border-t-2 border-payzone-gold' />
                                <div className='sr-only'>{t("common.loading")}</div>
                        </div>
                </div>
        );
};

export default LoadingSpinner;

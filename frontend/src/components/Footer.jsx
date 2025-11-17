import SocialLinks from "./SocialLinks";

const Footer = () => {
        const buildTime = new Date(import.meta.env.VITE_BUILD_TIME).toLocaleString();
        return (
                <footer className='mt-16 bg-payzone-navy text-payzone-white'>
                        <div className='container mx-auto flex flex-col items-center px-4 py-10 text-center'>
                                <SocialLinks />
                                <small className='mt-6 text-xs text-white/60'>آخر تحديث للموقع: {buildTime}</small>
                        </div>
                </footer>
        );
};

export default Footer;

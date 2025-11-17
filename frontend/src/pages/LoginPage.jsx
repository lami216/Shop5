import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LogIn, Mail, Lock, ArrowLeft, Loader } from "lucide-react";
import useTranslation from "../hooks/useTranslation";
import { useUserStore } from "../stores/useUserStore";

const LoginPage = () => {
        const [email, setEmail] = useState("");
        const [password, setPassword] = useState("");

        const { login, loading } = useUserStore();
        const { t } = useTranslation();

        const handleSubmit = (e) => {
                e.preventDefault();
                login(email, password);
        };

        return (
                <div className='flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
                        <motion.div
                                className='sm:mx-auto sm:w-full sm:max-w-md'
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                        >
                                <h2 className='mt-6 text-center text-3xl font-extrabold text-payzone-gold'>
                                        {t("auth.login.title")}
                                </h2>
                        </motion.div>

                        <motion.div
                                className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                        >
                                <div className='rounded-xl border border-payzone-indigo/40 bg-white/5 py-8 px-4 shadow backdrop-blur-sm sm:px-10'>
                                        <form onSubmit={handleSubmit} className='space-y-6'>
                                                <div>
                                                        <label htmlFor='email' className='block text-sm font-medium text-white/80'>
                                                                {t("auth.login.email")}
                                                        </label>
                                                        <div className='relative mt-1 rounded-md shadow-sm'>
                                                                <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3'>
                                                                        <Mail className='h-5 w-5 text-white/50' aria-hidden='true' />
                                                                </div>
                                                                <input
                                                                        id='email'
                                                                        type='email'
                                                                        required
                                                                        value={email}
                                                                        onChange={(e) => setEmail(e.target.value)}
                                                                        className='block w-full rounded-md border border-payzone-indigo/40 bg-payzone-navy/60 px-3 py-2 pr-10 text-white placeholder-white/40 focus:border-payzone-gold focus:outline-none focus:ring-2 focus:ring-payzone-indigo sm:text-sm'
                                                                        placeholder={t("auth.login.placeholderEmail")}
                                                                />
                                                        </div>
                                                </div>

                                                <div>
                                                        <label htmlFor='password' className='block text-sm font-medium text-white/80'>
                                                                {t("auth.login.password")}
                                                        </label>
                                                        <div className='relative mt-1 rounded-md shadow-sm'>
                                                                <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3'>
                                                                        <Lock className='h-5 w-5 text-white/50' aria-hidden='true' />
                                                                </div>
                                                                <input
                                                                        id='password'
                                                                        type='password'
                                                                        required
                                                                        value={password}
                                                                        onChange={(e) => setPassword(e.target.value)}
                                                                        className='block w-full rounded-md border border-payzone-indigo/40 bg-payzone-navy/60 px-3 py-2 pr-10 text-white placeholder-white/40 focus:border-payzone-gold focus:outline-none focus:ring-2 focus:ring-payzone-indigo sm:text-sm'
                                                                        placeholder={t("auth.login.placeholderPassword")}
                                                                />
                                                        </div>
                                                </div>

                                                <button
                                                        type='submit'
                                                        className='flex w-full items-center justify-center gap-2 rounded-md bg-payzone-gold px-4 py-2 text-sm font-semibold text-payzone-navy transition duration-300 hover:bg-[#b8873d] focus:outline-none focus:ring-2 focus:ring-payzone-indigo/60 disabled:opacity-50'
                                                        disabled={loading}
                                                >
                                                        {loading ? (
                                                                <>
                                                                        <Loader className='h-5 w-5 animate-spin' aria-hidden='true' />
                                                                        {t("auth.login.loading")}
                                                                </>
                                                        ) : (
                                                                <>
                                                                        <LogIn className='h-5 w-5' aria-hidden='true' />
                                                                        {t("auth.login.button")}
                                                                </>
                                                        )}
                                                </button>
                                        </form>

                                        <p className='mt-8 text-center text-sm text-white/70'>
                                                {t("auth.login.prompt")} {" "}
                                                <Link to='/signup' className='font-medium text-payzone-indigo transition duration-300 hover:text-payzone-gold'>
                                                        {t("auth.login.cta")}{" "}
                                                        <ArrowLeft className='mr-1 inline h-4 w-4' />
                                                </Link>
                                        </p>
                                </div>
                        </motion.div>
                </div>
        );
};
export default LoginPage;

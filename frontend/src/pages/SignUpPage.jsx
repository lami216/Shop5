import { useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Mail, Lock, User, ArrowLeft, Loader } from "lucide-react";
import { motion } from "framer-motion";
import useTranslation from "../hooks/useTranslation";
import { useUserStore } from "../stores/useUserStore";

const SignUpPage = () => {
        const [formData, setFormData] = useState({
                name: "",
                email: "",
                password: "",
                confirmPassword: "",
        });

        const { signup, loading } = useUserStore();
        const { t } = useTranslation();

        const handleSubmit = (e) => {
                e.preventDefault();
                signup(formData);
        };

        const renderField = (id, label, type, Icon, placeholder, valueKey) => (
                <div>
                        <label htmlFor={id} className='block text-sm font-medium text-white/80'>
                                {label}
                        </label>
                        <div className='relative mt-1 rounded-md shadow-sm'>
                                <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3'>
                                        <Icon className='h-5 w-5 text-white/50' aria-hidden='true' />
                                </div>
                                <input
                                        id={id}
                                        type={type}
                                        required
                                        value={formData[valueKey]}
                                        onChange={(e) => setFormData({ ...formData, [valueKey]: e.target.value })}
                                        className='block w-full rounded-md border border-payzone-indigo/40 bg-payzone-navy/60 px-3 py-2 pr-10 text-white placeholder-white/40 focus:border-payzone-gold focus:outline-none focus:ring-2 focus:ring-payzone-indigo sm:text-sm'
                                        placeholder={placeholder}
                                />
                        </div>
                </div>
        );

        return (
                <div className='flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
                        <motion.div
                                className='sm:mx-auto sm:w-full sm:max-w-md'
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                        >
                                <h2 className='mt-6 text-center text-3xl font-extrabold text-payzone-gold'>
                                        {t("auth.signup.title")}
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
                                                {renderField(
                                                        "name",
                                                        t("auth.signup.name"),
                                                        "text",
                                                        User,
                                                        t("auth.signup.placeholderName"),
                                                        "name"
                                                )}
                                                {renderField(
                                                        "email",
                                                        t("auth.signup.email"),
                                                        "email",
                                                        Mail,
                                                        t("auth.signup.placeholderEmail"),
                                                        "email"
                                                )}
                                                {renderField(
                                                        "password",
                                                        t("auth.signup.password"),
                                                        "password",
                                                        Lock,
                                                        t("auth.signup.placeholderPassword"),
                                                        "password"
                                                )}
                                                {renderField(
                                                        "confirmPassword",
                                                        t("auth.signup.confirmPassword"),
                                                        "password",
                                                        Lock,
                                                        t("auth.signup.placeholderPassword"),
                                                        "confirmPassword"
                                                )}

                                                <button
                                                        type='submit'
                                                        className='flex w-full items-center justify-center gap-2 rounded-md bg-payzone-gold px-4 py-2 text-sm font-semibold text-payzone-navy transition duration-300 hover:bg-[#b8873d] focus:outline-none focus:ring-2 focus:ring-payzone-indigo/60 disabled:opacity-50'
                                                        disabled={loading}
                                                >
                                                        {loading ? (
                                                                <>
                                                                        <Loader className='h-5 w-5 animate-spin' aria-hidden='true' />
                                                                        {t("auth.signup.loading")}
                                                                </>
                                                        ) : (
                                                                <>
                                                                        <UserPlus className='h-5 w-5' aria-hidden='true' />
                                                                        {t("auth.signup.button")}
                                                                </>
                                                        )}
                                                </button>
                                        </form>

                                        <p className='mt-8 text-center text-sm text-white/70'>
                                                {t("auth.signup.prompt")} {" "}
                                                <Link to='/login' className='font-medium text-payzone-indigo transition duration-300 hover:text-payzone-gold'>
                                                        {t("auth.signup.cta")}{" "}
                                                        <ArrowLeft className='mr-1 inline h-4 w-4' />
                                                </Link>
                                        </p>
                                </div>
                        </motion.div>
                </div>
        );
};
export default SignUpPage;

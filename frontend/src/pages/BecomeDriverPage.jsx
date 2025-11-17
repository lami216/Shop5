import { useMemo, useState } from "react";
import { Bike } from "lucide-react";

const INITIAL_DATA = {
        fullName: "",
        city: "",
        whatsapp: "",
        availability: "",
};

const BecomeDriverPage = () => {
        const [formData, setFormData] = useState(INITIAL_DATA);
        const [errors, setErrors] = useState({});

        const hasErrors = useMemo(() => Object.values(errors).some(Boolean), [errors]);

        const handleChange = (field) => (event) => {
                setFormData((prev) => ({ ...prev, [field]: event.target.value }));
        };

        const handleSubmit = (event) => {
                event.preventDefault();
                const { fullName, city, whatsapp, availability } = formData;
                const newErrors = {};

                if (!fullName.trim()) newErrors.fullName = "من فضلك أدخل الاسم الكامل";
                if (!city.trim()) newErrors.city = "من فضلك أدخل المدينة/الحي";
                if (!whatsapp.trim()) newErrors.whatsapp = "من فضلك أدخل رقم واتساب صالح";
                if (!availability.trim()) newErrors.availability = "من فضلك أدخل أوقات العمل المتاحة";

                if (Object.keys(newErrors).length > 0) {
                        setErrors(newErrors);
                        return;
                }

                setErrors({});

                const message = `السلام عليكم، اسمي: ${fullName.trim()} من مدينة/حي: ${city.trim()} رقم الواتساب: ${whatsapp.trim()} أوقات العمل المتاحة: ${availability.trim()} لدي دراجة وأرغب في العمل في توصيل الطلبات مع بوتيك MK`;
                const encodedMessage = encodeURIComponent(message);
                const whatsappUrl = `https://wa.me/22247764130?text=${encodedMessage}`;

                const newWindow = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
                if (newWindow) {
                        newWindow.opener = null;
                }
        };

        return (
                <div className='min-h-screen bg-brand-surface px-4 py-12 text-payzone-navy' dir='rtl'>
                        <div className='mx-auto flex max-w-4xl flex-col gap-8 rounded-3xl bg-white/70 p-6 shadow-lg shadow-payzone-navy/5 backdrop-blur'>
                                <header className='space-y-3 text-right'>
                                        <p className='inline-flex items-center gap-2 rounded-full bg-payzone-gold/20 px-3 py-1 text-sm font-semibold text-payzone-navy'>
                                                <Bike className='h-5 w-5 text-payzone-navy' />
                                                <span>انضم إلى فريق الموصّلين</span>
                                        </p>
                                        <h1 className='text-3xl font-bold sm:text-4xl'>نموذج الانضمام كموصّل</h1>
                                        <p className='text-base leading-relaxed text-payzone-navy/80'>
                                                سجّل بياناتك لنساعدك على البدء في توصيل طلبات بوتيك MK عبر الواتساب. جميع الحقول مطلوبة لإتمام الطلب.
                                        </p>
                                </header>

                                <form className='space-y-6' onSubmit={handleSubmit} noValidate>
                                        <div className='grid gap-6 sm:grid-cols-2'>
                                                <div className='space-y-2'>
                                                        <label className='block text-sm font-semibold text-payzone-navy' htmlFor='fullName'>
                                                                الاسم الكامل
                                                        </label>
                                                        <input
                                                                id='fullName'
                                                                name='fullName'
                                                                type='text'
                                                                value={formData.fullName}
                                                                onChange={handleChange("fullName")}
                                                                className='w-full rounded-2xl border border-brand-border/80 bg-white/80 px-4 py-3 text-payzone-navy shadow-sm shadow-payzone-navy/5 outline-none ring-payzone-gold/50 transition duration-200 ease-in-out focus:border-payzone-gold focus:ring-2'
                                                                placeholder='اكتب اسمك الثلاثي'
                                                        />
                                                        {errors.fullName && <p className='text-sm text-red-600'>{errors.fullName}</p>}
                                                </div>
                                                <div className='space-y-2'>
                                                        <label className='block text-sm font-semibold text-payzone-navy' htmlFor='city'>
                                                                المدينة/الحي
                                                        </label>
                                                        <input
                                                                id='city'
                                                                name='city'
                                                                type='text'
                                                                value={formData.city}
                                                                onChange={handleChange("city")}
                                                                className='w-full rounded-2xl border border-brand-border/80 bg-white/80 px-4 py-3 text-payzone-navy shadow-sm shadow-payzone-navy/5 outline-none ring-payzone-gold/50 transition duration-200 ease-in-out focus:border-payzone-gold focus:ring-2'
                                                                placeholder='مثال: نواكشوط - تفرغ زينه'
                                                        />
                                                        {errors.city && <p className='text-sm text-red-600'>{errors.city}</p>}
                                                </div>
                                                <div className='space-y-2'>
                                                        <label className='block text-sm font-semibold text-payzone-navy' htmlFor='whatsapp'>
                                                                رقم الواتساب
                                                        </label>
                                                        <input
                                                                id='whatsapp'
                                                                name='whatsapp'
                                                                type='text'
                                                                value={formData.whatsapp}
                                                                onChange={handleChange("whatsapp")}
                                                                className='w-full rounded-2xl border border-brand-border/80 bg-white/80 px-4 py-3 text-payzone-navy shadow-sm shadow-payzone-navy/5 outline-none ring-payzone-gold/50 transition duration-200 ease-in-out focus:border-payzone-gold focus:ring-2'
                                                                placeholder='222xxxxxxx'
                                                        />
                                                        {errors.whatsapp && <p className='text-sm text-red-600'>{errors.whatsapp}</p>}
                                                </div>
                                                <div className='space-y-2'>
                                                        <label className='block text-sm font-semibold text-payzone-navy' htmlFor='availability'>
                                                                أوقات العمل المتاحة
                                                        </label>
                                                        <textarea
                                                                id='availability'
                                                                name='availability'
                                                                rows={2}
                                                                value={formData.availability}
                                                                onChange={handleChange("availability")}
                                                                className='w-full rounded-2xl border border-brand-border/80 bg-white/80 px-4 py-3 text-payzone-navy shadow-sm shadow-payzone-navy/5 outline-none ring-payzone-gold/50 transition duration-200 ease-in-out focus:border-payzone-gold focus:ring-2'
                                                                placeholder='مثال: من 10 صباحاً إلى 6 مساءً، كل الأيام ما عدا الجمعة'
                                                        />
                                                        {errors.availability && <p className='text-sm text-red-600'>{errors.availability}</p>}
                                                </div>
                                        </div>

                                        {hasErrors && <p className='text-sm font-medium text-red-700'>يرجى تعبئة جميع البيانات المطلوبة قبل الإرسال.</p>}

                                        <div className='flex flex-col items-center gap-3 sm:flex-row-reverse sm:justify-end'>
                                                <button
                                                        type='submit'
                                                        className='courier-cta-button flex w-full flex-row-reverse items-center justify-center gap-3 px-8 py-3 text-lg font-semibold sm:w-auto'
                                                >
                                                        <span>إرسال طلب الانضمام</span>
                                                        <Bike className='h-5 w-5 text-payzone-navy' />
                                                </button>
                                                <p className='text-sm text-payzone-navy/70'>سيتم فتح واتساب في نافذة جديدة مع رسالة جاهزة.</p>
                                        </div>
                                </form>
                        </div>
                </div>
        );
};

export default BecomeDriverPage;

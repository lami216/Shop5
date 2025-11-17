export const createCheckoutSession = async (_req, res) => {
        return res.status(410).json({
                message: "تم إيقاف التكامل مع Stripe. يرجى استخدام إتمام الطلب عبر واتساب بدلاً من ذلك.",
        });
};

export const checkoutSuccess = async (_req, res) => {
        return res.status(410).json({
                message: "تم إيقاف التكامل مع Stripe. يرجى استخدام إتمام الطلب عبر واتساب بدلاً من ذلك.",
        });
};

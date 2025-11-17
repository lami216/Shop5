import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
        {
                code: {
                        type: String,
                        required: true,
                        unique: true,
                        trim: true,
                        uppercase: true,
                        match: [/^[A-Z0-9]+$/, "Coupon code must contain uppercase letters and numbers only"],
                },
                discountPercentage: {
                        type: Number,
                        required: true,
                        min: 1,
                        max: 90,
                },
                expiresAt: {
                        type: Date,
                        required: true,
                },
                isActive: {
                        type: Boolean,
                        default: true,
                },
        },
        {
                timestamps: true,
        }
);

couponSchema.index({ code: 1 }, { unique: true });

couponSchema.pre("save", function (next) {
        if (!this.isModified("expiresAt")) {
                return next();
        }

        if (this.expiresAt && this.expiresAt <= new Date()) {
                return next(new Error("Expiry must be in the future"));
        }

        next();
});

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;

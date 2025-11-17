import Coupon from "../models/coupon.model.js";

const normalizeCode = (value) => {
        if (typeof value !== "string") {
                return "";
        }

        return value.replace(/\s+/g, "").toUpperCase();
};

const isValidCode = (code) => /^[A-Z0-9]+$/.test(code);

const parseDiscount = (value) => {
        const numberValue = Number(value);
        if (!Number.isFinite(numberValue)) {
                return null;
        }
        return numberValue;
};

const parseExpiresAt = (value) => {
        const expiresDate = new Date(value);
        if (Number.isNaN(expiresDate.getTime())) {
                return null;
        }
        return expiresDate;
};

const applySorting = (query, sortBy, sortOrder) => {
        const sortFields = {
                code: "code",
                discountPercentage: "discountPercentage",
                expiresAt: "expiresAt",
                isActive: "isActive",
                createdAt: "createdAt",
        };

        const sortField = sortFields[sortBy] || "createdAt";
        const direction = sortOrder === "asc" ? 1 : -1;

        return query.sort({ [sortField]: direction, _id: direction });
};

const buildFilter = (search) => {
        if (!search) {
                return {};
        }

        return { code: { $regex: search.replace(/\s+/g, ""), $options: "i" } };
};

const collectCodes = (rawCodes) => {
        if (Array.isArray(rawCodes)) {
                return rawCodes;
        }

        if (typeof rawCodes === "string" && rawCodes.trim()) {
                return [rawCodes];
        }

        return [];
};

export const createCoupon = async (req, res) => {
        try {
                const discount = parseDiscount(req.body.discountPercentage);
                const expiresAt = parseExpiresAt(req.body.expiresAt);
                const isActive = typeof req.body.isActive === "boolean" ? req.body.isActive : true;

                const submittedCodes = collectCodes(req.body.codes);
                const normalizedCodes = (submittedCodes.length ? submittedCodes : [req.body.code])
                        .map((value) => normalizeCode(value))
                        .filter(Boolean);

                if (!normalizedCodes.length) {
                        return res.status(400).json({ message: "Coupon code is required" });
                }

                if (!Number.isFinite(discount) || discount < 1 || discount > 90) {
                        return res
                                .status(400)
                                .json({ message: "Discount percentage must be between 1 and 90" });
                }

                if (!expiresAt) {
                        return res.status(400).json({ message: "Expiry must be in the future" });
                }

                if (expiresAt <= new Date()) {
                        return res.status(400).json({ message: "Expiry must be in the future" });
                }

                const uniqueCodes = [...new Set(normalizedCodes)];

                if (uniqueCodes.some((code) => !isValidCode(code))) {
                        return res
                                .status(400)
                                .json({ message: "Coupon code must contain uppercase letters and numbers only" });
                }

                if (uniqueCodes.length !== normalizedCodes.length) {
                        return res.status(400).json({ message: "Duplicate coupon codes provided" });
                }

                const existingCoupons = await Coupon.find({ code: { $in: uniqueCodes } }, { code: 1 }).lean();

                if (existingCoupons.length > 0) {
                        const existingCodes = existingCoupons.map((coupon) => coupon.code).join(", ");
                        return res.status(409).json({
                                message:
                                        uniqueCodes.length === 1
                                                ? "Coupon code already exists"
                                                : `Coupon codes already exist: ${existingCodes}`,
                        });
                }

                if (uniqueCodes.length > 1) {
                        const couponsToCreate = uniqueCodes.map((code) => ({
                                code,
                                discountPercentage: discount,
                                expiresAt,
                                isActive,
                        }));

                        const createdCoupons = await Coupon.insertMany(couponsToCreate);
                        return res.status(201).json({ coupons: createdCoupons });
                }

                const coupon = await Coupon.create({
                        code: uniqueCodes[0],
                        discountPercentage: discount,
                        expiresAt,
                        isActive,
                });

                return res.status(201).json(coupon);
        } catch (error) {
                if (error.message === "Expiry must be in the future") {
                        return res.status(400).json({ message: "Expiry must be in the future" });
                }

                if (error.code === 11000) {
                        return res.status(409).json({ message: "Coupon code already exists" });
                }

                console.log("Error in createCoupon controller", error.message);
                return res.status(500).json({ message: "Server error" });
        }
};

export const listCoupons = async (req, res) => {
        try {
                const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
                const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
                const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
                const sortBy = typeof req.query.sortBy === "string" ? req.query.sortBy : "createdAt";
                const sortOrder = typeof req.query.sortOrder === "string" ? req.query.sortOrder : "desc";

                const filter = buildFilter(search);

                const total = await Coupon.countDocuments(filter);

                const query = Coupon.find(filter)
                        .skip((page - 1) * limit)
                        .limit(limit);

                applySorting(query, sortBy, sortOrder);

                const coupons = await query.lean();

                return res.json({
                        coupons,
                        pagination: {
                                total,
                                page,
                                limit,
                                totalPages: Math.max(1, Math.ceil(total / limit)),
                        },
                });
        } catch (error) {
                console.log("Error in listCoupons controller", error.message);
                return res.status(500).json({ message: "Server error" });
        }
};

export const getActiveCoupon = async (req, res) => {
        try {
                const coupon = await Coupon.findOne({
                        isActive: true,
                        expiresAt: { $gt: new Date() },
                })
                        .sort({ createdAt: -1, _id: -1 })
                        .lean();

                return res.json({ coupon: coupon || null });
        } catch (error) {
                console.log("Error in getActiveCoupon controller", error.message);
                return res.status(500).json({ message: "Server error" });
        }
};

export const validateCoupon = async (req, res) => {
        try {
                const code = normalizeCode(req.body.code);

                if (!code) {
                        return res.status(400).json({ message: "Coupon code is required" });
                }

                if (!isValidCode(code)) {
                        return res
                                .status(400)
                                .json({ message: "Coupon code must contain uppercase letters and numbers only" });
                }

                const coupon = await Coupon.findOne({ code }).lean();

                if (!coupon || !coupon.isActive || coupon.expiresAt <= new Date()) {
                        return res.status(404).json({ message: "Coupon is invalid or has expired" });
                }

                return res.json({ coupon });
        } catch (error) {
                console.log("Error in validateCoupon controller", error.message);
                return res.status(500).json({ message: "Server error" });
        }
};

export const updateCoupon = async (req, res) => {
        try {
                const { id } = req.params;
                const coupon = await Coupon.findById(id);

                if (!coupon) {
                        return res.status(404).json({ message: "Coupon not found" });
                }

                if (req.body.code !== undefined) {
                        const code = normalizeCode(req.body.code);
                        if (!code) {
                                return res.status(400).json({ message: "Coupon code is required" });
                        }
                        if (!isValidCode(code)) {
                                return res
                                        .status(400)
                                        .json({ message: "Coupon code must contain uppercase letters and numbers only" });
                        }

                        if (code !== coupon.code) {
                                const existingCoupon = await Coupon.findOne({ code, _id: { $ne: coupon._id } });
                                if (existingCoupon) {
                                        return res.status(409).json({ message: "Coupon code already exists" });
                                }
                                coupon.code = code;
                        }
                }

                if (req.body.discountPercentage !== undefined) {
                        const discount = parseDiscount(req.body.discountPercentage);
                        if (!Number.isFinite(discount) || discount < 1 || discount > 90) {
                                return res
                                        .status(400)
                                        .json({ message: "Discount percentage must be between 1 and 90" });
                        }
                        coupon.discountPercentage = discount;
                }

                if (req.body.expiresAt !== undefined) {
                        const expiresAt = parseExpiresAt(req.body.expiresAt);
                        if (!expiresAt || expiresAt <= new Date()) {
                                return res.status(400).json({ message: "Expiry must be in the future" });
                        }
                        coupon.expiresAt = expiresAt;
                }

                if (req.body.isActive !== undefined) {
                        coupon.isActive = Boolean(req.body.isActive);
                }

                await coupon.save();

                return res.json(coupon);
        } catch (error) {
                if (error.code === 11000) {
                        return res.status(409).json({ message: "Coupon code already exists" });
                }

                if (error.message === "Expiry must be in the future") {
                        return res.status(400).json({ message: "Expiry must be in the future" });
                }

                console.log("Error in updateCoupon controller", error.message);
                return res.status(500).json({ message: "Server error" });
        }
};

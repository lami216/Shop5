import mongoose from "mongoose";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import Coupon from "../models/coupon.model.js";

const PAID_STATUSES = ["paid", "paid_whatsapp", "delivered"];
const ORDER_STATUS_OPTIONS = [
        "pending",
        "paid",
        "paid_whatsapp",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
];

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");
const normalizePhone = (value) => (typeof value === "string" ? value.replace(/\D/g, "") : "");
const computeUnitPrice = (product) => {
        const price = Number(product.price) || 0;
        if (!product.isDiscounted) {
                return price;
        }

        const discountPercentage = Number(product.discountPercentage) || 0;
        if (discountPercentage <= 0) {
                return price;
        }

        const discountValue = price * (discountPercentage / 100);
        const discounted = price - discountValue;
        return Number(discounted.toFixed(2));
};

const normalizeCoupon = (coupon) => {
        if (!coupon || !coupon.code) {
                return null;
        }

        return {
                code: coupon.code,
                discountPercentage: Number(coupon.discountPercentage) || 0,
                discountAmount: Number(coupon.discountAmount) || 0,
        };
};

const mapOrderResponse = (order) => {
        const couponFromLegacyArray = Array.isArray(order.coupons) ? order.coupons[0] : null;
        const coupon = normalizeCoupon(order.coupon || couponFromLegacyArray);

        return {
                ...order,
                subtotal: Number(order.subtotal || 0),
                total: Number(order.total || 0),
                totalDiscountAmount: Number(order.totalDiscountAmount || 0),
                coupon,
                coupons: coupon ? [coupon] : [],
        };
};

const appendLogEntry = (order, entry) => {
        order.log.push({
                timestamp: new Date(),
                ...entry,
        });
};

export const createWhatsAppOrder = async (req, res) => {
        try {
                const items = Array.isArray(req.body?.items) ? req.body.items : [];
                const customerName = normalizeString(req.body?.customerName);
                const phone = normalizePhone(req.body?.phone);
                const address = normalizeString(req.body?.address);
                const couponCodeInputs = [];

                if (Array.isArray(req.body?.couponCodes)) {
                        couponCodeInputs.push(
                                ...req.body.couponCodes.filter((value) => typeof value === "string")
                        );
                }

                if (couponCodeInputs.length === 0) {
                        const fallbackCode = normalizeString(
                                req.body?.couponCode || req.body?.coupon?.code
                        );

                        if (fallbackCode) {
                                couponCodeInputs.push(fallbackCode);
                        }
                }

                const normalizedCouponCodes = couponCodeInputs
                        .map((value) => normalizeString(value))
                        .filter(Boolean)
                        .map((value) => value.replace(/\s+/g, "").toUpperCase());
                const primaryCouponCode = normalizedCouponCodes[0] || "";

                if (!items.length) {
                        return res.status(400).json({ message: "Order must contain at least one item" });
                }

                if (!customerName) {
                        return res.status(400).json({ message: "Customer name is required" });
                }

                if (!phone) {
                        return res.status(400).json({ message: "Phone number is required" });
                }

                if (!address) {
                        return res.status(400).json({ message: "Address is required" });
                }

                const normalizedItems = items
                        .map((item) => {
                                const candidate = [item.productId, item._id].find((value) =>
                                        mongoose.Types.ObjectId.isValid(value)
                                );

                                if (!candidate) {
                                        return null;
                                }

                                const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);

                                return {
                                        productId: candidate.toString(),
                                        quantity,
                                };
                        })
                        .filter(Boolean);

                const productIds = [...new Set(normalizedItems.map((item) => item.productId))];

                if (!productIds.length) {
                        return res.status(400).json({ message: "Invalid product list" });
                }

                const products = await Product.find({ _id: { $in: productIds } }).lean();

                if (products.length !== productIds.length) {
                        return res.status(400).json({ message: "One or more products are invalid" });
                }

                const itemsWithDetails = [];
                let subtotal = 0;

                for (const item of normalizedItems) {
                        const product = products.find(
                                (productDoc) => productDoc._id.toString() === item.productId
                        );

                        if (!product) {
                                return res.status(400).json({ message: "Unable to match product for order item" });
                        }

                        const { quantity } = item;
                        const unitPrice = computeUnitPrice(product);
                        const lineSubtotal = Number((unitPrice * quantity).toFixed(2));

                        subtotal += lineSubtotal;

                        itemsWithDetails.push({
                                productId: product._id,
                                name: product.name,
                                price: unitPrice,
                                quantity,
                                subtotal: lineSubtotal,
                        });
                }

                if (!itemsWithDetails.length) {
                        return res.status(400).json({ message: "Order items are invalid" });
                }

                subtotal = Number(subtotal.toFixed(2));

                let total = subtotal;
                let totalDiscountAmount = 0;
                let appliedCoupon = null;

                if (primaryCouponCode) {
                        const coupon = await Coupon.findOne({
                                code: primaryCouponCode,
                                isActive: true,
                                expiresAt: { $gt: new Date() },
                        }).lean();

                        if (!coupon) {
                                return res
                                        .status(400)
                                        .json({ message: "One or more coupons are invalid or expired" });
                        }

                        const discountPercentage = Number(coupon.discountPercentage) || 0;

                        if (discountPercentage > 0 && subtotal > 0) {
                                totalDiscountAmount = Number(
                                        ((subtotal * Math.min(discountPercentage, 100)) / 100).toFixed(2)
                                );
                                total = Number(Math.max(0, subtotal - totalDiscountAmount).toFixed(2));
                        }

                        appliedCoupon = {
                                code: coupon.code,
                                discountPercentage,
                                discountAmount: totalDiscountAmount,
                        };
                }

                const order = await Order.create({
                        items: itemsWithDetails,
                        subtotal,
                        total,
                        coupon: appliedCoupon,
                        totalDiscountAmount,
                        customerName,
                        phone,
                        address,
                        paymentMethod: "whatsapp",
                        status: "paid_whatsapp",
                        paidAt: new Date(),
                        optimisticPaid: true,
                        reconciliationNeeded: true,
                        createdFrom: "checkout_whatsapp",
                        log: [
                                {
                                        action: "created",
                                        statusAfter: "paid_whatsapp",
                                        reason: "Order captured via WhatsApp checkout",
                                        changedByName: "checkout_whatsapp",
                                        timestamp: new Date(),
                                },
                        ],
                });

                const orderForResponse = mapOrderResponse(order.toObject());

                return res.status(201).json({
                        orderId: order._id,
                        orderNumber: order.orderNumber,
                        subtotal: orderForResponse.subtotal,
                        total: orderForResponse.total,
                        coupon: orderForResponse.coupon,
                        totalDiscountAmount: orderForResponse.totalDiscountAmount,
                });
        } catch (error) {
                console.log("Error in createWhatsAppOrder", error);
                return res.status(500).json({ message: "Failed to create order" });
        }
};

export const listOrders = async (req, res) => {
        try {
                        const { status, search } = req.query;

                const filters = {};

                if (status && ORDER_STATUS_OPTIONS.includes(status)) {
                        filters.status = status;
                }

                if (search) {
                        const normalizedSearch = search.trim();
                        if (normalizedSearch) {
                                const orFilters = [
                                        { customerName: { $regex: normalizedSearch, $options: "i" } },
                                        { phone: { $regex: normalizedSearch.replace(/\s+/g, ""), $options: "i" } },
                                ];

                                const parsedNumber = Number(normalizedSearch);
                                if (Number.isFinite(parsedNumber)) {
                                        orFilters.push({ orderNumber: parsedNumber });
                                }

                                filters.$or = orFilters;
                        }
                }

                const orders = await Order.find(filters)
                        .sort({ createdAt: -1 })
                        .lean();

                return res.json({
                        orders: orders.map(mapOrderResponse),
                });
        } catch (error) {
                console.log("Error in listOrders", error);
                return res.status(500).json({ message: "Failed to load orders" });
        }
};

export const updateOrderStatus = async (req, res) => {
        try {
                const { id } = req.params;
                const { status, reason } = req.body || {};

                if (!ORDER_STATUS_OPTIONS.includes(status)) {
                        return res.status(400).json({ message: "Invalid status" });
                }

                if (status === "cancelled") {
                        return res.status(400).json({ message: "Use the cancel endpoint to cancel orders" });
                }

                const order = await Order.findById(id);
                if (!order) {
                        return res.status(404).json({ message: "Order not found" });
                }

                const previousStatus = order.status;
                if (previousStatus === status) {
                        return res.json({ order: mapOrderResponse(order.toObject()) });
                }

                order.status = status;

                if (PAID_STATUSES.includes(status) && !order.paidAt) {
                        order.paidAt = new Date();
                }

                if (status === "delivered") {
                        order.reconciliationNeeded = false;
                }

                appendLogEntry(order, {
                        action: "status_change",
                        statusBefore: previousStatus,
                        statusAfter: status,
                        reason: normalizeString(reason) || undefined,
                        changedBy: req.user?._id,
                        changedByName: req.user?.name,
                });

                await order.save();

                const updatedOrder = await Order.findById(order._id).lean();

                return res.json({ order: mapOrderResponse(updatedOrder) });
        } catch (error) {
                console.log("Error in updateOrderStatus", error);
                return res.status(500).json({ message: "Failed to update order status" });
        }
};

export const cancelOrder = async (req, res) => {
        try {
                const { id } = req.params;
                const { reason } = req.body || {};

                const order = await Order.findById(id);
                if (!order) {
                        return res.status(404).json({ message: "Order not found" });
                }

                if (order.status === "cancelled") {
                        return res.json({ order: mapOrderResponse(order.toObject()) });
                }

                const previousStatus = order.status;

                order.status = "cancelled";
                order.optimisticPaid = false;
                order.canceledAt = new Date();
                order.canceledBy = req.user?._id;
                order.canceledByName = req.user?.name;
                order.reconciliationNeeded = true;

                appendLogEntry(order, {
                        action: "cancelled",
                        statusBefore: previousStatus,
                        statusAfter: "cancelled",
                        reason: normalizeString(reason) || undefined,
                        changedBy: req.user?._id,
                        changedByName: req.user?.name,
                });

                await order.save();

                const updatedOrder = await Order.findById(order._id).lean();

                return res.json({ order: mapOrderResponse(updatedOrder) });
        } catch (error) {
                console.log("Error in cancelOrder", error);
                return res.status(500).json({ message: "Failed to cancel order" });
        }
};

import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import {
        createCoupon,
        getActiveCoupon,
        listCoupons,
        updateCoupon,
        validateCoupon,
} from "../controllers/coupon.controller.js";

const router = express.Router();

router.get("/active", protectRoute, adminRoute, getActiveCoupon);
router.post("/validate", protectRoute, validateCoupon);

router.post("/", protectRoute, adminRoute, createCoupon);
router.get("/", protectRoute, adminRoute, listCoupons);
router.patch("/:id", protectRoute, adminRoute, updateCoupon);

export default router;

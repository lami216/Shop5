import express from "express";
import {
        cancelOrder,
        createWhatsAppOrder,
        listOrders,
        updateOrderStatus,
} from "../controllers/order.controller.js";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/whatsapp-checkout", createWhatsAppOrder);

router.get("/", protectRoute, adminRoute, listOrders);
router.patch("/:id/status", protectRoute, adminRoute, updateOrderStatus);
router.patch("/:id/cancel", protectRoute, adminRoute, cancelOrder);

export default router;

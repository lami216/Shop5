import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";

import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import categoryRoutes from "./routes/category.route.js";
import publicConfigRoutes from "./routes/publicConfig.route.js";
import orderRoutes from "./routes/order.route.js";

import { connectDB } from "./lib/db.js";

dotenv.config({ path: "./backend/.env" });

const app = express();
const PORT = process.env.PORT || 5000;

// في ESM هذا يُعيد المسار الحالي للعملية (غالبًا /var/www/shop1/backend)
const __dirname = path.resolve();

app.use(express.json({ limit: "10mb" })); // parse JSON body
app.use(express.urlencoded({ limit: "10mb", extended: true })); // parse URL-encoded (نماذج)
app.use(cookieParser());

/* ----------------- API Routes ----------------- */
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/public-config", publicConfigRoutes);
app.use("/api/orders", orderRoutes);

/* ----------------- Production static -----------------
   كان يتم بناء المسار كـ "/var/www/shop1/backend/frontend/dist"
   والصحيح من داخل backend: "../frontend/dist"
------------------------------------------------------- */
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "../frontend/dist");

  app.use(express.static(distPath));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log("Server is running on http://localhost:" + PORT);
  connectDB();
});

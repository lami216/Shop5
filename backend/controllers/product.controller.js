import mongoose from "mongoose";
import { deleteImage, uploadImage } from "../lib/imagekit.js";
import { redis } from "../lib/redis.js";
import Product from "../models/product.model.js";

const toBoolean = (value) => {
        if (typeof value === "boolean") return value;
        if (typeof value === "number") return value !== 0;
        if (typeof value === "string") {
                const normalized = value.trim().toLowerCase();
                return ["true", "1", "yes", "on"].includes(normalized);
        }
        return false;
};

const normalizeDiscountSettings = ({
        rawIsDiscounted,
        rawDiscountPercentage,
        fallbackPercentage = 0,
        fallbackIsDiscounted = false,
}) => {
        const hasFlag = rawIsDiscounted !== undefined && rawIsDiscounted !== null;
        const hasPercentage =
                rawDiscountPercentage !== undefined &&
                rawDiscountPercentage !== null &&
                rawDiscountPercentage !== "";

        const isDiscounted = hasFlag ? toBoolean(rawIsDiscounted) : fallbackIsDiscounted;
        const percentageValue = hasPercentage
                ? Number(rawDiscountPercentage)
                : Number(fallbackPercentage);

        if (isDiscounted) {
                if (Number.isNaN(percentageValue)) {
                        return { error: "Discount percentage must be a valid number" };
                }

                if (percentageValue <= 0 || percentageValue >= 100) {
                        return { error: "Discount percentage must be between 1 and 99" };
                }

                return {
                        isDiscounted: true,
                        discountPercentage: Number(percentageValue.toFixed(2)),
                };
        }

        return { isDiscounted: false, discountPercentage: 0 };
};

const normalizeStoredImage = (image) => {
        if (typeof image === "string") {
                const trimmed = image.trim();
                return trimmed ? { url: trimmed, fileId: null, public_id: null } : null;
        }

        if (image && typeof image === "object") {
                const url = image.url || image.secure_url || "";
                const fileId = image.fileId || null;
                const publicId = image.public_id || null;

                if (!url) {
                        return null;
                }

                return { url, fileId, public_id: publicId };
        }

        return null;
};

const getImageIdentifier = (image) => {
        if (typeof image === "string") {
                return image;
        }

        if (image && typeof image === "object") {
                return image.fileId || image.public_id || image.url || null;
        }

        return null;
};

const normalizeImagesForResponse = (images) => {
        const normalized = Array.isArray(images)
                ? images.map(normalizeStoredImage).filter(Boolean)
                : [];

        return normalized.map((image) => {
                const payload = { url: image.url };

                if (image.fileId) {
                        payload.fileId = image.fileId;
                        payload.public_id = image.fileId;
                } else if (image.public_id) {
                        payload.public_id = image.public_id;
                }

                return payload;
        });
};

const finalizeProductPayload = (product) => {
        if (!product) return product;

        const normalizedImages = normalizeImagesForResponse(product.images);
        const coverImage = product.image || normalizedImages[0]?.url || "";

        const price = Number(product.price) || 0;
        const percentage = Number(product.discountPercentage) || 0;
        const isDiscounted = Boolean(product.isDiscounted) && percentage > 0;
        const effectivePercentage = isDiscounted ? Number(percentage.toFixed(2)) : 0;
        const discountedPrice = isDiscounted
                ? Number((price - price * (effectivePercentage / 100)).toFixed(2))
                : price;

        return {
                ...product,
                image: coverImage,
                images: normalizedImages,
                isDiscounted,
                discountPercentage: effectivePercentage,
                discountedPrice,
        };
};

const serializeProduct = (product) => {
        if (!product) return product;
        const serialized =
                typeof product.toObject === "function"
                        ? product.toObject({ virtuals: true })
                        : product;

        return finalizeProductPayload(serialized);
};

const regexSpecialChars = /[.*+?^${}()|[\\]\\]/g;

const escapeRegexValue = (value) => {
        return value.replace(regexSpecialChars, "\\$&");
};

export const getAllProducts = async (req, res) => {
        try {
                const products = await Product.find({}).lean({ virtuals: true });
                res.json({ products: products.map(finalizeProductPayload) });
        } catch (error) {
                console.log("Error in getAllProducts controller", error.message);
                res.status(500).json({ message: "Server error", error: error.message });
        }
};

export const getFeaturedProducts = async (req, res) => {
        try {
                let featuredProducts = await redis.get("featured_products");
                if (featuredProducts) {
                        const parsed = JSON.parse(featuredProducts);
                        return res.json(parsed.map(finalizeProductPayload));
                }

                featuredProducts = await Product.find({ isFeatured: true }).lean({ virtuals: true });

                if (!featuredProducts || !featuredProducts.length) {
                        return res.status(404).json({ message: "No featured products found" });
                }

                const finalized = featuredProducts.map(finalizeProductPayload);

                await redis.set("featured_products", JSON.stringify(finalized));

                res.json(finalized);
        } catch (error) {
                console.log("Error in getFeaturedProducts controller", error.message);
                res.status(500).json({ message: "Server error", error: error.message });
        }
};

export const searchProducts = async (req, res) => {
        try {
                const limit = 24;
                const q = String(req.query.q || "").trim();
                const rawCategory = typeof req.query.category === "string" ? req.query.category.trim() : "";

                const filters = [];

                if (q) {
                        const escaped = escapeRegexValue(q);
                        const rx = new RegExp(escaped.replace(/\s+/g, "\\s"), "i");
                        filters.push({ name: { $regex: rx } });
                }

                if (rawCategory) {
                        const categoryConditions = [{ categorySlug: rawCategory }, { category: rawCategory }];

                        if (mongoose.Types.ObjectId.isValid(rawCategory)) {
                                categoryConditions.push({ categoryId: new mongoose.Types.ObjectId(rawCategory) });
                        }

                        filters.push({ $or: categoryConditions });
                }

                let query = {};
                if (filters.length === 1) {
                        query = filters[0];
                } else if (filters.length > 1) {
                        query = { $and: filters };
                }

                const projection = {
                        name: 1,
                        price: 1,
                        image: 1,
                        slug: 1,
                        images: 1,
                        discountedPrice: 1,
                        isDiscounted: 1,
                        discountPercentage: 1,
                        category: 1,
                };

                const sort = { popularity: -1, createdAt: -1 };

                const [items, count] = await Promise.all([
                        Product.find(query)
                                .sort(sort)
                                .limit(limit)
                                .select(projection)
                                .collation({ locale: "ar", strength: 1 })
                                .lean({ virtuals: true }),
                        Product.countDocuments(query).collation({ locale: "ar", strength: 1 }),
                ]);

                const normalizedItems = items.map(finalizeProductPayload);

                res.json({ items: normalizedItems, count });
        } catch (error) {
                console.log("Error in searchProducts controller", error.message);
                res.status(500).json({ message: "Server error", error: error.message });
        }
};

export const createProduct = async (req, res) => {
        try {
                const { name, description, price, category, images, isDiscounted, discountPercentage } = req.body;

                const trimmedName = typeof name === "string" ? name.trim() : "";
                const trimmedDescription =
                        typeof description === "string" ? description.trim() : "";

                if (!trimmedName) {
                        return res.status(400).json({ message: "Product name is required" });
                }

                if (!trimmedDescription) {
                        return res.status(400).json({ message: "Product description is required" });
                }

                if (!Array.isArray(images) || images.length === 0) {
                        return res.status(400).json({ message: "At least one product image is required" });
                }

                if (images.length > 3) {
                        return res.status(400).json({ message: "You can upload up to 3 images per product" });
                }

                if (typeof category !== "string" || !category.trim()) {
                        return res.status(400).json({ message: "Category is required" });
                }

                const sanitizedImages = images
                        .filter((image) => typeof image === "string" && image.trim().length > 0)
                        .slice(0, 3);

                if (!sanitizedImages.length) {
                        return res.status(400).json({ message: "Provided images are not valid" });
                }

                const numericPrice = Number(price);

                if (Number.isNaN(numericPrice)) {
                        return res.status(400).json({ message: "Price must be a valid number" });
                }

                const discountSettings = normalizeDiscountSettings({
                        rawIsDiscounted: isDiscounted,
                        rawDiscountPercentage: discountPercentage,
                });

                if (discountSettings.error) {
                        return res.status(400).json({ message: discountSettings.error });
                }

                const uploadedImages = [];

                try {
                        for (const base64Image of sanitizedImages) {
                                const { url, fileId } = await uploadImage(base64Image, "products");

                                uploadedImages.push({
                                        url,
                                        fileId,
                                        public_id: fileId,
                                });
                        }
                } catch (uploadError) {
                        if (uploadedImages.length) {
                                for (const image of uploadedImages) {
                                        try {
                                                await deleteImage(image.fileId);
                                        } catch (cleanupError) {
                                                console.log(
                                                        "Error cleaning up uploaded images after failure",
                                                        cleanupError
                                                );
                                        }
                                }
                        }

                        throw uploadError;
                }

                const normalizedCategory = category.trim();
                const productPayload = {
                        name: trimmedName,
                        description: trimmedDescription,
                        price: numericPrice,
                        image: uploadedImages[0]?.url || "",
                        images: uploadedImages,
                        category: normalizedCategory,
                        categorySlug: normalizedCategory,
                        isDiscounted: discountSettings.isDiscounted,
                        discountPercentage: discountSettings.discountPercentage,
                };

                if (mongoose.Types.ObjectId.isValid(normalizedCategory)) {
                        productPayload.categoryId = new mongoose.Types.ObjectId(normalizedCategory);
                }

                const product = await Product.create(productPayload);

                res.status(201).json(serializeProduct(product));
        } catch (error) {
                console.log("Error in createProduct controller", error.message);
                res.status(500).json({ message: "Server error", error: error.message });
        }
};

export const updateProduct = async (req, res) => {
        try {
                const { id } = req.params;
                const {
                        name,
                        description,
                        price,
                        category,
                        existingImages,
                        newImages,
                        cover,
                        isDiscounted,
                        discountPercentage,
                } = req.body;

                const product = await Product.findById(id);

                if (!product) {
                        return res.status(404).json({ message: "Product not found" });
                }

                const trimmedName = typeof name === "string" ? name.trim() : product.name;
                const trimmedDescription =
                        typeof description === "string" ? description.trim() : product.description;

                if (!trimmedName) {
                        return res.status(400).json({ message: "Product name is required" });
                }

                if (!trimmedDescription) {
                        return res.status(400).json({ message: "Product description is required" });
                }

                const existingImageIds = Array.isArray(existingImages)
                        ? existingImages.map((image) => getImageIdentifier(image)).filter(Boolean)
                        : [];

                const sanitizedNewImages = Array.isArray(newImages)
                        ? newImages.filter((image) => typeof image === "string" && image.trim().length > 0)
                        : [];

                const currentImages = Array.isArray(product.images)
                        ? product.images.map(normalizeStoredImage).filter(Boolean)
                        : [];
                const retainedImages = currentImages.filter((image) => {
                        const identifier = getImageIdentifier(image) || image.url;
                        return existingImageIds.includes(identifier);
                });
                const removedImages = currentImages.filter((image) => {
                        const identifier = getImageIdentifier(image) || image.url;
                        return !existingImageIds.includes(identifier);
                });

                const totalImagesCount = retainedImages.length + sanitizedNewImages.length;

                if (totalImagesCount === 0) {
                        return res.status(400).json({ message: "At least one product image is required" });
                }

                if (totalImagesCount > 3) {
                        return res.status(400).json({ message: "You can upload up to 3 images per product" });
                }

                if (removedImages.length) {
                        for (const image of removedImages) {
                                if (!image.fileId) continue;

                                try {
                                        await deleteImage(image.fileId);
                                } catch (cleanupError) {
                                        console.log("Error deleting removed images", cleanupError);
                                }
                        }
                }

                const uploadedImages = [];

                for (const base64Image of sanitizedNewImages) {
                        try {
                                const { url, fileId } = await uploadImage(base64Image, "products");

                                uploadedImages.push({
                                        url,
                                        fileId,
                                        public_id: fileId,
                                });
                        } catch (uploadError) {
                                if (uploadedImages.length) {
                                        for (const image of uploadedImages) {
                                                try {
                                                        await deleteImage(image.fileId);
                                                } catch (cleanupError) {
                                                        console.log(
                                                                "Error cleaning up uploaded images after update failure",
                                                                cleanupError
                                                        );
                                                }
                                        }
                                }

                                throw uploadError;
                        }
                }

                const imageLookup = retainedImages.reduce((accumulator, image) => {
                        const identifier = getImageIdentifier(image) || image.url;

                        if (identifier) {
                                accumulator[identifier] = image;
                        }
                        return accumulator;
                }, {});

                const orderedRetainedImages = existingImageIds
                        .map((publicId) => imageLookup[publicId])
                        .filter(Boolean);

                const coverPreference =
                        cover && typeof cover === "object" ? cover : { source: null, index: 0 };
                const coverSource =
                        typeof coverPreference.source === "string"
                                ? coverPreference.source.toLowerCase()
                                : null;

                let finalImages = [];

                if (coverSource === "new" && uploadedImages.length) {
                        const [coverImage, ...restUploaded] = uploadedImages;
                        finalImages = [coverImage, ...orderedRetainedImages, ...restUploaded];
                } else if (orderedRetainedImages.length) {
                        const [coverImage, ...restRetained] = orderedRetainedImages;
                        finalImages = [coverImage, ...restRetained, ...uploadedImages];
                } else {
                        finalImages = [...uploadedImages];
                }

                const numericPrice =
                        price === undefined || price === null ? product.price : Number(price);

                if (Number.isNaN(numericPrice)) {
                        return res.status(400).json({ message: "Price must be a valid number" });
                }

                const nextCategory =
                        typeof category === "string" && category.trim().length
                                ? category.trim()
                                : product.category;

                const discountSettings = normalizeDiscountSettings({
                        rawIsDiscounted: isDiscounted,
                        rawDiscountPercentage: discountPercentage,
                        fallbackIsDiscounted: product.isDiscounted,
                        fallbackPercentage: product.discountPercentage,
                });

                if (discountSettings.error) {
                        return res.status(400).json({ message: discountSettings.error });
                }

                product.name = trimmedName;
                product.description = trimmedDescription;
                product.price = numericPrice;
                product.category = nextCategory;
                product.categorySlug = nextCategory;
                product.categoryId = mongoose.Types.ObjectId.isValid(nextCategory)
                        ? new mongoose.Types.ObjectId(nextCategory)
                        : null;
                product.images = finalImages;
                product.image = finalImages[0]?.url || product.image;
                product.isDiscounted = discountSettings.isDiscounted;
                product.discountPercentage = discountSettings.discountPercentage;

                const updatedProduct = await product.save();

                if (updatedProduct.isFeatured) {
                        await updateFeaturedProductsCache();
                }

                res.json(serializeProduct(updatedProduct));
        } catch (error) {
                console.log("Error in updateProduct controller", error.message);
                res.status(500).json({ message: "Server error", error: error.message });
        }
};

export const deleteProduct = async (req, res) => {
        try {
                const product = await Product.findById(req.params.id);

                if (!product) {
                        return res.status(404).json({ message: "Product not found" });
                }

                const imagesToDelete = Array.isArray(product.images)
                        ? product.images.map(normalizeStoredImage).filter(Boolean)
                        : [];

                if (imagesToDelete.length) {
                        for (const image of imagesToDelete) {
                                if (!image.fileId) continue;

                                try {
                                        await deleteImage(image.fileId);
                                } catch (cleanupError) {
                                        console.log("Error deleting images from ImageKit", cleanupError);
                                }
                        }
                }

                await Product.findByIdAndDelete(req.params.id);

                if (product.isFeatured) {
                        await updateFeaturedProductsCache();
                }

                res.json({ message: "Product and images deleted successfully" });
        } catch (error) {
                console.log("Error in deleteProduct controller", error.message);
                res.status(500).json({ message: "Server error", error: error.message });
        }
};

export const getProductById = async (req, res) => {
        try {
                const product = await Product.findById(req.params.id);

                if (!product) {
                        return res.status(404).json({ message: "Product not found" });
                }

                res.json(serializeProduct(product));
        } catch (error) {
                console.log("Error in getProductById controller", error.message);
                res.status(500).json({ message: "Server error", error: error.message });
        }
};

export const getRecommendedProducts = async (req, res) => {
        try {
                const { productId, category } = req.query;
                const sampleSize = 4;
                const projectionStage = {
                        $project: {
                                _id: 1,
                                name: 1,
                                description: 1,
                                image: 1,
                                images: 1,
                                price: 1,
                                category: 1,
                                isFeatured: 1,
                                isDiscounted: 1,
                                discountPercentage: 1,
                        },
                };

                let targetCategory = typeof category === "string" && category.trim() ? category.trim() : null;
                const excludedIds = [];

                if (productId && mongoose.Types.ObjectId.isValid(productId)) {
                        excludedIds.push(new mongoose.Types.ObjectId(productId));

                        if (!targetCategory) {
                                const product = await Product.findById(productId).select("category");
                                if (product) {
                                        targetCategory = product.category;
                                }
                        }
                }

                let recommendations = [];

                if (targetCategory) {
                        const matchStage = {
                                category: targetCategory,
                                ...(excludedIds.length
                                        ? { _id: { $nin: excludedIds } }
                                        : {}),
                        };

                        recommendations = await Product.aggregate([
                                { $match: matchStage },
                                { $sample: { size: sampleSize } },
                                projectionStage,
                        ]);
                }

                if (!recommendations.length) {
                        const fallbackMatch = excludedIds.length ? { _id: { $nin: excludedIds } } : null;
                        const pipeline = [
                                ...(fallbackMatch ? [{ $match: fallbackMatch }] : []),
                                { $sample: { size: sampleSize } },
                                projectionStage,
                        ];

                        recommendations = await Product.aggregate(pipeline);
                }

                res.json(recommendations.map(finalizeProductPayload));
        } catch (error) {
                console.log("Error in getRecommendedProducts controller", error.message);
                res.status(500).json({ message: "Server error", error: error.message });
        }
};

export const getProductsByCategory = async (req, res) => {
        const { category } = req.params;
        try {
                const products = await Product.find({ category }).lean({ virtuals: true });
                res.json({ products: products.map(finalizeProductPayload) });
        } catch (error) {
                console.log("Error in getProductsByCategory controller", error.message);
                res.status(500).json({ message: "Server error", error: error.message });
        }
};

export const toggleFeaturedProduct = async (req, res) => {
        try {
                const product = await Product.findById(req.params.id);
                if (product) {
                        product.isFeatured = !product.isFeatured;
                        const updatedProduct = await product.save();
                        await updateFeaturedProductsCache();
                        res.json(serializeProduct(updatedProduct));
                } else {
                        res.status(404).json({ message: "Product not found" });
                }
        } catch (error) {
                console.log("Error in toggleFeaturedProduct controller", error.message);
                res.status(500).json({ message: "Server error", error: error.message });
        }
};

async function updateFeaturedProductsCache() {
        try {
                const featuredProducts = await Product.find({ isFeatured: true }).lean({ virtuals: true });
                await redis.set(
                        "featured_products",
                        JSON.stringify(featuredProducts.map(finalizeProductPayload))
                );
        } catch (error) {
                console.log("error in update cache function", error.message);
        }
}

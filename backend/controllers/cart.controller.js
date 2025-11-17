import Product from "../models/product.model.js";

export const getCartProducts = async (req, res) => {
        try {
                const productIds = req.user.cartItems
                        .map((item) => (item?.product ? item.product : item))
                        .filter(Boolean);
                const products = await Product.find({ _id: { $in: productIds } });

                const cartItems = products.map((product) => {
                        const matchedItem = req.user.cartItems.find((cartItem) => {
                                if (cartItem?.product) {
                                        return cartItem.product.toString() === product.id;
                                }

                                return cartItem?.toString() === product.id;
                        });

                        return {
                                ...product.toJSON(),
                                quantity: matchedItem?.quantity ?? 1,
                        };
                });

                res.json(cartItems);
        } catch (error) {
                console.log("Error in getCartProducts controller", error.message);
                res.status(500).json({ message: "Server error", error: error.message });
        }
};

export const addToCart = async (req, res) => {
        try {
                const { productId, quantity } = req.body;
                const user = req.user;

                const numericQuantity = Math.max(1, parseInt(quantity, 10) || 1);

                const existingItemIndex = user.cartItems.findIndex((item) => {
                        if (item?.product) {
                                return item.product.toString() === productId;
                        }

                        return item?.toString() === productId;
                });

                if (existingItemIndex !== -1) {
                        const existingItem = user.cartItems[existingItemIndex];

                        if (existingItem?.product) {
                                existingItem.quantity += numericQuantity;
                        } else {
                                user.cartItems[existingItemIndex] = {
                                        product: productId,
                                        quantity: (existingItem?.quantity ?? 1) + numericQuantity,
                                };
                        }
                } else {
                        user.cartItems.push({ product: productId, quantity: numericQuantity });
                }

                await user.save();
                res.json(user.cartItems);
	} catch (error) {
		console.log("Error in addToCart controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const removeAllFromCart = async (req, res) => {
        try {
                const { productId } = req.body;
                const user = req.user;
                if (!productId) {
                        user.cartItems = [];
                } else {
                        user.cartItems = user.cartItems.filter((item) => {
                                if (item?.product) {
                                        return item.product.toString() !== productId;
                                }

                                return item?.toString() !== productId;
                        });
                }
                await user.save();
                res.json(user.cartItems);
        } catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateQuantity = async (req, res) => {
        try {
                const { id: productId } = req.params;
                const { quantity } = req.body;
                const user = req.user;
                const normalizedQuantity = Math.max(0, parseInt(quantity, 10) || 0);
                const existingItemIndex = user.cartItems.findIndex((item) => {
                        if (item?.product) {
                                return item.product.toString() === productId;
                        }

                        return item?.toString() === productId;
                });

                if (existingItemIndex !== -1) {
                        const existingItem = user.cartItems[existingItemIndex];

                        if (normalizedQuantity === 0) {
                                user.cartItems = user.cartItems.filter((item, index) => index !== existingItemIndex);
                                await user.save();
                                return res.json(user.cartItems);
                        }

                        if (existingItem?.product) {
                                existingItem.quantity = normalizedQuantity;
                        } else {
                                user.cartItems[existingItemIndex] = {
                                        product: productId,
                                        quantity: normalizedQuantity,
                                };
                        }
                        await user.save();
                        res.json(user.cartItems);
                } else {
                        res.status(404).json({ message: "Product not found" });
		}
	} catch (error) {
		console.log("Error in updateQuantity controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

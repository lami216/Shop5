import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
        {
                name: {
                        type: String,
                        required: true,
                },
                description: {
                        type: String,
                        default: "",
                },
                slug: {
                        type: String,
                        required: true,
                        unique: true,
                },
                imageUrl: {
                        type: String,
                        required: true,
                },
                imagePublicId: {
                        type: String,
                        default: null,
                },
        },
        { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);

export default Category;

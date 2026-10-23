import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: Array, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'category', required: true },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'subcategory' },
    bestseller: { type: Boolean },
    // simple size list (e.g. S, M, L); older products may use `variants` instead
    sizes: { type: [String], default: [] },
    // optional side-profile photos; the storefront generates a side when these are empty
    sideImages: {
        left: { type: String, default: '' },
        right: { type: String, default: '' }
    },
    variants: [{
        attributes: [{
            attributeId: { type: mongoose.Schema.Types.ObjectId, ref: 'attribute' },
            attributeName: { type: String },
            variantValue: { type: String }
        }],
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, default: 0 },
        sku: { type: String }
    }],
    date: { type: Number, required: true },
    seo: {
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        metaKeywords: { type: String, default: '' },
        slug: { type: String, default: '' },
        canonicalUrl: { type: String, default: '' },
        ogImage: { type: String, default: '' }
    }
})

const productModel  = mongoose.models.product || mongoose.model("product",productSchema);

export default productModel
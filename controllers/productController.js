import { v2 as cloudinary } from "cloudinary"
import productModel from "../models/productModel.js"

// form fields may arrive as JSON strings (multipart) or as real values (JSON body)
const parseField = (value, fallback) => {
    if (value === undefined || value === null || value === '') return fallback
    if (typeof value !== 'string') return value
    try { return JSON.parse(value) } catch { return fallback }
}

const cleanSides = sides => ({
    left: typeof sides?.left === 'string' ? sides.left : '',
    right: typeof sides?.right === 'string' ? sides.right : ''
})

const slugify = text => String(text || '').toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80)

// function for add product
const addProduct = async (req, res) => {
    try {
        const { name, description, price, category, subCategory, sizes, bestseller, variants, seo, imageUrls, sideImages } = req.body

        // Validate price
        if (!price || isNaN(Number(price)) || Number(price) < 0) {
            return res.json({ success: false, message: "Invalid price value" })
        }

        const images = parseField(imageUrls, [])
        if (!images.length) {
            return res.json({ success: false, message: "Front image is required" })
        }

        const seoData = parseField(seo, {})
        if (!seoData.slug) seoData.slug = `${slugify(name)}-${Date.now().toString(36)}`

        const productData = {
            name,
            description: description || '',
            category,
            price: Number(price),
            subCategory: subCategory || undefined,
            bestseller: bestseller === true || bestseller === "true",
            sizes: parseField(sizes, []),
            variants: parseField(variants, []),
            image: images,
            sideImages: cleanSides(parseField(sideImages, {})),
            date: Date.now(),
            seo: seoData
        }

        const product = new productModel(productData);
        await product.save()

        res.json({ success: true, message: "Product Added", product })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for list product
const listProducts = async (req, res) => {
    try {
        
        const products = await productModel.find({}).populate('category').populate('subCategory');
        res.json({success:true,products})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for removing product
const removeProduct = async (req, res) => {
    try {
        
        await productModel.findByIdAndDelete(req.body.id)
        res.json({success:true,message:"Product Removed"})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for single product info
const singleProduct = async (req, res) => {
    try {
        
        const { productId } = req.body
        const product = await productModel.findById(productId).populate('category').populate('subCategory')
        res.json({success:true,product})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for products by category
const getProductsByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params
        const products = await productModel.find({ category: categoryId }).populate('category').populate('subCategory')
        res.json({ success: true, products })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for wardrobe racks: products grouped by category (lean payload for the hanger UI)
const getRackProducts = async (req, res) => {
    try {
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 40, 1), 80)

        const racks = await productModel.aggregate([
            { $sort: { date: -1 } },
            {
                $project: {
                    name: 1, price: 1, bestseller: 1, category: 1, date: 1, sizes: 1, sideImages: 1,
                    image: { $slice: ['$image', 2] },
                    slug: '$seo.slug',
                    inStock: {
                        $cond: [
                            { $gt: [{ $size: { $ifNull: ['$variants', []] } }, 0] },
                            { $anyElementTrue: [{ $map: { input: '$variants', as: 'v', in: { $gt: ['$$v.quantity', 0] } } }] },
                            true
                        ]
                    }
                }
            },
            { $group: { _id: '$category', count: { $sum: 1 }, products: { $push: '$$ROOT' } } },
            { $project: { count: 1, products: { $slice: ['$products', limit] } } },
            { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
            { $unwind: '$category' },
            { $project: { _id: 0, category: { _id: '$category._id', name: '$category.name', image: '$category.image', description: '$category.description', hangerStyle: '$category.hangerStyle' }, count: 1, products: 1 } },
            { $sort: { 'category.name': 1 } }
        ])

        res.json({ success: true, racks })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for update product (only the fields that are sent are changed)
const updateProduct = async (req, res) => {
    try {
        const { id, name, description, price, category, subCategory, sizes, bestseller, variants, seo, imageUrls, sideImages } = req.body

        // Validate price
        if (!price || isNaN(Number(price)) || Number(price) < 0) {
            return res.json({ success: false, message: "Invalid price value" })
        }

        const updateData = { name, description: description || '', category, price: Number(price) }
        if (subCategory !== undefined) updateData.subCategory = subCategory || null
        if (bestseller !== undefined) updateData.bestseller = bestseller === true || bestseller === "true"
        if (sizes !== undefined) updateData.sizes = parseField(sizes, [])
        if (variants !== undefined) updateData.variants = parseField(variants, [])
        if (seo !== undefined) updateData.seo = parseField(seo, {})
        if (sideImages !== undefined) updateData.sideImages = cleanSides(parseField(sideImages, {}))

        const images = parseField(imageUrls, null)
        if (images && images.length) updateData.image = images

        await productModel.findByIdAndUpdate(id, updateData)

        res.json({ success: true, message: "Product Updated" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const getSitemap = async (req, res) => {
    try {
        const products = await productModel.find({}, '_id name seo date').lean()

        const today = new Date().toISOString().split('T')[0]
        const site = 'https://www.vibeculture.in'

        const staticUrls = [
            { loc: `${site}/`, priority: '1.0', changefreq: 'daily', lastmod: today },
            { loc: `${site}/collection`, priority: '0.9', changefreq: 'daily', lastmod: today },
            { loc: `${site}/about`, priority: '0.7', changefreq: 'monthly', lastmod: today },
            { loc: `${site}/contact`, priority: '0.6', changefreq: 'monthly', lastmod: today },
        ]

        const productUrls = products.map(p => {
            const d = new Date(p.date)
            const lastmod = isNaN(d.getTime()) ? today : d.toISOString().split('T')[0]
            return {
                loc: `${site}/product/` + (p.seo && p.seo.slug ? p.seo.slug : p._id),
                priority: '0.9',
                changefreq: 'weekly',
                lastmod
            }
        })

        const allUrls = [...staticUrls, ...productUrls]

        const urlTags = allUrls.map(u =>
            '<url>' +
            '<loc>' + u.loc + '</loc>' +
            '<lastmod>' + u.lastmod + '</lastmod>' +
            '<changefreq>' + u.changefreq + '</changefreq>' +
            '<priority>' + u.priority + '</priority>' +
            '</url>'
        ).join('')

        const xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urlTags + '</urlset>'

        res.setHeader('Content-Type', 'application/xml')
        res.setHeader('Cache-Control', 'public, max-age=3600')
        res.send(xml)
    } catch (error) {
        console.log(error)
        res.status(500).send('Error generating sitemap')
    }
}

const escapeHtml = (str = '') => String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const SITE = 'https://www.vibeculture.in'

/** Prefer gallery image; force Cloudinary JPG size WhatsApp can fetch. */
const toOgImage = (product) => {
    const raw = product?.image?.[0] || product?.seo?.ogImage || `${SITE}/logo.png`
    let src = String(raw).trim()
    if (src.startsWith('//')) src = `https:${src}`
    if (src.startsWith('http://')) src = src.replace('http://', 'https://')
    if (src.includes('res.cloudinary.com') && src.includes('/upload/') && !/\/upload\/[^/]*f_/.test(src)) {
        src = src.replace('/upload/', '/upload/f_jpg,w_1200,h_1200,c_fill,q_auto:good/')
    }
    return src
}

const findProductByIdOrSlug = async (idOrSlug) => {
    if (!idOrSlug) return null
    if (/^[0-9a-fA-F]{24}$/.test(idOrSlug)) {
        const byId = await productModel.findById(idOrSlug).populate('category').populate('subCategory').lean()
        if (byId) return byId
    }
    return productModel.findOne({ 'seo.slug': idOrSlug }).populate('category').populate('subCategory').lean()
}

// Open Graph HTML for WhatsApp / social crawlers (no JS required)
const getProductOg = async (req, res) => {
    try {
        const { idOrSlug } = req.params
        const product = await findProductByIdOrSlug(idOrSlug)

        if (!product) {
            return res.status(404).send('Product not found')
        }

        const slug = product.seo?.slug || String(product._id)
        const url = `${SITE}/product/${slug}`
        const title = escapeHtml(product.seo?.metaTitle || product.name)
        const plainDesc = String(product.description || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
        const description = escapeHtml(product.seo?.metaDescription || plainDesc.slice(0, 160) || `Buy ${product.name} at VibeCulture`)
        const image = escapeHtml(toOgImage(product))
        const price = product.price
        const inStock = Array.isArray(product.variants) && product.variants.length
            ? product.variants.some(v => v.quantity > 0)
            : true
        const categoryName = product.category?.name || ''
        const name = escapeHtml(product.name)

        const html = `<!DOCTYPE html>
<html lang="en" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | VibeCulture</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="VibeCulture" />
  <meta property="og:locale" content="en_IN" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:secure_url" content="${image}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="1200" />
  <meta property="og:image:alt" content="${name}" />
  <meta property="product:price:amount" content="${price}" />
  <meta property="product:price:currency" content="INR" />
  <meta property="product:availability" content="${inStock ? 'in stock' : 'out of stock'}" />
  <meta property="product:brand" content="VibeCulture" />
  ${categoryName ? `<meta property="product:category" content="${escapeHtml(categoryName)}" />` : ''}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
</head>
<body>
  <main style="font-family:system-ui,sans-serif;max-width:480px;margin:40px auto;padding:0 16px">
    <img src="${image}" alt="${name}" width="1200" height="1200" style="width:100%;border-radius:12px;aspect-ratio:1;object-fit:cover" />
    <h1 style="font-size:1.4rem;margin:16px 0 8px">${name}</h1>
    <p style="color:#555;margin:0 0 8px">${description}</p>
    <p style="font-size:1.25rem;font-weight:700;margin:0 0 16px">₹${price}</p>
    <a href="${url}" style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none">View on VibeCulture</a>
  </main>
</body>
</html>`

        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.setHeader('Cache-Control', 'public, max-age=600')
        res.send(html)
    } catch (error) {
        console.log(error)
        res.status(500).send('Error generating product preview')
    }
}

export { listProducts, getRackProducts, addProduct, removeProduct, singleProduct, updateProduct, getProductsByCategory, getSitemap, getProductOg }
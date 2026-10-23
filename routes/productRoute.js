import express from 'express'
import { listProducts, getRackProducts, addProduct, removeProduct, singleProduct, updateProduct, getProductsByCategory, getSitemap, getProductOg } from '../controllers/productController.js'
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';

const productRouter = express.Router();

productRouter.get('/sitemap.xml', getSitemap)
productRouter.get('/og/:idOrSlug', getProductOg)
productRouter.post('/add', adminAuth, addProduct);
productRouter.post('/update', adminAuth, updateProduct);
productRouter.post('/remove',adminAuth,removeProduct);
productRouter.post('/single',singleProduct);
productRouter.get('/list',listProducts)
productRouter.get('/racks',getRackProducts)
productRouter.get('/category/:categoryId',getProductsByCategory)

export default productRouter
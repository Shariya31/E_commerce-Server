import express from 'express'
import { adminOnly } from '../middlewares/auth.js';
import { deleteProduct, getAdminProducts, getAllCategories, getAllProducts, getlatestProducts, getSingleProduct, newProduct, updateProduct } from '../controllers/product.js';
import { singleUpload } from '../middlewares/multer.js';

const app = express.Router();

//Route using  /api/v1/product/new
app.post("/new",adminOnly, singleUpload, newProduct)

app.get("/all", getAllProducts)

app.get("/latest", getlatestProducts)

app.get("/categories", getAllCategories)

app.get("/admin-products", adminOnly,getAdminProducts)

app.route("/:id").get(getSingleProduct).put(adminOnly,singleUpload, updateProduct).delete(adminOnly,deleteProduct)

export default app 
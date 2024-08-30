import express from 'express'
import { adminOnly } from '../middlewares/auth.js'
import { allCoupons, applyDiscount, createPaymentIntent, deleteCoupon, newCoupon } from '../controllers/payment.js';

const app = express.Router();

//Route using /api/v1/payment/create
app.post ("/create", createPaymentIntent)

//Route using /api/v1/payment/discount
app.get ("/discount", applyDiscount)

//Route using /api/v1/payment/coupon/new
app.post ("/coupon/new", adminOnly, newCoupon)

//Route using /api/v1/payment/coupon/all
app.get ("/coupon/all", adminOnly, allCoupons)

//Route using /api/v1/payment/coupon/:id
app.delete ("/coupon/:id", adminOnly, deleteCoupon)


export default app
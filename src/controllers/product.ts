import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import { Product } from "../models/product.js";
import { BaseQuery, NewProductRequestBody, SearchRequestQuery } from "../types/types.js";
import ErrorHandler from "../utilities/utility-class.js";
import { rm } from "fs";
import { myCache } from "../app.js";
import { invalidatesCache } from "../utilities/features.js";
// import { faker } from "@faker-js/faker";


//Revalidae on New, Update, delete and on New Order
export const getlatestProducts = TryCatch(async(req, res, next)=>{
    let products;

    if(myCache.has("latest-products")) products = JSON.parse( myCache.get("latest-products") as string)
    
    else{
        products = await Product.find({}).sort({createdAt: -1}).limit(5)
        myCache.set("latest-products", JSON.stringify(products))
    }
  
    return res.status(201).json({
        success: true,
        products,
    })
})


//Revalidae on New, Update, delete and on New Order
export const getAllCategories = TryCatch(async(req, res, next)=>{
    let categories;

    if(myCache.has("categories")) categories = JSON.parse(myCache.get("categories") as string)
    else{
        categories = await Product.distinct("category")
        myCache.set("categories", JSON.stringify(categories))
    }
  
    return res.status(201).json({
        success: true,
        categories,
    })
})

//Revalidae on New, Update, delete and on New Order
export const getAdminProducts = TryCatch(async(req, res, next)=>{
    let products;
    if(myCache.has("all-products")) products = JSON.parse(myCache.get("all-products") as string)
    else{
        products = await Product.find({})
        myCache.set("all-products", JSON.stringify(products))
    }
  
    return res.status(201).json({
        success: true,
        products,
    })
})

export const getSingleProduct = TryCatch(async(req, res, next)=>{
    let product;
    const id = req.params.id;
    if(myCache.has(`product-${id}`)) product = JSON.parse(myCache.get(`product-${id}`) as string)
    
    else{
        product = await Product.findById(id);
        if(!product) return next(new ErrorHandler("Product does not exist", 404));
        myCache.set(`product-${id}`, JSON.stringify(product))
    }


  
    return res.status(201).json({
        success: true,
        product,
    })
})

export const newProduct = TryCatch(async(req: Request<{}, {}, NewProductRequestBody>, res: Response, next: NextFunction)=>{
    const {name, price, stock, category} = req.body
    const photo = req.file;

    if(!photo) return next(new ErrorHandler("Please Add a photo", 400));
    if(!name || !price || !stock || !category){
        rm(photo.path, ()=>{
            console.log('Deleted');
        })

        return next(new ErrorHandler("Please fill all the fields", 400))
    } 

    await Product.create({
        name, 
        price, 
        stock,
        category: category.toLowerCase(),
        photo: photo.path,
    })

    invalidatesCache({product: true, admin: true,})

    return res.status(201).json({
        success: true,
        message: "Product created successfully"
    })
})

export const updateProduct = TryCatch(async(req, res, next)=>{
    const {id} = req.params
    const {name, price, stock, category} = req.body
    const photo = req.file;
    const product = await Product.findById(id)

    if(!product) return next(new ErrorHandler("Product not found", 404));

    
    if(photo){
        rm(product.photo!, ()=>{
            console.log('Old photo deleted');
        });
        product.photo = photo.path;
    } 

    if(name) product.name = name;
    if(price) product.price = price;
    if(stock) product.stock= stock;
    if(category) product.category = category;

    await product.save();

    invalidatesCache({product: true, productId: String(product._id), admin: true,});


    return res.status(200).json({
        success: true,
        message: "Product updated successfully"
    })
})

export const deleteProduct = TryCatch(async(req, res, next)=>{
    
    const product = await Product.findById(req.params.id);

    if(!product) return next(new ErrorHandler("Product does not exist", 404));

    rm(product.photo!, ()=>{
        console.log("Photo deleted")
    })
    await product.deleteOne();

    invalidatesCache({product: true, productId: String(product._id), admin: true,});

    return res.status(201).json({
        success: true,
        message: "Product deleted successfully"
    })
})

export const getAllProducts = TryCatch(async(req: Request<{}, {}, {}, SearchRequestQuery>, res, next)=>{

    const {search, sort, category, price} = req.query
    const page = Number(req.query.page)  || 1;
    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip =  (page - 1) * limit; 
    

    const baseQuery:BaseQuery = {}

    if(search) 
        baseQuery.name = {
            $regex: search,
            $options: "i",
        };

    if(price)
        baseQuery.price = {
            $lte: Number(price), 
        }
    
    if(category)
        baseQuery.category = category;


    const productsPromise = Product.find(baseQuery).sort(sort && {price:sort === "asc" ? 1 : -1}).limit(limit).skip(skip)

    const [products, filteredOnlyProduct] = await Promise.all([
        productsPromise , Product.find(baseQuery)
    ])


    const totalPage = Math.ceil(filteredOnlyProduct.length / limit);
  
    return res.status(201).json({
        success: true,
        products,
        totalPage
    })
})




// const generateRandomProducts = async(count: number = 10)=>{
//     const products = [];

//     for(let i = 0; i < count; i++){
//         const product = {
//             name: faker.commerce.productName(),
//             photo: "uploads\\5e6ff7e8-19d6-48ef-b30a-83780f919351.png",
//             price: faker.commerce.price({min: 1500, max: 50000}),
//             stock: faker.commerce.price({min: 0, max: 100}),
//             category: faker.commerce.department(),
//             createdAt: new Date(faker.date.past()),
//             updateAt: new Date(faker.date.recent()),
//             __v: 0,
//         }
//         products.push(product)
//     }
//     await Product.create(products)

//     console.log({success: true})
// }

// export const deleteRandomsProducts = async(count: number = 10)=>{
//     const products = await Product.find({}).skip(2);

//     for(let i = 0; i < products.length; i++){
//         const product = products[i];
//         await product.deleteOne();
//     }
//     console.log({success: true})
   
// }
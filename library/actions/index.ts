"use server"
import { revalidatePath } from "next/cache";
import { connectDB } from "@/mongoose";
import { scrapeAmazonProduct } from "../scraper";
import Product from "../models/product.models";
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../utils";

export async function scrapeAndStoreProduct(productUrl:string){
    if(!productUrl){
        return;
    }
    try {
        connectDB();
        const scrapedProduct=await scrapeAmazonProduct(productUrl);

        if(!scrapedProduct) return;
        let product=scrapedProduct;

        const existingProduct=await Product.findOne({url:scrapedProduct.url});

        if(existingProduct){
            const updatePriceHistory:any=[
                ...existingProduct.priceHistory,
                {price: scrapedProduct.currentPrice},
            ]
            product={
                ...scrapedProduct,
                priceHistory:updatePriceHistory,
                lowestPrice:getLowestPrice(updatePriceHistory),
                highestPrice:getHighestPrice(updatePriceHistory),
                averagePrice:getAveragePrice(updatePriceHistory),

            }
        }
        const newProduct=await Product.findOneAndUpdate(
           { url: scrapedProduct.url},
            product,
            {upsert:true,new:true}
        )
        revalidatePath(`/product/${newProduct._id}`);
    } catch (error:any) {
        throw new Error(`failed to create/update product:${error .message}`)
    }
}

export async function getProductById(productId:string){
    try {
        connectDB();
        const product=await Product.findOne({_id:productId});
        if(!product)return null;

        return product;
        
    } catch (error) {
        console.log(error);
    }
}
export async function getallproduct(){
    try {
        connectDB();
        const products=await Product.find();
        return products;
    } catch (error) {
        console.log(error);
    }

}
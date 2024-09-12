import { NextResponse } from "next/server";

import { getLowestPrice, getHighestPrice, getAveragePrice, getEmailNotifType } from "@/library/utils";
import { connectDB } from "@/library/mongoose";
import Product from "@/library/models/product.models";
import { scrapeAmazonProduct } from "@/library/scraper";
import { generateEmailBody, sendEmail } from "@/library/nodemailer";

export const maxDuration = 300; // This function can run for a maximum of 300 seconds
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
    try {
      await connectDB(); // Ensure connection is awaited
  
      const products = await Product.find({});
  
      if (!products || products.length === 0) throw new Error("No products fetched");
  
      const updatedProducts = await Promise.all(
        products.map(async (currentProduct) => {
          // Scrape product details
          const scrapedProduct = await scrapeAmazonProduct(currentProduct.url);
  
          if (!scrapedProduct) return;
  
          // Update product details in DB
          const updatedPriceHistory = [
            ...currentProduct.priceHistory,
            { price: scrapedProduct.currentPrice },
          ];
  
          const product = {
            ...scrapedProduct,
            priceHistory: updatedPriceHistory,
            lowestPrice: getLowestPrice(updatedPriceHistory),
            highestPrice: getHighestPrice(updatedPriceHistory),
            averagePrice: getAveragePrice(updatedPriceHistory),
          };
  
          const updatedProduct = await Product.findOneAndUpdate(
            { url: product.url },
            product,
            { new: true } // Ensure the updated document is returned
          );
  
          // Determine email notification type
          const emailNotifType = getEmailNotifType(scrapedProduct, currentProduct);
  
          if (emailNotifType && updatedProduct && updatedProduct.users.length > 0) {
            const productInfo = {
              title: updatedProduct.title,
              url: updatedProduct.url,
            };
  
            const emailContent = await generateEmailBody(productInfo, emailNotifType);
            const userEmails = updatedProduct.users.map((user: any) => user.email);
            await sendEmail(emailContent, userEmails);
          }
  
          return updatedProduct;
        })
      );
  
      return NextResponse.json({
        message: "Ok",
        data: updatedProducts,
      });
    } catch (error: any) {
      console.error("Failed to get all products:", error);
      return NextResponse.json({
        message: `Failed to get all products: ${error.message}`,
      }, { status: 500 });
    }
  }
  
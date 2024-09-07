import axios from "axios";
import * as cheerio from "cheerio";
import { extractCurrency, extractDescription, extractPrice } from "../utils";

export async function scrapeAmazonProduct(url:string){
    if(!url)return;
// curl -i --proxy brd.superproxy.io:22225 --proxy-user
//  brd-customer-hl_3d07cab6-zone-pricewise:6mpjsxf90953 -k 
//  "https://geo.brdtest.com/welcome.txt"
    const username=String(process.env.BRIGHT_DATA_USERNAME);
    const password=String(process.env.BRIGHT_DATA_PASSWORD);
    const port=22225;
    const session_id=(100000*Math.random())|0;
    const options={
        auth:{
            username:`${username}-session-${session_id}`,
            password,
        },
        host:'brd.superproxy.io',
        port,
        rejectUnauthorized: false,
    }
    try {
        const response=await axios.get(url,options);
        const $=cheerio.load(response.data)

        const title=$('#productTitle').text().trim();
        const currentPrice=extractPrice(
            $('.priceToPay span.a-price-whole'),
            $('.a.size.base.a-color-price'),
            $('.a-button-selected .a-color-base'),
        );
        const originPrice=extractPrice(
            $('#priceblock_ourprice'),
      $('.a-price.a-text-price span.a-offscreen'),
      $('#listPrice'),
      $('#priceblock_dealprice'),
      $('.a-size-base.a-color-price')
            
        )

        const outOfStock=$('#availability span').text().trim().toLowerCase() === 'currently unavailable';
        const images = 
        $('#imgBlkFront').attr('data-a-dynamic-image') || 
        $('#landingImage').attr('data-a-dynamic-image') ||
        '{}'
        

        const imageUrls=Object.keys(JSON.parse(images))
        const currency=extractCurrency($('.a-price-symbol'))
        const discountRate=$('.savingsPercentage').text().replace(/[-%]/g,"")
        const ratingElement = $('.a-icon-alt').first();
        const ratingText = ratingElement.text().trim();
        const ratingPointsMatch = ratingText.match(/(\d+(\.\d+)?) out of 5 stars/);
        const ratingPoints = ratingPointsMatch ? ratingPointsMatch[1] : 'No rating available';
        const description=extractDescription($)
        
        const data={
            url,
            currency:currency || $,
            image:imageUrls[0],
            title,
            currentPrice:Number(currentPrice),
            originPrice:Number(originPrice),
            priceHistory:[],
            isoutOfStock:outOfStock,
            discountRate:Number(discountRate),
            category:'category',
            reviewscount:100,
            stars: Number(ratingPoints),
            description,
            lowestPrice:Number(currentPrice)||Number(originPrice),
            highestPrice:Number(originPrice)||Number(currentPrice),
            averagePrice:Number(currentPrice)||Number(originPrice),
        }
        return data;
    } catch (error:any) {
        throw new Error(`failed to scrape the product :${error.message}`)
    }
}
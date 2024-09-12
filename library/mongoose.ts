import mongoose from "mongoose";


let isConnected=false;
export const connectDB=async()=>{
   mongoose.set('strictQuery',true);

   if(!process.env.MONGO_DB_URI) return console.log('mongodb uri is not defined');

   if(isConnected) return; console.log('connected using existing database');
// PGZXLE4l4dlP6YFS


   try {
     await mongoose.connect(process.env.MONGO_DB_URI)
     isConnected=true;
     console.log('mongodb connected');
   } catch (error) {
    console.log(error);
   }
}
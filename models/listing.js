 const mongoose=require('mongoose');
const Review = require('./review');
 const Schema=mongoose.Schema;

 const listingSchema=new Schema({
    title:{
        type:String,
        required:true,
    },
    description: String,
  image: {
    url: String,
    filename: String,
  },
    price:{
      type:Number,
    },
    location:{
      type:String,
        
    },
    country:{
      type:String,
    },
    review:[
      {
      type:Schema.Types.ObjectId,
      ref:"review",
      }
    ],
    Owner:{
      type:Schema.Types.ObjectId,
      ref:"User",
    },

    geometry:{
         type: {
      type: String, // Don't do `{ location: { type: String } }`
      enum: ['Point'], // 'location.type' must be 'Point'
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
    },
 });
 listingSchema.post("findOneAndDelete",async(listing)=>{
  if(listing){
    await Review.deleteMany({review:{ $in: listing.review}});
  }
  
 });
 
 const Listing=mongoose.model("Listing",listingSchema);
 module.exports=Listing;
 
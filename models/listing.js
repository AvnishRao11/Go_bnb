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
    // AI-related fields
    aiTags: [String], // AI-generated tags for better search
    aiDescription: String, // AI-enhanced description
    sentimentScore: {
        type: Number,
        default: 0 // -1 to 1 scale
    },
    popularityScore: {
        type: Number,
        default: 0
    },
    recommendedPrice: {
        type: Number,
        default: 0
    },
    amenities: [String], // Extracted amenities
    propertyType: String, // AI-categorized property type
    aiFeatures: {
        lastAnalyzed: { type: Date, default: Date.now },
        keywords: [String],
        category: String,
        seasonality: [String] // best seasons for this property
    }
 });
 listingSchema.post("findOneAndDelete",async(listing)=>{
  if(listing){
    await Review.deleteMany({review:{ $in: listing.review}});
  }
  
 });
 
 const Listing=mongoose.model("Listing",listingSchema);
 module.exports=Listing;
 
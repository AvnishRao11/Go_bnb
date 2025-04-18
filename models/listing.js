 const mongoose=require('mongoose');
const Review = require('./review');
 const Schema=mongoose.Schema;

 const listingSchema=new Schema({
    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,
    },image: {
        url: {
          type: String,
          required: true,
          default: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
          set: (v) => {
            if (!v || typeof v !== "string") {
              return "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
            }
            return v;
          }
        }
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
      ref:"review"
      }
    ]

 });
 listingSchema.post("findOneAndDelete",async(listing)=>{
  if(listing){
    await Review.deleteMany({review:{ $in: listing.review}});
  }
  
 });
 
 const Listing=mongoose.model("Listing",listingSchema);
 module.exports=Listing;
 
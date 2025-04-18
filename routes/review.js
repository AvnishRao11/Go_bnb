const express=require('express');
const router=express.Router({mergeParams:true});
const wrapAsync=require("../utils/wrapAsync.js");
const Listing=require("../models/listing.js");
const ExpressError=require("../utils/ExpressError.js");
const {reviewSchema}=require("../schema.js");
const Review=require("../models/review.js");


const validatereview= (req,res,next)=>{
    let result=  reviewSchema.validate(req.body);
    console.log(result);
    if(result.error){
        throw new ExpressError(400,result.error);
    }
    else{
        next();
    }
}

//reviews 
 //post review route
 router.post('/',validatereview,wrapAsync(async(req,res)=>{
    let listing=await Listing.findById(req.params.id);
    let newreview= new Review(req.body.review);

    listing.review.push(newreview);

   await newreview.save();
   await  listing.save();
   res.redirect(`/listings/${listing._id}`);
}));

//delete  review route 
router.delete('/:reviewId',wrapAsync(async(req,res)=>{
    let {id,reviewId}=req.params;
    await Listing.findByIdAndUpdate(id,{$pull:{review:reviewId}});
    await Review.findByIdAndDelete(reviewId);

     res.redirect(`/listings/${id}`)
}));

module.exports=router;
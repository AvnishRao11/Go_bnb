const express=require('express');
const router=express.Router({mergeParams:true});
const wrapAsync=require("../utils/wrapAsync.js");
const Listing=require("../models/listing.js");
const ExpressError=require("../utils/ExpressError.js");
const Review=require("../models/review.js");
const {validatereview,isLoggedIn,isReviewauthor}=require("../middleware.js");
const reviewController=require("../controllers/review.js")

//reviews 
 //post review route
 router.post('/',isLoggedIn,validatereview,wrapAsync(reviewController.createReview));

//delete  review route 
router.delete('/:reviewId',isLoggedIn,isReviewauthor,wrapAsync(reviewController.destroyReview));

module.exports=router;
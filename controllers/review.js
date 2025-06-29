const Listing=require("../models/listing");
const Review=require("../models/review");
const AIService = require('../utils/aiService');

module.exports.createReview=async(req,res)=>{
    let listing=await Listing.findById(req.params.id);
    let newreview= new Review(req.body.review);
    newreview.author=req.user._id;
    
    // AI Sentiment Analysis
    const sentiment = AIService.analyzeSentiment(newreview.comment);
    newreview.sentiment = {
        score: sentiment.score,
        label: sentiment.label,
        keywords: sentiment.keywords,
        analyzedAt: new Date()
    };
    
    listing.review.push(newreview);

    await newreview.save();
    await listing.save();
    req.flash("sucess","new Review created !!");
    res.redirect(`/listings/${listing._id}`);
};

module.exports.destroyReview=async(req,res)=>{
    let {id,reviewId}=req.params;
    await Listing.findByIdAndUpdate(id,{$pull:{review:reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash("sucess","Review Delted !!");
     res.redirect(`/listings/${id}`)
};

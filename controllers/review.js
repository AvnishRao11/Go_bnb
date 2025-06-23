const Listing=require("../models/listing");
const Review=require("../models/review");

module.exports.createReview=async(req,res)=>{
    let listing=await Listing.findById(req.params.id);
    let newreview= new Review(req.body.review);
   newreview.author=req.user._id;
    listing.review.push(newreview);

   await newreview.save();
   await  listing.save();
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

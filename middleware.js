const Listing=require("./models/listing");
const Review=require("./models/review")
const ExpressError=require("./utils/ExpressError.js");
const {listingSchema,reviewSchema}=require("./schema.js");

module.exports.isLoggedIn=(req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl=req.originalUrl;
        req.flash("error","You Must Be Logged in to add new listing");
       return res.redirect('/login');
    }
    next();
}
module.exports.SaveRedirectUrl=(req,res,next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl=req.session.redirectUrl;
    }
    next();
};
module.exports.isOwner=async(req,res,next)=>{
    let {id}=req.params;
     let listing=await Listing.findById(id);
     if(!listing.Owner._id.equals(res.locals.Curruser._id)){
        req.flash("error","You don't have acess to edit this..");
        return res.redirect('/listings');
     }
     next();
};

module.exports.validateListing= (req,res,next)=>{
    let result=  listingSchema.validate(req.body);
    console.log(result);
    if(result.error){
        throw new ExpressError(400,result.error);
    }
    else{
        next();
    }
};

module.exports.validatereview= (req,res,next)=>{
    let result=  reviewSchema.validate(req.body);
    console.log(result);
    if(result.error){
        throw new ExpressError(400,result.error);
    }
    else{
        next();
    }
};

module.exports.isReviewauthor=async(req,res,next)=>{
    let {reviewId}=req.params;
     let review=await Review.findById(reviewId);
     if(!review.author._id.equals(res.locals.Curruser._id)){
        req.flash("error","You are not the author of this Review.");
        return res.redirect('/listings');
     }
     next();
};
module.exports.stripAIFields = (req, res, next) => {
    if (req.body && req.body.listing) {
        delete req.body.listing.aiTags;
        delete req.body.listing.sentimentScore;
        delete req.body.listing.amenities;
        delete req.body.listing.propertyType;
        delete req.body.listing.aiFeatures;
    }
    next();
};



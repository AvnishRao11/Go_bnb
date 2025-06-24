const express=require('express');
const router=express.Router();
const wrapAsync=require("../utils/wrapAsync.js");
const Listing=require("../models/listing.js");
const ExpressError=require("../utils/ExpressError.js");
const {listingSchema}=require("../schema.js");
const passport=require('passport');
const{isLoggedIn, isOwner,validateListing}=require('../middleware.js');
const review = require('../models/review.js');
const listingController=require("../controllers/listing.js");
const {storage}=require("../cloud_config.js");
const multer  = require('multer');
const upload = multer({ storage });

// Search route for listings by country (must be before /:id)
router.get('/search', wrapAsync(listingController.searchByCountry));

// Filter route for listings
router.get('/filter', wrapAsync(listingController.filterListings));

router.route("/")
.get(wrapAsync(listingController.index))
.post(isLoggedIn,upload.single('listing[image]'),validateListing,wrapAsync(listingController.createNewListing));


 //new Route
 router.get('/new',isLoggedIn,listingController.renderNewForm);
 

router .route("/:id")
.get( wrapAsync(listingController.showListing))
.put( isLoggedIn,isOwner,upload.single('listing[image]'),validateListing,wrapAsync(listingController.updateListing))
.delete(isLoggedIn,isOwner, wrapAsync(listingController.deleteListing))



// Edit Route
router.get('/:id/edit',isLoggedIn,isOwner,wrapAsync(listingController.editListing));

module.exports=router;
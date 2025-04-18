const express=require('express');
const router=express.Router();
const wrapAsync=require("../utils/wrapAsync.js");
const Listing=require("../models/listing.js");
const ExpressError=require("../utils/ExpressError.js");
const {listingSchema}=require("../schema.js");


const validateListing= (req,res,next)=>{
    let result=  listingSchema.validate(req.body);
    console.log(result);
    if(result.error){
        throw new ExpressError(400,result.error);
    }
    else{
        next();
    }
}

//Index Route
router.get('/',wrapAsync(async(req,res)=>{
    const allLisitngs=await Listing.find({});
    res.render("./listings/index.ejs",{allLisitngs});
 }));
 
 //new Route
 router.get('/new',(req,res)=>{
     res.render("./listings/new.ejs");
 });
 
 //show Route 
 router.get('/:id', wrapAsync(async(req,res)=>{
 let {id}=req.params;
 const listing=await Listing.findById(id).populate("review");
 res.render("./listings/show.ejs",{listing});
 }));
 
 //create Route
 router.post('/', validateListing, wrapAsync(async (req, res) => {
     try {
         console.log("Received data:", req.body.listing);
         const newListing = new Listing(req.body.listing);
         console.log("Created new listing object:", newListing);
         const savedListing = await newListing.save();
         console.log("Successfully saved listing to database:", savedListing);
         res.redirect("/listings");
     } catch (err) {
         console.error("Error saving listing:", err);
         throw new ExpressError(500, "Failed to save listing");
     }
 }));
 // Edit Route
 router.get('/:id/edit', wrapAsync(async(req,res)=>{
     let {id}=req.params;
     const listing=await Listing.findById(id);
     res.render("./listings/edit.ejs",{listing});
 })) ;
 
 //update Route
 router.put('/:id',validateListing, wrapAsync(async(req,res)=>{
     let {id}=req.params;
     await Listing.findByIdAndUpdate(id,{...req.body.listing});
     res.redirect('/listings');
 }));
 //Delete Route
 router.delete('/:id',  wrapAsync(async(req,res)=>{
     let {id}=req.params;
    await Listing.findByIdAndDelete(id);
    res.redirect('/listings');
 }));
 

 module.exports=router;
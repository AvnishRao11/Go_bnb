const Listing=require("../models/listing");
const ExpressError = require("../utils/ExpressError");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken=process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index=async(req,res)=>{
    const allLisitngs=await Listing.find({});
    res.render("./listings/index.ejs",{allLisitngs});
 };

module.exports.renderNewForm=(req,res)=>{
    res.render("./listings/new.ejs");
 };

 module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(id)
    .populate({ path: "review", populate: { path: "author" } })
    .populate("Owner");

  if (!listing) {
    req.flash("error", "Listing does not exist !!");
    return res.redirect('/listings');
  }

  // ✅ Only geocode if geometry is missing
  if (
    (!listing.geometry || !listing.geometry.coordinates || listing.geometry.coordinates.length !== 2) &&
    listing.location && listing.country
  ) {
    try {
      const geoResponse = await geocodingClient.forwardGeocode({
        query: `${listing.location}, ${listing.country}`,
        limit: 1
      }).send();

      const geoData = geoResponse.body.features[0]?.geometry;

      if (geoData) {
        listing.geometry = geoData;
        await listing.save();
        // console.log(`🌍 Geometry updated for listing: ${listing.title}`);
      } else {
        // console.warn(`⚠️ Could not geocode: ${listing.title}`);
      }
    } catch (err) {
    //   console.error(`❌ Error geocoding ${listing.title}:`, err.message);
    }
  }

  res.render("./listings/show.ejs", { listing });
};

 module.exports.createNewListing=async (req, res) => {
   let response=await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1
    })
        .send()

    let url=req.file.path;
    let filename=req.file.filename;
     try {
         console.log("Received data:", req.body.listing);
         const newListing = new Listing(req.body.listing);
         newListing.Owner=req.user._id;
         console.log("Created new listing object:", newListing);
         newListing.image={url,filename};

         newListing.geometry=response.body.features[0].geometry;

         const savedListing = await newListing.save();
        req.flash("sucess","new listing created !!");
         res.redirect(`/listings`);
     } catch (err) {
         console.error("Error saving listing:", err);
         throw new ExpressError(500, "Failed to save listing");
     }
 };

 module.exports.editListing=async(req,res)=>{
     let {id}=req.params;
     const listing=await Listing.findById(id);
     if(!listing){
        req.flash("error","Listing does not exist !!");
        return res.redirect('/listings');
     }
     let originalImageUrl=listing.image.url;
     originalImageUrl=originalImageUrl.replace("upload","upload/w_250");
     res.render("./listings/edit.ejs",{listing,originalImageUrl});
 };

 module.exports.updateListing=async(req,res)=>{
     let {id}=req.params;
     let listing=await Listing.findByIdAndUpdate(id,{...req.body.listing});
    if(typeof req.file!=="undefined"){
        let url=req.file.path;
        let filename=req.file.filename;
        listing.image={url,filename};
        await listing.save();
    }
 
     req.flash("sucess","Listing Updated !!");
     res.redirect(`/listings/${id}`);
 };

 module.exports.deleteListing=async(req,res)=>{
     let {id}=req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("sucess","Listing Deleted !!");
    res.redirect('/listings');
 };
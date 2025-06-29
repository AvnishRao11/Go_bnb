const Listing=require("../models/listing");
const ExpressError = require("../utils/ExpressError");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken=process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });
const AIService = require('../utils/aiService');

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

         // Save the listing first
         const savedListing = await newListing.save();

         // AI Analysis after saving
         const aiAnalysis = await AIService.analyzeListingContent(savedListing);
         savedListing.aiTags = aiAnalysis.aiTags;
         savedListing.sentimentScore = aiAnalysis.sentimentScore;
         savedListing.amenities = aiAnalysis.amenities;
         savedListing.propertyType = aiAnalysis.propertyType;
         savedListing.aiFeatures = {
             lastAnalyzed: new Date(),
             keywords: aiAnalysis.keywords,
             category: aiAnalysis.propertyType,
             seasonality: ['spring', 'summer', 'fall', 'winter']
         };
         await savedListing.save();

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

 module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });
    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }

    // AI Analysis after update
    const aiAnalysis = await AIService.analyzeListingContent(listing);
    listing.aiTags = aiAnalysis.aiTags;
    listing.sentimentScore = aiAnalysis.sentimentScore;
    listing.amenities = aiAnalysis.amenities;
    listing.propertyType = aiAnalysis.propertyType;
    listing.aiFeatures = {
        lastAnalyzed: new Date(),
        keywords: aiAnalysis.keywords,
        category: aiAnalysis.propertyType,
        seasonality: ['spring', 'summer', 'fall', 'winter']
    };
    await listing.save();

    req.flash("sucess", "Listing Updated !!");
    res.redirect(`/listings/${id}`);
};

 module.exports.deleteListing=async(req,res)=>{
     let {id}=req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("sucess","Listing Deleted !!");
    res.redirect('/listings');
 };

// Search listings by country
module.exports.searchByCountry = async (req, res) => {
    try {
        const { country } = req.query;
        let query = {};
        if (country && country.trim() !== "") {
            // Case-insensitive search for country
            query.country = { $regex: new RegExp(country, "i") };
        }
        const allLisitngs = await Listing.find(query);
        res.render("./listings/index.ejs", { allLisitngs });
    } catch (err) {
        console.error("Error searching listings by country:", err);
        req.flash("error", "Failed to search listings");
        res.redirect("/listings");
    }
};

// Filter listings by filter type
module.exports.filterListings = async (req, res) => {
    try {
        const { filter } = req.query;
        let query = {};
        switch (filter) {
            case 'trending':
                // Example: Trending could be listings with most reviews or highest price
                query = {}; // You can customize this logic
                break;
            case 'rooms':
                // Example: Rooms could be listings with 'room' in the title or description
                query = { $or: [
                    { title: { $regex: /room/i } },
                    { description: { $regex: /room/i } }
                ] };
                break;
            case 'iconic-cities':
                // Example: Iconic cities, you can list specific cities
                query = { location: { $in: ["New York", "Paris", "London", "Tokyo", "Mumbai"] } };
                break;
            case 'mountains':
                // Example: Mountains in location or description
                query = { $or: [
                    { location: { $regex: /mountain/i } },
                    { description: { $regex: /mountain/i } }
                ] };
                break;
            case 'amazing-pools':
                // Example: Pools in description
                query = { description: { $regex: /pool/i } };
                break;
            case 'camping':
                // Example: Camping in title or description
                query = { $or: [
                    { title: { $regex: /camping/i } },
                    { description: { $regex: /camping/i } }
                ] };
                break;
            case 'farms':
                // Example: Farms in title or description
                query = { $or: [
                    { title: { $regex: /farm/i } },
                    { description: { $regex: /farm/i } }
                ] };
                break;
            case 'desert':
                // Example: Desert in location or description
                query = { $or: [
                    { location: { $regex: /desert/i } },
                    { description: { $regex: /desert/i } }
                ] };
                break;
            case 'arctic':
                // Example: Arctic in location or description
                query = { $or: [
                    { location: { $regex: /arctic/i } },
                    { description: { $regex: /arctic/i } }
                ] };
                break;
            default:
                query = {};
        }
        const allLisitngs = await Listing.find(query);
        res.render("./listings/index.ejs", { allLisitngs });
    } catch (err) {
        console.error("Error filtering listings:", err);
        req.flash("error", "Failed to filter listings");
        res.redirect("/listings");
    }
};
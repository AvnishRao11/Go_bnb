const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
      
    },
    // AI-related fields for recommendations
    preferences: {
        locations: [String],
        priceRange: {
            min: Number,
            max: Number
        },
        amenities: [String],
        propertyTypes: [String]
    },
    searchHistory: [{
        query: String,
        timestamp: { type: Date, default: Date.now }
    }],
    viewedListings: [{
        listingId: { type: Schema.Types.ObjectId, ref: 'Listing' },
        timestamp: { type: Date, default: Date.now },
        duration: Number // time spent viewing in seconds
    }],
    favoriteListings: [{
        type: Schema.Types.ObjectId,
        ref: 'Listing'
    }],
    aiProfile: {
        lastUpdated: { type: Date, default: Date.now },
        interests: [String],
        travelStyle: String, // 'budget', 'luxury', 'adventure', 'relaxation'
        preferredSeasons: [String]
    }
});
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);


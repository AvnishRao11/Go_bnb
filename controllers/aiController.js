const AIService = require('../utils/aiService');
const Listing = require('../models/listing');
const User = require('../models/user');
const Review = require('../models/review');
const wrapAsync = require('../utils/wrapAsync');

// AI-enhanced search with natural language processing
module.exports.aiSearch = wrapAsync(async (req, res) => {
    const { query } = req.query;
    
    if (!query) {
        return res.redirect('/listings');
    }

    try {
        // Enhance search query using AI
        const enhancedSearch = await AIService.enhanceSearchQuery(query);
        
        // Build search query
        let searchQuery = {};
        
        // Basic text search
        searchQuery.$or = [
            { title: { $regex: enhancedSearch.enhancedQuery, $options: 'i' } },
            { description: { $regex: enhancedSearch.enhancedQuery, $options: 'i' } },
            { location: { $regex: enhancedSearch.enhancedQuery, $options: 'i' } },
            { country: { $regex: enhancedSearch.enhancedQuery, $options: 'i' } },
            { aiTags: { $in: enhancedSearch.keywords.map(k => new RegExp(k, 'i')) } }
        ];

        // Apply AI-suggested filters
        if (enhancedSearch.filters.propertyType) {
            searchQuery.propertyType = { $regex: enhancedSearch.filters.propertyType, $options: 'i' };
        }
        
        if (enhancedSearch.filters.amenities && enhancedSearch.filters.amenities.length > 0) {
            searchQuery.amenities = { $in: enhancedSearch.filters.amenities };
        }

        const listings = await Listing.find(searchQuery).populate('Owner');
        
        // Log search for user preferences (if logged in)
        if (req.user) {
            await User.findByIdAndUpdate(req.user._id, {
                $push: { 
                    searchHistory: { 
                        query: query,
                        timestamp: new Date()
                    }
                }
            });
        }

        res.render('./listings/index.ejs', { 
            allLisitngs: listings,
            searchQuery: query,
            enhancedQuery: enhancedSearch.enhancedQuery
        });
    } catch (error) {
        console.error('AI search error:', error);
        req.flash('error', 'Search failed. Please try again.');
        res.redirect('/listings');
    }
});

// Get personalized recommendations
module.exports.getRecommendations = wrapAsync(async (req, res) => {
    if (!req.user) {
        req.flash('error', 'Please login to get personalized recommendations');
        return res.redirect('/login');
    }

    try {
        const user = await User.findById(req.user._id);
        const recommendationQuery = await AIService.getPersonalizedRecommendations(user, 6);
        
        let listings;
        if (Object.keys(recommendationQuery).length > 0) {
            listings = await Listing.find(recommendationQuery)
                .populate('Owner')
                .limit(6);
        } else {
            // Fallback to popular listings
            listings = await Listing.find({})
                .populate('Owner')
                .sort({ popularityScore: -1 })
                .limit(6);
        }

        res.render('./listings/recommendations.ejs', { 
            recommendations: listings,
            user: user
        });
    } catch (error) {
        console.error('Recommendations error:', error);
        req.flash('error', 'Unable to load recommendations');
        res.redirect('/listings');
    }
});

// AI content generation for listings
module.exports.generateContent = wrapAsync(async (req, res) => {
    const { title, location, price, amenities } = req.body;
    
    try {
        const description = await AIService.generateListingDescription(title, location, price, amenities);
        const tags = await AIService.generateTags(title, description, location);
        
        res.json({
            success: true,
            description,
            tags
        });
    } catch (error) {
        console.error('Content generation error:', error);
        res.json({
            success: false,
            error: 'Failed to generate content'
        });
    }
});

// Price optimization suggestions
module.exports.getPriceSuggestions = wrapAsync(async (req, res) => {
    const { location, amenities, propertyType, currentPrice } = req.body;
    
    try {
        const suggestions = await AIService.suggestOptimalPrice(
            location, 
            amenities || [], 
            propertyType, 
            currentPrice
        );
        
        res.json({
            success: true,
            suggestions
        });
    } catch (error) {
        console.error('Price suggestion error:', error);
        res.json({
            success: false,
            error: 'Failed to get price suggestions'
        });
    }
});

// Analyze listing content and update AI fields
module.exports.analyzeListing = wrapAsync(async (req, res) => {
    const { id } = req.params;
    
    try {
        const listing = await Listing.findById(id);
        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        const analysis = await AIService.analyzeListingContent(listing);
        
        // Update listing with AI analysis
        listing.aiTags = analysis.aiTags;
        listing.sentimentScore = analysis.sentimentScore;
        listing.amenities = analysis.amenities;
        listing.propertyType = analysis.propertyType;
        listing.aiFeatures = {
            lastAnalyzed: new Date(),
            keywords: analysis.keywords,
            category: analysis.propertyType,
            seasonality: ['spring', 'summer', 'fall', 'winter'] // Default seasons
        };
        
        await listing.save();
        
        res.json({
            success: true,
            analysis
        });
    } catch (error) {
        console.error('Listing analysis error:', error);
        res.json({
            success: false,
            error: 'Failed to analyze listing'
        });
    }
});

// Track user behavior for recommendations
module.exports.trackUserBehavior = wrapAsync(async (req, res) => {
    const { listingId, action, duration } = req.body;
    
    if (!req.user) {
        return res.json({ success: false, error: 'User not logged in' });
    }

    try {
        const updateData = {};
        
        switch (action) {
            case 'view':
                updateData.$push = {
                    viewedListings: {
                        listingId: listingId,
                        timestamp: new Date(),
                        duration: duration || 0
                    }
                };
                break;
            case 'favorite':
                updateData.$addToSet = {
                    favoriteListings: listingId
                };
                break;
            case 'unfavorite':
                updateData.$pull = {
                    favoriteListings: listingId
                };
                break;
        }

        await User.findByIdAndUpdate(req.user._id, updateData);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Behavior tracking error:', error);
        res.json({ success: false, error: 'Failed to track behavior' });
    }
});

// Get AI insights for a listing
module.exports.getListingInsights = wrapAsync(async (req, res) => {
    const { id } = req.params;
    
    try {
        const listing = await Listing.findById(id).populate({
            path: 'review',
            populate: { path: 'author' }
        });
        
        if (!listing) {
            return res.status(404).json({ error: 'Listing not found' });
        }

        // Analyze reviews sentiment
        const reviewInsights = listing.review.map(review => {
            const sentiment = AIService.analyzeSentiment(review.comment);
            return {
                reviewId: review._id,
                sentiment: sentiment,
                rating: review.rating
            };
        });

        // Calculate overall sentiment
        const overallSentiment = reviewInsights.reduce((acc, insight) => {
            return acc + insight.sentiment.score;
        }, 0) / reviewInsights.length;

        // Get price analysis
        const priceAnalysis = await AIService.suggestOptimalPrice(
            listing.location,
            listing.amenities || [],
            listing.propertyType || 'property',
            listing.price
        );

        res.json({
            success: true,
            insights: {
                overallSentiment,
                reviewInsights,
                priceAnalysis,
                aiTags: listing.aiTags,
                popularityScore: listing.popularityScore
            }
        });
    } catch (error) {
        console.error('Insights error:', error);
        res.json({
            success: false,
            error: 'Failed to get insights'
        });
    }
}); 
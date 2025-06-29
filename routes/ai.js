const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { isLoggedIn } = require('../middleware');

// AI-enhanced search
router.get('/search', aiController.aiSearch);

// Get personalized recommendations
router.get('/recommendations', isLoggedIn, aiController.getRecommendations);

// AI content generation
router.post('/generate-content', isLoggedIn, aiController.generateContent);

// Price optimization suggestions
router.post('/price-suggestions', isLoggedIn, aiController.getPriceSuggestions);

// Analyze listing content
router.post('/analyze-listing/:id', isLoggedIn, aiController.analyzeListing);

// Track user behavior
router.post('/track-behavior', isLoggedIn, aiController.trackUserBehavior);

// Get AI insights for listing
router.get('/insights/:id', aiController.getListingInsights);

module.exports = router; 
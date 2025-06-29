const natural = require('natural');
const Sentiment = require('sentiment');
const nlp = require('compromise');
const NodeCache = require('node-cache');

// Initialize AI services with optional API key
let openai = null;
let OpenAI = null;

if (process.env.OPENAI_API_KEY) {
    try {
        OpenAI = require('openai');
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        console.log('✅ OpenAI API configured successfully');
    } catch (error) {
        console.warn('⚠️ Failed to initialize OpenAI:', error.message);
    }
} else {
    console.warn('⚠️ OPENAI_API_KEY not found. AI features will use fallback methods.');
}

const sentiment = new Sentiment();
const tokenizer = new natural.WordTokenizer();
const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

class AIService {
    // Content Generation
    static async generateListingDescription(title, location, price, amenities = []) {
        const cacheKey = `desc_${title}_${location}_${price}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached;

        try {
            if (!openai) {
                // Fallback: Generate basic description without OpenAI
                return `Experience the perfect stay at ${title} in ${location}. This beautiful property offers comfortable accommodation for ${price} per night. ${amenities.length > 0 ? `Amenities include: ${amenities.join(', ')}.` : ''} Book your stay today and create unforgettable memories.`;
            }

            const prompt = `Generate a compelling, SEO-friendly description for a vacation rental property with the following details:
            Title: ${title}
            Location: ${location}
            Price: $${price} per night
            Amenities: ${amenities.join(', ')}
            
            The description should be:
            - 150-200 words
            - Engaging and persuasive
            - Highlight unique features
            - Include relevant keywords naturally
            - Professional but warm tone`;

            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 300,
                temperature: 0.7
            });

            const description = completion.choices[0].message.content;
            cache.set(cacheKey, description);
            return description;
        } catch (error) {
            console.error('Error generating description:', error);
            // Fallback description
            return `Welcome to ${title} in ${location}! This charming property offers comfortable accommodation for ${price} per night. Perfect for your next getaway.`;
        }
    }

    static async generateTags(title, description, location) {
        const cacheKey = `tags_${title}_${location}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached;

        try {
            if (!openai) {
                // Fallback: Generate basic tags using NLP
                const text = `${title} ${description} ${location}`.toLowerCase();
                const fallbackTags = [];
                
                // Property types
                if (text.includes('apartment')) fallbackTags.push('apartment');
                if (text.includes('house')) fallbackTags.push('house');
                if (text.includes('villa')) fallbackTags.push('villa');
                if (text.includes('cabin')) fallbackTags.push('cabin');
                if (text.includes('cottage')) fallbackTags.push('cottage');
                
                // Location types
                if (text.includes('beach')) fallbackTags.push('beach');
                if (text.includes('mountain')) fallbackTags.push('mountain');
                if (text.includes('city')) fallbackTags.push('city');
                if (text.includes('countryside')) fallbackTags.push('countryside');
                
                // Amenities
                if (text.includes('pool')) fallbackTags.push('pool');
                if (text.includes('wifi')) fallbackTags.push('wifi');
                if (text.includes('kitchen')) fallbackTags.push('kitchen');
                
                return fallbackTags.length > 0 ? fallbackTags : ['vacation', 'rental', 'accommodation'];
            }

            const prompt = `Extract relevant tags for a vacation rental listing. Return only a JSON array of 5-8 tags.
            
            Title: ${title}
            Description: ${description}
            Location: ${location}
            
            Tags should include:
            - Property type (apartment, villa, cabin, etc.)
            - Location type (beach, mountain, city, etc.)
            - Key amenities
            - Experience type (romantic, family-friendly, adventure, etc.)
            
            Return format: ["tag1", "tag2", "tag3"]`;

            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 150,
                temperature: 0.3
            });

            const response = completion.choices[0].message.content;
            const tags = JSON.parse(response);
            cache.set(cacheKey, tags);
            return tags;
        } catch (error) {
            console.error('Error generating tags:', error);
            return ['vacation', 'rental', 'accommodation'];
        }
    }

    // Sentiment Analysis
    static analyzeSentiment(text) {
        try {
            const result = sentiment.analyze(text);
            const score = result.score;
            
            let label = 'neutral';
            if (score > 0) label = 'positive';
            else if (score < 0) label = 'negative';

            // Extract keywords using compromise
            const doc = nlp(text);
            const keywords = doc.nouns().out('array').slice(0, 5);

            return {
                score: Math.max(-1, Math.min(1, score / 10)), // Normalize to -1 to 1
                label,
                keywords
            };
        } catch (error) {
            console.error('Error analyzing sentiment:', error);
            return { score: 0, label: 'neutral', keywords: [] };
        }
    }

    // Price Optimization
    static async suggestOptimalPrice(location, amenities, propertyType, currentPrice) {
        const cacheKey = `price_${location}_${propertyType}_${currentPrice}`;
        const cached = cache.get(cacheKey);
        if (cached) return cached;

        try {
            if (!openai) {
                // Fallback: Basic price suggestion
                const basePrice = currentPrice;
                const amenitiesBonus = amenities.length * 50;
                const suggestedPrice = basePrice + amenitiesBonus;
                
                return {
                    recommendedPrice: suggestedPrice,
                    reasoning: `Based on amenities and location. ${amenities.length} amenities detected.`,
                    seasonalAdjustments: { 
                        peak: suggestedPrice * 1.2, 
                        offPeak: suggestedPrice * 0.8 
                    }
                };
            }

            const prompt = `Analyze the optimal pricing for a vacation rental property:
            
            Location: ${location}
            Property Type: ${propertyType}
            Amenities: ${amenities.join(', ')}
            Current Price: $${currentPrice} per night
            
            Consider:
            - Market demand in the area
            - Seasonal variations
            - Amenity value
            - Competition
            
            Return a JSON object with:
            {
                "recommendedPrice": number,
                "reasoning": "string",
                "seasonalAdjustments": {
                    "peak": number,
                    "offPeak": number
                }
            }`;

            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 300,
                temperature: 0.3
            });

            const response = completion.choices[0].message.content;
            const result = JSON.parse(response);
            cache.set(cacheKey, result);
            return result;
        } catch (error) {
            console.error('Error suggesting price:', error);
            return {
                recommendedPrice: currentPrice,
                reasoning: "Unable to analyze pricing",
                seasonalAdjustments: { peak: currentPrice * 1.2, offPeak: currentPrice * 0.8 }
            };
        }
    }

    // Smart Search Enhancement
    static async enhanceSearchQuery(query) {
        try {
            if (!openai) {
                // Fallback: Basic search enhancement
                const keywords = query.toLowerCase().split(' ');
                const filters = {};
                
                if (keywords.includes('pool')) filters.amenities = ['pool'];
                if (keywords.includes('wifi')) filters.amenities = ['wifi'];
                if (keywords.includes('apartment')) filters.propertyType = 'apartment';
                if (keywords.includes('house')) filters.propertyType = 'house';
                
                return {
                    enhancedQuery: query,
                    keywords: keywords,
                    filters: filters
                };
            }

            const prompt = `Enhance this search query for a vacation rental platform to improve search results:
            
            Original Query: "${query}"
            
            Return a JSON object with:
            {
                "enhancedQuery": "string",
                "keywords": ["array", "of", "keywords"],
                "filters": {
                    "propertyType": "string or null",
                    "amenities": ["array"],
                    "location": "string or null"
                }
            }`;

            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 200,
                temperature: 0.3
            });

            const response = completion.choices[0].message.content;
            return JSON.parse(response);
        } catch (error) {
            console.error('Error enhancing search:', error);
            return {
                enhancedQuery: query,
                keywords: query.split(' '),
                filters: {}
            };
        }
    }

    // User Preference Analysis
    static async analyzeUserPreferences(user) {
        try {
            const viewedListings = user.viewedListings || [];
            const searchHistory = user.searchHistory || [];
            const favoriteListings = user.favoriteListings || [];

            if (viewedListings.length === 0 && searchHistory.length === 0) {
                return {
                    interests: [],
                    travelStyle: 'unknown',
                    preferredSeasons: [],
                    priceRange: { min: 0, max: 1000 }
                };
            }

            if (!openai) {
                // Fallback: Basic preference analysis
                const interests = [];
                const priceRange = { min: 0, max: 1000 };
                
                if (searchHistory.length > 0) {
                    interests.push('travel');
                }
                if (favoriteListings.length > 0) {
                    interests.push('luxury');
                }
                
                return {
                    interests: interests,
                    travelStyle: 'budget',
                    preferredSeasons: ['spring', 'summer'],
                    priceRange: priceRange
                };
            }

            const prompt = `Analyze user behavior data to determine preferences:
            
            Viewed Listings: ${viewedListings.length} items
            Search History: ${searchHistory.map(s => s.query).join(', ')}
            Favorite Listings: ${favoriteListings.length} items
            
            Determine:
            1. Travel interests (beach, mountain, city, etc.)
            2. Travel style (budget, luxury, adventure, relaxation)
            3. Preferred seasons
            4. Price range preferences
            
            Return JSON with these fields.`;

            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 200,
                temperature: 0.3
            });

            const response = completion.choices[0].message.content;
            return JSON.parse(response);
        } catch (error) {
            console.error('Error analyzing preferences:', error);
            return {
                interests: [],
                travelStyle: 'unknown',
                preferredSeasons: [],
                priceRange: { min: 0, max: 1000 }
            };
        }
    }

    // Smart Recommendations
    static async getPersonalizedRecommendations(user, limit = 6) {
        try {
            const preferences = await this.analyzeUserPreferences(user);
            
            // Build recommendation query based on preferences
            let query = {};
            
            if (preferences.interests.length > 0) {
                query.$or = preferences.interests.map(interest => ({
                    $or: [
                        { title: { $regex: interest, $options: 'i' } },
                        { description: { $regex: interest, $options: 'i' } },
                        { aiTags: { $in: [new RegExp(interest, 'i')] } }
                    ]
                }));
            }

            if (preferences.priceRange) {
                query.price = {
                    $gte: preferences.priceRange.min,
                    $lte: preferences.priceRange.max
                };
            }

            return query;
        } catch (error) {
            console.error('Error getting recommendations:', error);
            return {};
        }
    }

    // Content Analysis
    static async analyzeListingContent(listing) {
        try {
            const text = `${listing.title} ${listing.description || ''}`;
            const sentimentResult = this.analyzeSentiment(text);
            const tags = await this.generateTags(listing.title, listing.description, listing.location);
            
            // Extract amenities using NLP
            const doc = nlp(text);
            const amenities = doc.match('(pool|wifi|kitchen|parking|garden|balcony|fireplace|ac|heating)').out('array');
            
            // Determine property type
            const propertyTypes = ['apartment', 'house', 'villa', 'cabin', 'cottage', 'condo'];
            const propertyType = propertyTypes.find(type => 
                text.toLowerCase().includes(type)
            ) || 'property';

            return {
                sentimentScore: sentimentResult.score,
                aiTags: tags,
                amenities: [...new Set(amenities)],
                propertyType,
                keywords: sentimentResult.keywords
            };
        } catch (error) {
            console.error('Error analyzing listing content:', error);
            return {
                sentimentScore: 0,
                aiTags: [],
                amenities: [],
                propertyType: 'property',
                keywords: []
            };
        }
    }
}

module.exports = AIService; 
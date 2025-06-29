 const mongoose=require('mongoose');
 const Schema=mongoose.Schema;

 const reviewSchema=new Schema({
    comment:String,
    rating:{
        type:Number,
        min:1,
        max:5,
    },
    createdAt:{
        type:Date,
        default:Date.now()
    },
    author:{
        type:Schema.Types.ObjectId,
        ref:"User",
    },
    // AI-related fields
    sentiment: {
        score: { type: Number, default: 0 }, // -1 to 1 scale
        label: { type: String, default: 'neutral' }, // positive, negative, neutral
        keywords: [String], // extracted key terms
        analyzedAt: { type: Date, default: Date.now }
    },
    aiInsights: {
        helpfulness: { type: Number, default: 0 }, // AI-determined helpfulness score
        topics: [String], // main topics discussed
        emotions: [String] // emotions detected
    }
 });
 module.exports=mongoose.model("review",reviewSchema);
const express=require('express');
const app=express();
const mongoose=require('mongoose');
const Listing=require("./models/listing.js");
const Review=require("./models/review.js");
const methodOverride=require('method-override');
const path=require("path");
const ejsmate=require('ejs-mate');
const session=require('express-session');
const flash=require('connect-flash');
const passport=require('passport');
const LocalStrategy=require('passport-local').Strategy;
const User=require('./models/user.js');

const ExpressError=require("./utils/ExpressError.js");
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine('ejs',ejsmate);
app.use(express.static(path.join(__dirname,"/public")));


const listingroute=require('./routes/listing.js');
const reviewroute=require('./routes/review.js');
const userroute=require('./routes/user.js');

const Mongo_url='mongodb://127.0.0.1:27017/wanderlust';

// Database connection with detailed logging
async function main() {
    try {
        console.log("Attempting to connect to MongoDB at:", Mongo_url);
        await mongoose.connect(Mongo_url);
        console.log("Connected to MongoDB successfully");
        
        // Verify database connection
        const db = mongoose.connection;
        console.log("Current database:", db.name);
        console.log("Database state:", db.readyState);
        
        // List all collections
        const collections = await db.db.listCollections().toArray();
        console.log("Available collections:", collections.map(c => c.name));
    } catch (err) {
        console.error("Database connection error:", err);
    }
}

main();


const sessionoptions={
    secret: "mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires:Date.now()+ 7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly:true,

    },
}

app.use(session(sessionoptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.sucess=req.flash("sucess");
    res.locals.error=req.flash("error");
    res.locals.Curruser=req.user;
    next();
});

app.use('/listings',listingroute);
app.use('/listings/:id/reviews',reviewroute);
app.use('/',userroute);


app.get('/',(req,res)=>{
    res.send("Hi !! , i am root");
});

app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong!" } = err;
    // res.status(statusCode).send(message);
    res.render("./listings/error.ejs",{message});
});

// app.get('/demouser',async(req,res)=>{
//     let fakeuser=new User({
//         email:"fakeuser@gmail.com",
//         username:"delta-fake"
//     });
//   let registereduser =await User.register(fakeuser,"helloworld");
//   res.send(registereduser);
// })

// Debug route to check database contents
app.get('/debug/listings', async (req, res) => {
    try {
        const listings = await Listing.find({});
        console.log("Total listings in database:", listings.length);
        console.log("Listings:", listings);
        res.json(listings);
    } catch (err) {
        console.error("Error fetching listings:", err);
        res.status(500).json({ error: "Failed to fetch listings" });
    }
});

// // Route to check MongoDB directly
// app.get('/debug/mongodb', async (req, res) => {
//     try {
//         const db = mongoose.connection;
//         const nativeDb = db.db;
        
//         // Get all collections
//         const collections = await nativeDb.listCollections().toArray();
//         console.log("MongoDB Collections:", collections);
        
//         // Get all documents in the listings collection
//         const listings = await nativeDb.collection('listings').find({}).toArray();
//         console.log("MongoDB Listings:", listings);
        
//         res.json({
//             collections: collections.map(c => c.name),
//             listingsCount: listings.length,
//             listings: listings
//         });
//     } catch (err) {
//         console.error("Error checking MongoDB:", err);
//         res.status(500).json({ error: "Failed to check MongoDB" });
//     }
// });

app.listen(8080,()=>{
    console.log("listening on 8080");
});
require('dotenv').config({ path: '../.env' });

const mongoose=require("mongoose");
const initdata=require("./data.js");
const Listing=require("../models/listing.js");
const url=process.env.ATLASDB_URL;
const Mongo_url=url;

if (!Mongo_url) {
    console.error("❌ ERROR: ATLASDB_URL not found in .env file.");
    process.exit(1); // Stop script immediately
}


main()
.then(()=>{
    console.log("connected to database");
})
.catch((err)=>{
    console.log(err);
});
    
async function main(){
    await mongoose.connect(Mongo_url);
};

const intitDB=async()=>{
   await Listing.deleteMany({});
//    initdata.data=initdata.data.map((obj)=>({...obj,Owner: "680add1575bc782d1e3ea843"}));
   await Listing.insertMany(initdata.data);
   console.log("data was initilasized");
};
intitDB();

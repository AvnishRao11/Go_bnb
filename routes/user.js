const express=require('express');
const router=express.Router();
const User=require('../models/user.js');
const wrapAsync = require('../utils/wrapAsync.js');
const passport=require('passport');
const { SaveRedirectUrl } = require('../middleware.js');

router.get('/signup',(req , res)=>{
    res.render("users/signup.ejs");
});

router.post('/signup',wrapAsync(async(req,res)=>{
    try{
        let {username, email,password}=req.body;
        const newuser= new User({email,username});
        const registereduser= await User.register(newuser, password);
        console.log(registereduser);
        req.login(registereduser,(err)=>{
            if(err){
                return next(err);
            }
            req.flash("sucess","Welcome...");
            res.redirect('/listings');
        })
    }
    catch(err){
        req.flash("error",err.message);
        res.redirect('/signup');
    }

}));
router.get('/login',(req , res)=>{
    res.render("users/login.ejs");
});

router.post('/login',SaveRedirectUrl, passport.authenticate("local",{failureRedirect:'/login',failureFlash:true}),async(req,res)=>{
    req.flash("sucess","Welcome to ... You are logged in");
    let redirectUrl=res.locals.redirectUrl||'/listings';
    res.redirect(redirectUrl);
});

router.get('/logout',(req,res)=>{
    req.logout((err)=>{
        if(err){
            next(err);
        }
        req.flash('sucess',"you are logged out now");
        res.redirect('/listings');
    })
})

module.exports=router;
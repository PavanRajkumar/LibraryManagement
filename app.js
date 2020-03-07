const express = require("express");
const mysql = require("mysql");
const expresshandlebar = require("express-handlebars");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const request = require("request");
const flash = require('connect-flash');
const expressSession = require('express-session');
const expressLayout = require('express-ejs-layouts');
const passportLocal = require('passport-local');
const passport = require("passport");
const methodOverride = require('method-override');

const app = express();

require(__dirname +'/passport.js')(passport);
//app.use(expressLayout);
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(methodOverride("_method"));

//Express session
app.use(expressSession({
    secret:"secret",
    resave:true,
    saveUninitialized:true
}));

//Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
//global variable
app.use(function(req,res,next){
    res.locals.success_msg=req.flash('success_msg');
    res.locals.error_msg=req.flash('error_msg');
    res.locals.error=req.flash('error');
    next();
});
//linking to route page
app.use('/user',require('./routes/user.js'));

app.get('/',(req,res)=>{
    res.redirect("/user/login");
})

app.listen(process.env.PORT||5000,function(){
    console.log("server started");
});
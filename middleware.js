const Listing = require("./models/listing.js");
const {listingSchema, reviewSchema} = require("./schema.js");
const ExpressError = require("./utils/ExpressError.js");
const Review = require("./models/review.js");

 
module.exports.isLoggedIn = (req, res, next) => {
     if (!req.isAuthenticated()) {
         // Only store redirect URLs for GET requests, ignore DELETE, POST, etc.
         if (req.method === "GET") {
             req.session.redirectUrl = req.originalUrl;
         } else {
             req.session.redirectUrl = "/listings";  // Default fallback
         }
 
         req.flash("error", "You must be logged in!");
         return res.redirect("/login");
     }
     next();
 };
 
module.exports.savedRedirectUrl = (req, res, next)=>{
     if(req.session.redirectUrl){
          res.locals.redirectUrl = req.session.redirectUrl;
     }
     next();
};

module.exports.isOwner = async(req, res, next)=>{
     let {id} = req.params;
     let listing = await Listing.findById(id);
     if(!listing.owner._id.equals(res.locals.currUser._id)){
        req.flash("error", "You are not owner!");
        return res.redirect(`/listings/${id}`);
     }
     next(); 
};


// Middleware for listing
module.exports.validateListing = (req, res,next )=>{
     let {error} = listingSchema.validate(req.body);
     if(error){
         let errMsg = error.details.map((el) => el.message).join(",");
         throw new ExpressError(400, errMsg);
     } else{
         next();
     }
 };
 

// Middleware for review
module.exports.validateReview = (req, res,next )=>{
     let {error} = reviewSchema.validate(req.body);
     if(error){
         let errMsg = error.details.map((el) => el.message).join(",");
         throw new ExpressError(400, errMsg);
     } else{
         next();
     }
 };

module.exports.isReviewAuthor = async(req, res, next)=>{
     let {id, reviewId} = req.params;
     let review = await Review.findById(reviewId);
     if(!review.author.equals(res.locals.currUser._id)){
        req.flash("error", "You are not author of this review!");
        return res.redirect(`/listings/${id}`);
     }
     next(); 
};

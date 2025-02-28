const Listing = require("../models/listing");
const axios = require("axios"); // Ensure axios is installed
const mapKey = process.env.MAP_KEY;

module.exports.index = async (req, res) => {
  const { category, query } = req.query;
  let filter = {};

  if (category) {
    filter.category = category;
  }

  if (query) {
    filter.location = { $regex: query, $options: "i" };
  }

  const allListings = await Listing.find(filter);

  if (allListings.length === 0) {
    let message = "No listings found.";
    if (query) {
      message = `No listings found in "${query}".`;
    } else if (category) {
      message = `No listings found for category "${category}".`;
    }
    req.flash("error", message); // ✅ Store the message in flash
    return res.redirect("/listings"); // ✅ Redirect to show flash message
  }

  res.render("listings/index", { allListings, query });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }
  // console.log(listing);
  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
  try {
    // **Extract location from the form submission**
    const location = req.body.listing.location;

    // **Forward Geocoding using Geoapify API**
    const geoResponse = await axios.get(
      "https://api.geoapify.com/v1/geocode/search",
      {
        params: {
          text: location, // The user-inputted location
          apiKey: mapKey, // Use API key from .env
        },
      }
    );

    // **Check if valid location data was received**
    if (geoResponse.data.features.length === 0) {
      req.flash("error", "Location not found!");
      return res.redirect("/listings/new");
    }

    // **Extract coordinates from Geoapify response**
    const coordinates = geoResponse.data.features[0].geometry.coordinates; // [lng, lat]

    // **Handle Image Upload (Make sure multer is used)**
    const url = req.file ? req.file.path : null;
    const filename = req.file ? req.file.filename : null;

    // **Create a New Listing**
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    if (url && filename) {
      newListing.image = { url, filename };
    }
    newListing.geometry = {
      type: "Point",
      coordinates, // Store as [longitude, latitude]
    };

    await newListing.save(); // **Save to the database**

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
  } catch (error) {
    console.error("Geocoding error:", error);
    req.flash("error", "Something went wrong with geocoding.");
    res.redirect("/listings/new");
  }
};

module.exports.renderEditForm = async (req, res, next) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    return res.redirect("/listings");
  }
  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  try {
    let { id } = req.params;
    let updatedData = { ...req.body.listing };

    // **Get new coordinates using Geoapify**
    const geoResponse = await axios.get(
      `https://api.geoapify.com/v1/geocode/search`,
      {
        params: {
          text: updatedData.location, // Location text from the form
          apiKey: mapKey, // Your Geoapify API key
        },
      }
    );

    if (geoResponse.data.features.length > 0) {
      const [lng, lat] = geoResponse.data.features[0].geometry.coordinates;
      updatedData.geometry = { type: "Point", coordinates: [lng, lat] };
    } else {
      req.flash("error", "Invalid location. Please try again.");
      return res.redirect(`/listings/${id}/edit`);
    }

    // **Update listing in database**
    const listing = await Listing.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    if (typeof req.file !== "undefined") {
      let url = req.file.path;
      let filename = req.file.filename;
      listing.image = { url, filename };
      await listing.save();
    }

    req.flash("success", "Listing Updated");
    res.redirect(`/listings/${id}`);
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong while updating the listing.");
    res.redirect(`/listings/${id}/edit`);
  }
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted!");
  return res.redirect("/listings");
};

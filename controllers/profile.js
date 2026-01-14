const User = require("../models/user");
const Listing = require("../models/listing");
const Booking = require("../models/booking");

module.exports.showProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Get user's listings
    const listings = await Listing.find({ owner: req.user._id });

    // Get user's bookings
    const bookings = await Booking.find({ user: req.user._id })
      .populate("listing")
      .sort({ createdAt: -1 });

    res.render("users/profile.ejs", { user, listings, bookings });
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong!");
    res.redirect("/listings");
  }
};

module.exports.renderEditProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.render("users/edit.ejs", { user });
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong!");
    res.redirect("/profile");
  }
};

module.exports.updateProfile = async (req, res) => {
  try {
    const { username, email, phone } = req.body;

    const updateData = { username, email, phone };

    // Handle avatar upload if file exists
    if (req.file) {
      updateData.avatar = {
        url: req.file.path,
        filename: req.file.filename,
      };
    }

    await User.findByIdAndUpdate(req.user._id, updateData);

    req.flash("success", "Profile updated successfully!");
    res.redirect("/profile");
  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to update profile!");
    res.redirect("/profile/edit");
  }
};

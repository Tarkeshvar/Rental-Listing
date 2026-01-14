const Booking = require("../models/booking");
const Listing = require("../models/listing");
const User = require("../models/user");
const razorpayInstance = require("../utils/razorpay");
const crypto = require("crypto");

// Render booking page
module.exports.renderBookPage = async (req, res) => {
  try {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate("owner");

    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    res.render("listings/book.ejs", { listing });
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong!");
    res.redirect("/listings");
  }
};

// Create Razorpay order
module.exports.createOrder = async (req, res) => {
  try {
    const { listingId, checkIn, checkOut, guests } = req.body;

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Calculate total price (NO SERVICE FEE)
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil(
      (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
    );
    const totalPrice = listing.price * nights;

    // Create Razorpay order
    const options = {
      amount: totalPrice * 100, // Amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        listingId: listingId,
        userId: req.user._id.toString(),
        checkIn: checkIn,
        checkOut: checkOut,
        guests: guests,
      },
    };

    const order = await razorpayInstance.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
};

// Verify payment and create booking
module.exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      listingId,
      checkIn,
      checkOut,
      guests,
      totalPrice,
    } = req.body;

    // Verify Razorpay signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Payment verified - Create booking
    const booking = new Booking({
      listing: listingId,
      user: req.user._id,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests: parseInt(guests),
      totalPrice: parseFloat(totalPrice),
      paymentStatus: "completed",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      bookingStatus: "confirmed",
    });

    await booking.save();

    // Add booking to user's bookings array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { bookings: booking._id },
    });

    req.flash("success", "Booking confirmed successfully!");
    res.json({
      success: true,
      bookingId: booking._id,
      redirectUrl: `/bookings/${booking._id}`,
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
};

// Show booking details
module.exports.showBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate("listing")
      .populate("user");

    if (!booking) {
      req.flash("error", "Booking not found!");
      return res.redirect("/profile");
    }

    // Check if user is authorized
    if (!booking.user._id.equals(req.user._id)) {
      req.flash("error", "You are not authorized to view this booking!");
      return res.redirect("/profile");
    }

    res.render("bookings/show.ejs", { booking });
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong!");
    res.redirect("/profile");
  }
};

// Show receipt page
module.exports.showReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate("listing")
      .populate("user");

    if (!booking) {
      req.flash("error", "Booking not found!");
      return res.redirect("/profile");
    }

    // Check authorization
    if (!booking.user._id.equals(req.user._id)) {
      req.flash("error", "Unauthorized!");
      return res.redirect("/profile");
    }

    res.render("bookings/receipt.ejs", { booking });
  } catch (error) {
    console.error(error);
    req.flash("error", "Something went wrong!");
    res.redirect("/profile");
  }
};

// Cancel booking
module.exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      req.flash("error", "Booking not found!");
      return res.redirect("/profile");
    }

    if (!booking.user.equals(req.user._id)) {
      req.flash("error", "Unauthorized!");
      return res.redirect("/profile");
    }

    // Check if booking is already cancelled or completed
    if (booking.bookingStatus !== "confirmed") {
      req.flash("error", "This booking cannot be cancelled!");
      return res.redirect("/profile");
    }

    booking.bookingStatus = "cancelled";
    await booking.save();

    req.flash("success", "Booking cancelled successfully!");
    res.redirect("/profile");
  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to cancel booking!");
    res.redirect("/profile");
  }
};

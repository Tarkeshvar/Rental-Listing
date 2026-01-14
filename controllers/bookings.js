const Booking = require("../models/booking");
const Listing = require("../models/listing");
const User = require("../models/user");
const razorpayInstance = require("../utils/razorpay");
const crypto = require("crypto");

/* ================================
   Render booking page
================================ */
module.exports.renderBookPage = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate("owner");

    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    res.render("listings/book.ejs", { listing });
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong!");
    res.redirect("/listings");
  }
};

/* ================================
   Create Razorpay Order
================================ */
module.exports.createOrder = async (req, res) => {
  try {
    const { listingId, checkIn, checkOut, guests } = req.body;

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil(
      (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
    );

    const totalPrice = listing.price * nights;

    const options = {
      amount: totalPrice * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        listingId,
        userId: req.user._id.toString(),
        checkIn,
        checkOut,
        guests,
      },
    };

    const order = await razorpayInstance.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
};

/* ================================
   Verify Payment & Create Booking
================================ */
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

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    const booking = new Booking({
      listing: listingId,
      user: req.user._id,
      checkIn,
      checkOut,
      guests: parseInt(guests),
      totalPrice: parseFloat(totalPrice),
      paymentStatus: "completed",
      bookingStatus: "confirmed",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    await booking.save();

    await User.findByIdAndUpdate(req.user._id, {
      $push: { bookings: booking._id },
    });

    res.json({
      success: true,
      redirectUrl: `/bookings/${booking._id}/receipt`,
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ error: "Payment verification failed" });
  }
};

/* ================================
   Show Receipt Page (ONLY VIEW)
================================ */
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

    if (!booking.user._id.equals(req.user._id)) {
      req.flash("error", "Unauthorized access!");
      return res.redirect("/profile");
    }

    res.render("bookings/receipt.ejs", { booking });
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong!");
    res.redirect("/profile");
  }
};

/* ================================
   Cancel Booking
================================ */
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

    if (booking.bookingStatus !== "confirmed") {
      req.flash("error", "Booking cannot be cancelled!");
      return res.redirect("/profile");
    }

    booking.bookingStatus = "cancelled";
    await booking.save();

    req.flash("success", "Booking cancelled successfully!");
    res.redirect("/profile");
  } catch (err) {
    console.error(err);
    req.flash("error", "Cancellation failed!");
    res.redirect("/profile");
  }
};

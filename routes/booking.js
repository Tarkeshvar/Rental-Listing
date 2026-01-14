const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookings");
const { isLoggedIn } = require("../middleware");

// Booking page
router.get("/listings/:id/book", isLoggedIn, bookingController.renderBookPage);

// Razorpay
router.post(
  "/bookings/create-order",
  isLoggedIn,
  bookingController.createOrder
);

router.post(
  "/bookings/verify-payment",
  isLoggedIn,
  bookingController.verifyPayment
);

// ✅ ONLY receipt page
router.get("/bookings/:id/receipt", isLoggedIn, bookingController.showReceipt);

// Cancel booking
router.post(
  "/bookings/:id/cancel",
  isLoggedIn,
  bookingController.cancelBooking
);

module.exports = router;

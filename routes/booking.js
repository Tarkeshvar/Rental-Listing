const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookings");
const { isLoggedIn } = require("../middleware");

// Booking routes
router.get("/listings/:id/book", isLoggedIn, bookingController.renderBookPage);
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
router.get("/bookings/:id", isLoggedIn, bookingController.showBooking);
router.get("/bookings/:id/receipt", isLoggedIn, bookingController.showReceipt); // Changed to showReceipt
router.post(
  "/bookings/:id/cancel",
  isLoggedIn,
  bookingController.cancelBooking
);

module.exports = router;

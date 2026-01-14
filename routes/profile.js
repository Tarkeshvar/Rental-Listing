const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profile");
const { isLoggedIn } = require("../middleware");
const multer = require("multer");
const { storage } = require("../cloudConfig");

const upload = multer({ storage });

router.get("/profile", isLoggedIn, profileController.showProfile);
router.get("/profile/edit", isLoggedIn, profileController.renderEditProfile);
router.put(
  "/profile",
  isLoggedIn,
  upload.single("avatar"),
  profileController.updateProfile
);

module.exports = router;

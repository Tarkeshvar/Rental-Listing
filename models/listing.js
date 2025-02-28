const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");
const { required } = require("joi");

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  image: {
    filename: { type: String, default: "default_image" },
    url: {
      type: String,
      default:
        "https://unsplash.com/photos/a-bird-flying-over-a-mountain-range-at-sunset-nzdvmBa8lb0",
    },
  },
  price: Number,
  location: String,
  country: String,
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  geometry: {
    type: {
      type: String,
      enum: ["Point"], // Only allow "Point" for GeoJSON
      required: true,
    },
    coordinates: {
      type: [Number], // Array of numbers [longitude, latitude]
      required: true,
    },
  },
  category: {
    type: String,
    enum: [
      "Trending",
      "Rooms",
      "Iconic Cities",
      "Mountains",
      "Castles",
      "Amazing Pools",
      "Camping",
      "Arctic",
    ],
    required: true,
  },
});

listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;

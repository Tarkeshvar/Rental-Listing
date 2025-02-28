const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const MONGO_URL = "mongodb://127.0.0.1:27017/wonderlust";

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}
const initDB = async () => {
  const existingListings = await Listing.find({}); // Check if data exists

  if (existingListings.length === 0) {
    // If database is empty, insert new listings
    initData.data = initData.data.map((obj) => ({
      ...obj,
      owner: "67b8216395b48aefec6b601e",
      geometry: obj.geometry || { type: "Point", coordinates: [0, 0] }, // Add default geometry if missing
    }));

    await Listing.insertMany(initData.data);
    console.log("Database was empty. Inserted new listings.");
  } else {
    // If data exists, update existing listings
    for (let listing of existingListings) {
      listing.owner = "67b8216395b48aefec6b601e"; // Update owner
      if (!listing.geometry) {
        listing.geometry = { type: "Point", coordinates: [0, 0] }; // Default geometry
      }
      await listing.save(); // Save changes
    }

    console.log("Existing listings updated.");
  }
};

initDB();

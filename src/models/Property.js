const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["Bungalow", "Apartment", "Villa", "House", "Plot"],
  },
  price: {
    type: Number,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  areaSqFt: {
    type: Number,
    required: true,
  },
  bedrooms: {
    type: Number,
    required: true,
  },
  bathrooms: {
    type: Number,
    required: true,
  },
  amenities: {
    type: String,
    required: true,
  },
  furnished: {
    type: String,
    required: true,
    enum: ["Furnished", "Unfurnished", "Semi-Furnished"],
  },
  availableFrom: {
    type: Date,
    required: true,
  },
  listedBy: {
    type: String,
    required: true,
  },
  tags: {
    type: String,
    required: true,
  },
  colorTheme: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  listingType: {
    type: String,
    required: true,
    enum: ["rent", "sale"],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp before saving
propertySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Property", propertySchema);

const express = require("express");
const router = express.Router();
const Favorite = require("../models/Favorite");
const Property = require("../models/Property");
const auth = require("../middleware/auth");

// Add property to favorites
router.post("/:propertyId", auth, async (req, res) => {
  try {
    let property;

    // First try to find by custom id
    property = await Property.findOne({ id: req.params.propertyId });

    // If not found by custom id, try MongoDB _id
    if (!property) {
      property = await Property.findById(req.params.propertyId);
    }

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    const favorite = new Favorite({
      user: req.user._id,
      property: property._id,
    });

    await favorite.save();

    res.status(201).json(favorite);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Property already in favorites" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

// Get user's favorite properties
router.get("/", auth, async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id }).populate({
      path: "property",
      populate: {
        path: "createdBy",
        select: "name email",
      },
    });

    res.json(favorites);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Remove property from favorites
router.delete("/:propertyId", auth, async (req, res) => {
  try {
    let property;

    // First try to find by custom id
    property = await Property.findOne({ id: req.params.propertyId });

    // If not found by custom id, try MongoDB _id
    if (!property) {
      property = await Property.findById(req.params.propertyId);
    }

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    const favorite = await Favorite.findOneAndDelete({
      user: req.user._id,
      property: property._id,
    });

    if (!favorite) {
      return res.status(404).json({ error: "Favorite not found" });
    }

    res.json({ message: "Property removed from favorites" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Check if property is in favorites
router.get("/check/:propertyId", auth, async (req, res) => {
  try {
    let property;

    // First try to find by custom id
    property = await Property.findOne({ id: req.params.propertyId });

    // If not found by custom id, try MongoDB _id
    if (!property) {
      property = await Property.findById(req.params.propertyId);
    }

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    const favorite = await Favorite.findOne({
      user: req.user._id,
      property: property._id,
    });

    res.json({ isFavorite: !!favorite });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

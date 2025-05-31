const express = require("express");
const router = express.Router();
const Favorite = require("../models/Favorite");
const Property = require("../models/Property");
const auth = require("../middleware/auth");
const redisClient = require("../config/redis");

// Helper function to generate cache key
const generateCacheKey = (userId, type) => {
  return `favorites:${type}:${userId}`;
};

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

    // Invalidate cache
    await redisClient.del(generateCacheKey(req.user._id, "list"));
    await redisClient.del(
      generateCacheKey(req.user._id, "check:" + property._id)
    );

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
    // Check cache
    const cacheKey = generateCacheKey(req.user._id, "list");
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    const favorites = await Favorite.find({ user: req.user._id }).populate({
      path: "property",
      populate: {
        path: "createdBy",
        select: "name email",
      },
    });

    // Cache results for 5 minutes
    await redisClient.set(cacheKey, JSON.stringify(favorites), "EX", 300);

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

    // Invalidate cache
    await redisClient.del(generateCacheKey(req.user._id, "list"));
    await redisClient.del(
      generateCacheKey(req.user._id, "check:" + property._id)
    );

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

    // Check cache
    const cacheKey = generateCacheKey(req.user._id, "check:" + property._id);
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData !== null) {
      return res.json({ isFavorite: cachedData === "true" });
    }

    const favorite = await Favorite.findOne({
      user: req.user._id,
      property: property._id,
    });

    const isFavorite = !!favorite;

    // Cache result for 5 minutes
    await redisClient.set(cacheKey, isFavorite.toString(), "EX", 300);

    res.json({ isFavorite });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

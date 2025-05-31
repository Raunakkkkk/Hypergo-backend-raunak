const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Property = require("../models/Property");
const auth = require("../middleware/auth");
const redisClient = require("../config/redis");

// Helper function to generate cache key
const generateCacheKey = (query) => {
  return `property:${JSON.stringify(query)}`;
};

// Create property
router.post(
  "/",
  auth,
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("type")
      .isIn(["Bungalow", "Apartment", "Villa", "House", "Plot"])
      .withMessage("Invalid property type"),
    body("price").isNumeric().withMessage("Price must be a number"),
    body("state").notEmpty().withMessage("State is required"),
    body("city").notEmpty().withMessage("City is required"),
    body("areaSqFt").isNumeric().withMessage("Area must be a number"),
    body("bedrooms")
      .isInt({ min: 0 })
      .withMessage("Bedrooms must be a positive number"),
    body("bathrooms")
      .isInt({ min: 0 })
      .withMessage("Bathrooms must be a positive number"),
    body("amenities").notEmpty().withMessage("Amenities are required"),
    body("furnished")
      .isIn(["Furnished", "Unfurnished", "Semi-Furnished"])
      .withMessage("Invalid furnished status"),
    body("availableFrom").isISO8601().withMessage("Invalid date format"),
    body("listedBy").notEmpty().withMessage("Listed by is required"),
    body("tags").notEmpty().withMessage("Tags are required"),
    body("colorTheme")
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage("Invalid color theme"),
    body("rating")
      .isFloat({ min: 0, max: 5 })
      .withMessage("Rating must be between 0 and 5"),
    body("listingType")
      .isIn(["rent", "sale"])
      .withMessage("Invalid listing type"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const property = new Property({
        ...req.body,
        createdBy: req.user._id,
        id: `PROP${Date.now()}`,
      });

      await property.save();

      // Invalidate cache
      await redisClient.del("property:*");

      res.status(201).json(property);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Get properties with advanced search
router.get("/", async (req, res) => {
  try {
    const {
      type,
      minPrice,
      maxPrice,
      state,
      city,
      minArea,
      maxArea,
      bedrooms,
      bathrooms,
      furnished,
      amenities,
      listingType,
      sortBy,
      sortOrder,
      page = 1,
      limit = 25,
    } = req.query;

    // Build query
    const query = {};
    if (type) query.type = type;
    if (state) query.state = state;
    if (city) query.city = city;
    if (bedrooms) query.bedrooms = parseInt(bedrooms);
    if (bathrooms) query.bathrooms = parseInt(bathrooms);
    if (furnished) query.furnished = furnished;
    if (listingType) query.listingType = listingType;

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }

    if (minArea || maxArea) {
      query.areaSqFt = {};
      if (minArea) query.areaSqFt.$gte = parseInt(minArea);
      if (maxArea) query.areaSqFt.$lte = parseInt(maxArea);
    }

    if (amenities) {
      const amenitiesList = amenities.split("|");
      query.amenities = { $regex: amenitiesList.join("|"), $options: "i" };
    }

    // Check cache
    const cacheKey = generateCacheKey(query);
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    // Build sort options
    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    } else {
      sortOptions.createdAt = -1;
    }

    // Execute query
    const properties = await Property.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("createdBy", "name email");

    const total = await Property.countDocuments(query);

    const result = {
      properties,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    };

    // Cache results
    await redisClient.set(cacheKey, JSON.stringify(result), "EX", 300); // Cache for 5 minutes

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get single property by _id or custom id
router.get("/:id", async (req, res) => {
  try {
    let property;

    // First try to find by custom id
    property = await Property.findOne({ id: req.params.id }).populate(
      "createdBy",
      "name email"
    );

    // If not found by custom id, try MongoDB _id
    if (!property) {
      property = await Property.findById(req.params.id).populate(
        "createdBy",
        "name email"
      );
    }

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    res.json(property);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update property by _id or custom id
router.put("/:id", auth, async (req, res) => {
  try {
    let property;

    // First try to find by custom id
    property = await Property.findOne({ id: req.params.id });

    // If not found by custom id, try MongoDB _id
    if (!property) {
      property = await Property.findById(req.params.id);
    }

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Check if user is the creator
    if (property.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this property" });
    }

    // Update the property
    const updatedProperty = await Property.findByIdAndUpdate(
      property._id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    // Invalidate cache
    await redisClient.del("property:*");

    res.json(updatedProperty);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Delete property by _id or custom id
router.delete("/:id", auth, async (req, res) => {
  try {
    let property;

    // First try to find by custom id
    property = await Property.findOne({ id: req.params.id });

    // If not found by custom id, try MongoDB _id
    if (!property) {
      property = await Property.findById(req.params.id);
    }

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Check if user is the creator
    if (property.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this property" });
    }

    await property.deleteOne();

    // Invalidate cache
    await redisClient.del("property:*");

    res.json({ message: "Property deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

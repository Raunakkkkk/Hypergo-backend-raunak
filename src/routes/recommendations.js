const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Recommendation = require("../models/Recommendation");
const Property = require("../models/Property");
const User = require("../models/User");
const auth = require("../middleware/auth");

// Search for a user by email
router.get("/search-user", auth, async (req, res) => {
  //   console.log("Auth User:", req.user);
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    console.log("Searching for email:", email);
    const user = await User.findOne({ email }).select("_id name email").lean();

    console.log("Found user:", user);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Don't allow recommending to self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "Cannot recommend to yourself" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error in search-user:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Recommend a property to a user
router.post(
  "/:propertyId",
  auth,
  [
    body("recipientEmail")
      .isEmail()
      .withMessage("Valid recipient email is required"),
    body("message")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Message must be less than 500 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { recipientEmail, message } = req.body;
      let property;

      // Find property by custom id or MongoDB _id
      property = await Property.findOne({ id: req.params.propertyId });
      if (!property) {
        property = await Property.findById(req.params.propertyId);
      }

      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }

      // Find recipient user
      const recipient = await User.findOne({ email: recipientEmail });
      if (!recipient) {
        return res.status(404).json({ error: "Recipient user not found" });
      }

      // Don't allow recommending to self
      if (recipient._id.toString() === req.user._id.toString()) {
        return res.status(400).json({ error: "Cannot recommend to yourself" });
      }

      // Create recommendation
      const recommendation = new Recommendation({
        property: property._id,
        sender: req.user._id,
        recipient: recipient._id,
        message,
      });

      await recommendation.save();

      res.status(201).json(recommendation);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          error: "You have already recommended this property to this user",
        });
      }
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Get recommendations received by the current user
router.get("/received", auth, async (req, res) => {
  try {
    const recommendations = await Recommendation.find({
      recipient: req.user._id,
    })
      .populate({
        path: "property",
        populate: {
          path: "createdBy",
          select: "name email",
        },
      })
      .populate("sender", "name email")
      .sort({ createdAt: -1 });

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get recommendations sent by the current user
router.get("/sent", auth, async (req, res) => {
  try {
    const recommendations = await Recommendation.find({ sender: req.user._id })
      .populate({
        path: "property",
        populate: {
          path: "createdBy",
          select: "name email",
        },
      })
      .populate("recipient", "name email")
      .sort({ createdAt: -1 });

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Mark a recommendation as viewed
router.patch("/:recommendationId/view", auth, async (req, res) => {
  try {
    const recommendation = await Recommendation.findOne({
      _id: req.params.recommendationId,
      recipient: req.user._id,
    });

    if (!recommendation) {
      return res.status(404).json({ error: "Recommendation not found" });
    }

    recommendation.status = "viewed";
    await recommendation.save();

    res.json(recommendation);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a recommendation (only by sender)
router.delete("/:recommendationId", auth, async (req, res) => {
  try {
    const recommendation = await Recommendation.findOne({
      _id: req.params.recommendationId,
      sender: req.user._id,
    });

    if (!recommendation) {
      return res.status(404).json({ error: "Recommendation not found" });
    }

    await recommendation.deleteOne();
    res.json({ message: "Recommendation deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

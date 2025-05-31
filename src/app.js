const authRoutes = require("./routes/auth");
const propertyRoutes = require("./routes/properties");
const favoriteRoutes = require("./routes/favorites");
const recommendationRoutes = require("./routes/recommendations");

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/recommendations", recommendationRoutes);

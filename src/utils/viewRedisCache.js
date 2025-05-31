const redisClient = require("../config/redis");

async function viewRedisCache() {
  try {
    console.log("Fetching Redis Cache Data...\n");

    // Get all keys
    const keys = await redisClient.keys("*");
    console.log("All Redis Keys:", keys);
    console.log("\n-----------------------------------\n");

    // Get property cache keys
    const propertyKeys = await redisClient.keys("property:*");
    console.log("Property Cache Keys:", propertyKeys);
    console.log("\n-----------------------------------\n");

    // Get and display content of each property cache
    for (const key of propertyKeys) {
      const data = await redisClient.get(key);
      console.log(`Cache Key: ${key}`);
      console.log("Cache Content:", JSON.parse(data));
      console.log("\n-----------------------------------\n");
    }

    // Get TTL (Time To Live) for each key
    for (const key of propertyKeys) {
      const ttl = await redisClient.ttl(key);
      console.log(`Key: ${key}`);
      console.log(`TTL: ${ttl} seconds`);
      console.log("\n-----------------------------------\n");
    }

    // Close connection
    await redisClient.quit();
    console.log("Redis connection closed");
  } catch (error) {
    console.error("Error viewing Redis cache:", error);
  }
}

// Run the script
viewRedisCache();

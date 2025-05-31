const redisClient = require("../config/redis");

async function testRedisConnection() {
  try {
    console.log("Testing Redis Connection...");

    // Test 1: Basic Connection
    await redisClient.ping();
    console.log("✅ Redis connection successful");

    // Test 2: Set and Get
    const testKey = "test:property";
    const testData = {
      id: "PROP1000",
      title: "Test Property",
      price: 1000000,
    };

    await redisClient.set(testKey, JSON.stringify(testData));
    console.log("✅ Set operation successful");

    const retrievedData = await redisClient.get(testKey);
    console.log("✅ Get operation successful");
    console.log("Retrieved data:", JSON.parse(retrievedData));

    // Test 3: Cache Expiration
    await redisClient.set("test:expire", "This will expire", "EX", 5);
    console.log("✅ Set with expiration successful");

    // Wait for 1 second to show the key exists
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const beforeExpire = await redisClient.get("test:expire");
    console.log("Before expire:", beforeExpire);

    // Test 4: Delete
    await redisClient.del(testKey);
    const afterDelete = await redisClient.get(testKey);
    console.log("✅ Delete operation successful");
    console.log("After delete:", afterDelete);

    // Test 5: Cache Invalidation
    await redisClient.set("test:pattern:1", "value1");
    await redisClient.set("test:pattern:2", "value2");
    await redisClient.del("test:pattern:*");
    console.log("✅ Pattern-based deletion successful");

    // Close connection
    await redisClient.quit();
    console.log("✅ Redis connection closed successfully");
  } catch (error) {
    console.error("❌ Redis test failed:", error);
  }
}

// Run the test
testRedisConnection();

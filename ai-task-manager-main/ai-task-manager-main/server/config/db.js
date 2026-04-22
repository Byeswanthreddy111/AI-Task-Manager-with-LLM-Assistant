const mongoose = require("mongoose");
const mysql = require("mysql2/promise");

// MongoDB Connection
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    console.error(
      "Connection String:",
      process.env.MONGODB_URI?.substring(0, 30) + "..."
    );
    process.exit(1);
  }
};

// Handle MongoDB connection events
mongoose.connection.on("disconnected", () => {
  console.log("⚠️  MongoDB Disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB Error:", err);
});

// MySQL Connection Pool
const mysqlPool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || "taskdb",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test MySQL Connection
const connectMySQL = async () => {
  try {
    const connection = await mysqlPool.getConnection();
    console.log("✅ MySQL Connected Successfully");

    // Test query
    await connection.query("SELECT 1");
    connection.release();
  } catch (error) {
    console.error("❌ MySQL Connection Error:", error.message);
    console.error("Host:", process.env.MYSQL_HOST);
    console.error("Database:", process.env.MYSQL_DATABASE);
    process.exit(1);
  }
};

// Graceful shutdown
const closeConnections = async () => {
  try {
    await mongoose.connection.close();
    await mysqlPool.end();
    console.log("✅ Database connections closed");
  } catch (error) {
    console.error("❌ Error closing connections:", error);
  }
};

module.exports = {
  connectMongoDB,
  connectMySQL,
  mysqlPool,
  closeConnections,
};

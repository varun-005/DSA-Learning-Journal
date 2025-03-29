const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  const maxRetries = 5;
  let currentTry = 1;

  while (currentTry <= maxRetries) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      console.log("✅ MongoDB Atlas connected successfully");
      break;
    } catch (err) {
      console.error(
        `❌ MongoDB connection attempt ${currentTry}/${maxRetries} failed:`,
        err.message
      );
      if (currentTry === maxRetries) {
        console.error("Failed to connect to MongoDB after maximum retries");
        process.exit(1);
      }
      currentTry++;
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

connectDB();

const userSchema = mongoose.Schema({
  username: String,
  name: String,
  email: String,
  password: String,
  profilepic: {
    type: String,
    default: null,
  },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
});

module.exports = mongoose.model("user", userSchema);

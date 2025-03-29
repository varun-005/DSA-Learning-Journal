const fs = require("fs");
const path = require("path");

// Create uploads directory
const uploadDir = path.join(__dirname, "..", "public", "images", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("✅ Created uploads directory");
}

// Run default image creation
require("./createDefaultImage.js");
console.log("✅ Setup completed successfully");

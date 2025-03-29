require("dotenv").config(); // Add at the very top
const express = require("express");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "shhhh";
const userModel = require("./models/user");
const postModel = require("./models/post");

const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const path = require("path");
const multer = require("multer");
const upload = require("./config/multerconfig");
const mongoose = require("mongoose");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "public", "images", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

// Update cookie settings for Render deployment
const cookieOptions = {
  httpOnly: true,
  secure: true, // Always true for Render
  sameSite: "none", // Required for cross-site deployment
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
};

// Add MongoDB connection status check middleware
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).send("Database connection is not ready");
  }
  next();
});

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/profile/upload", (req, res) => {
  res.render("profileupload");
});

app.post("/upload", isLoggedIn, upload.single("image"), async (req, res) => {
  try {
    let user = await userModel.findOne({ email: req.user.email });
    user.profilepic = req.file.filename;
    await user.save();
    res.redirect("/profile");
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).send("Error during upload");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/profile", isLoggedIn, async (req, res) => {
  try {
    let user = await userModel
      .findOne({ email: req.user.email })
      .populate("posts");

    res.render("profile", { user });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).send("Error loading profile");
  }
});

app.get("/like/:id", isLoggedIn, async (req, res) => {
  try {
    let post = await postModel.findOne({ _id: req.params.id }).populate("user");
    if (post.likes.indexOf(req.user.userid) === -1) {
      post.likes.push(req.user.userid);
    } else {
      post.likes.splice(post.likes.indexOf(req.user.userid), 1);
    }
    await post.save();
    res.redirect("/profile");
  } catch (error) {
    console.error("Like error:", error);
    res.status(500).send("Error liking post");
  }
});

app.get("/edit/:id", isLoggedIn, async (req, res) => {
  try {
    let post = await postModel.findOne({ _id: req.params.id }).populate("user");

    res.render("edit", { post });
  } catch (error) {
    console.error("Edit error:", error);
    res.status(500).send("Error loading edit page");
  }
});

app.post("/update/:id", isLoggedIn, async (req, res) => {
  try {
    let { title, content } = req.body;
    let post = await postModel.findByIdAndUpdate(
      { _id: req.params.id },
      { title, content }
    );
    res.redirect("/profile");
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).send("Error updating post");
  }
});

app.post("/post", isLoggedIn, async (req, res) => {
  try {
    let user = await userModel.findOne({ email: req.user.email });
    let { title, content, type, platform, topic, difficulty } = req.body;

    if (!title || !content) {
      return res.status(400).send("Title and content are required");
    }

    let post = await postModel.create({
      user: user._id,
      title,
      content,
      type: type || "concept",
      platform: platform || "other",
      topic: topic || "other",
      difficulty: difficulty || "medium",
      date: new Date(),
    });

    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
  } catch (error) {
    console.error("Post error:", error);
    res.status(500).send("Error creating post");
  }
});

app.get("/toggle-task/:id", isLoggedIn, async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id);
    if (!post || !post.isTask) {
      return res.status(400).send("Invalid task");
    }
    post.taskStatus = post.taskStatus === "completed" ? "pending" : "completed";
    await post.save();
    res.redirect("/profile");
  } catch (error) {
    console.error("Task toggle error:", error);
    res.status(500).send("Error updating task");
  }
});

app.post("/register", async (req, res) => {
  try {
    let { email, password, username, name } = req.body;

    if (!email || !password || !username || !name) {
      return res.render("index", { error: "All fields are required" });
    }

    // Check both email and username
    let existingUser = await userModel.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      // Redirect back to registration with error
      return res.render("index", {
        error:
          existingUser.email === email
            ? "Email already registered"
            : "Username already taken",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    await userModel.create({
      username,
      email,
      name,
      password: hash,
    });

    // Redirect to login with success message
    res.render("login", { message: "Registration successful! Please login." });
  } catch (error) {
    console.error("Registration error:", error);
    res.render("index", { error: "Error during registration" });
  }
});

app.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send("Email and password are required");
    }

    let user = await userModel.findOne({ email });
    if (!user) return res.status(401).send("Invalid credentials");

    const match = await bcrypt.compare(password, user.password);
    if (match) {
      let token = jwt.sign({ email: email, userid: user._id }, JWT_SECRET);
      res.cookie("token", token, cookieOptions);
      res.redirect("/profile");
    } else {
      res.status(401).send("Invalid credentials");
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send("Error during login: " + error.message);
  }
});

app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/login");
});

function isLoggedIn(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect("/login");

  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.redirect("/login");
  }
}

// Add delete route
app.get("/delete/:id", isLoggedIn, async (req, res) => {
  try {
    // Delete post and remove from user's posts array
    let user = await userModel.findOne({ email: req.user.email });
    await postModel.findByIdAndDelete(req.params.id);
    user.posts = user.posts.filter(
      (postId) => postId.toString() !== req.params.id
    );
    await user.save();
    res.redirect("/profile");
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).send("Error deleting post");
  }
});

// Update error handling middleware
app.use((err, req, res, next) => {
  console.error("Application error:", err);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

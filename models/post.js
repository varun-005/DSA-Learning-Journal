const mongoose = require("mongoose");

const noteSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["concept", "code", "mistake", "solution"],
    default: "concept",
  },
  topic: {
    type: String,
    enum: [
      "arrays",
      "strings",
      "linkedlist",
      "trees",
      "recursion",
      "dp",
      "other",
    ],
    default: "other",
  },
  platform: {
    type: String,
    enum: ["leetcode", "gfg", "hackerrank", "codechef", "codeforces", "other"],
    default: "other",
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium",
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

// Add formatted datetime virtual
noteSchema.virtual("formattedDate").get(function () {
  return this.date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
});

// Enable virtuals
noteSchema.set("toJSON", { virtuals: true });
noteSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("post", noteSchema);

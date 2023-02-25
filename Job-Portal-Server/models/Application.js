const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;
const valid = require("validator");

// schema design
const applicationSchema = mongoose.Schema(
  {
    job: {
      type: ObjectId,
      ref: "Job",
      required: true,
    },
    applicant: {
      type: ObjectId,
      ref: "User",
      required: true
    },
    resume: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;

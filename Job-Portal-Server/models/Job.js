const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;
const valid = require("validator");

// schema design
const jobSchema = mongoose.Schema(
  {
    jobTitle: {
      type: String,
      required: [true, "Please provide a title for this job."],
      trim: true,
      // unique: [true, "Title must be unique"],
      lowercase: true,
      minLength: [3, "Title must be at least 3 characters."],
      maxLenght: [100, "Title is too large"],
    },
    jobPosition: {
      type: String,
      required: [true, "Please provide a position for this job."],
      trim: true,
      // unique: [true, "Position must be unique"],
      lowercase: true,
      minLength: [3, "Name must be at least 3 characters."],
      maxLenght: [100, "Name is too large"],
    },
    salary: {
      type: Number,
      required: true,
      min: [0, "Salary must be greater than or equal to zero"],
    },
    jobNature: {
      type: String,
      required: [true, "Please provide the nature of the job."],
      enum: ["remote", "onsite"],
    },
    companyInfo: {
      type: ObjectId,
      ref: "Company",
      required: true,
    },
    jobDescription: {
      type: String,
      required: true,
    },
    applications: [
      {
        type: ObjectId,
        ref: "Application",
      },
    ],
    deadline: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);



const Job = mongoose.model("Job", jobSchema);

module.exports = Job;

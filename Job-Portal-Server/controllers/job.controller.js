const Company = require("../models/Company");
const Application = require("../models/Application");
const googleDriveService = require("../middleware/googleDriveService");
const Job = require("../models/Job");
const User = require("../models/User");
const {
  createJobService,
  updateJobService,
  getAllJobsService,
  getJobByIdService,
  applyJobService,
  getHighestPaidJobsService,
  getMostAppliedJobsService
} = require("../services/job.service");

exports.createJob = async (req, res, next) => {
  try {
    //check user token to find manager's company id. if it doesnt match with req.body.companyInfo then return
    const { email } = req.user;
    const manager = await User.findOne({ email });
    //get the company in which this manager is assigned
    const company = await Company.findOne({ managerName: manager._id });

    const { companyInfo } = req.body;
    if (company._id.toString() !== companyInfo.toString()) {
      return res.status(400).json({
        status: "fail",
        message: "You are not authorized to create job for this company",
      });
    }

    // deadline must be atleast 1 day from now otherwise return
    //deadline formate 2022-01-01
    const { deadline } = req.body;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    if (deadlineDate < today) {
      return res.status(400).json({
        status: "fail",
        message: "Deadline must be atleast 1 day from now",
      });
    }

    // save or create

    const result = await createJobService(req.body);

    res.status(200).json({
      status: "success",
      message: "Job created successfully!",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: " Data is not inserted ",
      error: error.message,
    });
  }
};

exports.getJobsByManagerToken = async (req, res) => {
  try {
    const { email } = req.user;
    //get user by this email from User model
    const user = await User.findOne({ email }).select(
      "-password -__v -createdAt -updatedAt -role -status -appliedJobs"
    );
    //get company by this user from Company model inside managerName field
    const company = await Company.findOne({ managerName: user._id });

    //get all jobs
    const jobs = await Job.find({}).select("-applications").populate({
      path: "companyInfo",
      select: "-jobPosts",
    });
    //find the jobs by company id
    const jobsByCompany = jobs.filter((job) => {
      return job.companyInfo._id.toString() == company._id.toString();
    });

    res.status(200).json({
      status: "success",
      data: {
        managerInfo: user,
        jobs: jobsByCompany,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: "can't get the data",
      error: error.message,
    });
  }
};

exports.getJobByManagerTokenJobId = async (req, res) => {
  try {
    const { email } = req.user;
    //get user by this email from User model
    const user = await User.findOne({ email }).select(
      "-password -__v -createdAt -updatedAt -role -status -appliedJobs"
    );
    //get company by this user from Company model inside managerName field
    const company = await Company.findOne({ managerName: user._id });

    //get all jobs
    const jobs = await Job.find({})
      .populate({
        path: "companyInfo",
        select: "-jobPosts",
      })
      .populate({
        path: "applications",
        populate: {
          path: "applicant",
          select:
            "-password -__v -createdAt -updatedAt -role -status -appliedJobs",
        },
        select: "-job",
      })
      .populate({
        path: "companyInfo",
        select: "-jobPosts",
        populate: {
          path: "managerName",
          select:
            "-password -__v -createdAt -updatedAt -role -status -appliedJobs",
        },
      });

    //find the required job from jobs  with req.params id
    const { id } = req.params;
    const job = jobs.find((job) => {
      return job._id.toString() == id.toString();
    });

    //check if managerName.email is equal to req.user.email
    if (req.user.email !== job.companyInfo.managerName.email) {
      return res.status(400).json({
        status: "fail",
        message: "You are not authorized to get internal data of this job",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        job,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: "can't get the data",
      error: error.message,
    });
  }
};

exports.updateJob = async (req, res) => {
  //check user token to find manager's company id. if it doesnt match with req.body.companyInfo then return
  try {
    const { email } = req.user;
    const manager = await User.findOne({ email });
    //get the company in which this manager is assigned
    const company = await Company.findOne({
      managerName: manager._id,
    }).populate({
      path: "jobPosts",
    });

    //get the id of the job from jobPosts array of that company that matches the req.params is
    const job = company.jobPosts.find(
      (job) => job._id.toString() == req.params.id.toString()
    );

    if (!job) {
      return res.status(400).json({
        status: "fail",
        message: "You are not authorized to update this job",
      });
    }

    // if job id doesnt match the id of req.params then return
    // if(job._id != req.params.id){
    //   return res.status(400).json({
    //     status: "fail",
    //     message: "You are not authorized to update this job",
    //   });
    // }

    const { id } = req.params;
    const result = await updateJobService(id, req.body);

    res.status(200).json({
      status: "success",
      message: "Job updated successfully!",
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: " Data is not updated ",
      error: error.message,
    });
  }
};

exports.getAllJobs = async (req, res) => {
  try {
    //{price:{$ gt:50}
    //{ price: { gt: '50' } }

    let filters = { ...req.query };

    //sort , page , limit -> exclude
    const excludeFields = ["sort", "page", "limit"];
    excludeFields.forEach((field) => delete filters[field]);

    //gt ,lt ,gte .lte
    let filtersString = JSON.stringify(filters);
    filtersString = filtersString.replace(
      /\b(gt|gte|lt|lte|ne|eq)\b/g,
      (match) => `$${match}`
    );

    filters = JSON.parse(filtersString);

    const queries = {};

    if (req.query.sort) {
      // price,qunatity   -> 'price quantity'
      const sortBy = req.query.sort.split(",").join(" ");
      queries.sortBy = sortBy;
    }

    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      queries.fields = fields;
    }

    if (req.query.page) {
      const { page = 1, limit = 10 } = req.query; // "3" "10"

      const skip = (page - 1) * parseInt(limit);
      queries.skip = skip;
      queries.limit = parseInt(limit);
    }

    const jobs = await getAllJobsService(filters, queries);

    res.status(200).json({
      status: "success",
      data: jobs,
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: "can't get the data",
      error: error.message,
    });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await getJobByIdService(id);

    res.status(200).json({
      status: "success",
      data: job,
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: "can't get the data",
      error: error.message,
    });
  }
};

exports.applyJob = async (req, res) => {
  try {
    const { email } = req.user;
    const user = await User.findOne({ email }).select(
      "-password -__v -createdAt -updatedAt -role -status -appliedJobs"
    );

    const { id } = req.params;

    const job = await Job.findById(id);

    if (!job) {
      return res.status(400).json({
        status: "fail",
        message: "Job not found",
      });
    }

    //check if application date is less or equal to deadline date
    const today = new Date();
    const deadline = new Date(job.deadline);
    if (today > deadline) {
      return res.status(400).json({
        status: "fail",
        message: "Application deadline is over. try next time",
      });
    }

    //check if user has already applied for this job
    // get all the applications that have been applied for this job and find if the user has already applied
    const applications = await Application.find({ job: job._id });
    const isApplied = applications.find(
      (application) =>
        application.applicant._id.toString() == user._id.toString()
    );

    if (isApplied) {
      return res.status(400).json({
        status: "fail",
        message: "You have already applied for this job",
      });
    }

    if (!req.file) {
      res.status(400).json({
        status: "fail",
        message: "Please upload your resume",
      });
      return;
    }

    const auth = googleDriveService.authenticateGoogle();
    const resume = await googleDriveService.uploadToGoogleDrive(req.file, auth);
    googleDriveService.deleteFile(req.file.path);

    const resumeLink = `https://drive.google.com/file/d/${resume.data.id}/view`;

    const result = await applyJobService(id, user._id, resumeLink);

    res.status(200).json({
      status: "success",
      message: "Job applied successfully!",
      result: {
        data: result,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: "can't get the data",
      error: error.message,
    });
  }
};

exports.getHighestPaidJobs = async (req, res) => {
  try {
    const jobs = await getHighestPaidJobsService();

    res.status(200).json({
      status: "success",
      data: jobs,
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: "can't get the data",
      error: error.message,
    });
  }
};

exports.getMostAppliedJobs = async (req, res) => {
  try {
    const jobs = await getMostAppliedJobsService();

    res.status(200).json({
      status: "success",
      data: jobs,
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: "can't get the data",
      error: error.message,
    });
  }
};
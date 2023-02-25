const { findOne } = require("../models/Company");
const {
  signupService,
  findUserByEmail,
  findUserByToken,
  findUserById,
  allCandidatesService,
  allHiringManagersService,
  candidateByIdService,
} = require("../services/user.service");
const { sendMailWithGmail } = require("../utils/email");
const { generateToken } = require("../utils/token");

exports.signup = async (req, res) => {
  try {
    if (req.body.role === "Admin") {
      return res.status(403).json({
        status: "fail",
        error:
          "You are not allowed to create admin account. Please contact the admin",
      });
    }
    if (req.body.role === "Hiring-Manager") {
      return res.status(403).json({
        status: "fail",
        error:
          "You are not allowed to create hiring manager account. Please contact the admin",
      });
    }

    if (req.body.status === "active") {
      return res.status(403).json({
        status: "fail",
        error:
          "Please don't provide status. It will be automatically set to inactive. You will be able to activate your account by clicking the link sent to your email",
      });
    }

    if (req.body.status === "blocked") {
      return res.status(403).json({
        status: "fail",
        error: "You cannot create a blocked account.",
      });
    }

    const user = await signupService(req.body);

    const token = user.generateConfirmationToken();

    await user.save({ validateBeforeSave: false });

    const mailData = {
      to: [user.email],
      subject: "Verify your Account",
      text: `Thank you for creating your account. Please confirm your account here: ${
        req.protocol
      }://${req.get("host")}${req.originalUrl}/confirmation/${token}`,
    };

    await sendMailWithGmail(mailData);

    res.status(200).json({
      status: "success",
      message: "Successfully signed up",
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      error,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(401).json({
        status: "fail",
        error: "Please provide your credentials",
      });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        status: "fail",
        error: "No user found. Please create an account",
      });
    }

    const isPasswordValid = user.comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(403).json({
        status: "fail",
        error: "Password is not correct",
      });
    }

    if (user.status != "active") {
      return res.status(401).json({
        status: "fail",
        error: "Your account is not active yet.",
      });
    }

    const { password: pwd, ...others } = user.toObject();
    const token = generateToken(others);

    res.status(200).json({
      status: "success",
      message: "Successfully logged in",
      data: {
        user: others,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      error,
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await findUserByEmail(req.user?.email);

    res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      error,
    });
  }
};

exports.confirmEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await findUserByToken(token);

    if (!user) {
      return res.status(403).json({
        status: "fail",
        error: "Invalid token",
      });
    }

    const expired = new Date() > new Date(user.confirmationTokenExpires);

    if (expired) {
      return res.status(401).json({
        status: "fail",
        error: "Token expired",
      });
    }

    user.status = "active";
    user.confirmationToken = undefined;
    user.confirmationTokenExpires = undefined;

    user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: "success",
      message: "Successfully activated your account.",
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      error,
    });
  }
};

exports.promoteUserRole = async (req, res) => { 
  try {
    const { id } = req.params;

    const user = await findUserById(id);

    if (!user) {
      return res.status(404).json({
        status: "fail",
        error: "No user found",
      });
    }

    if(req.user.email === user.email){
      return res.status(403).json({
        status: "fail",
        error: "You cannot demote yourself to Candidate / Hiring-Manager",
      });
    } 

    if (req.body.role === "Admin" && user.role === "Admin") {
      return res.status(403).json({
        status: "fail",
        error: "User is already an admin",
      });
    }

    if (req.body.role === "Hiring-Manager" && user.role === "Hiring-Manager") {
      return res.status(403).json({
        status: "fail",
        error: "User is already a hiring manager",
      });
    }

    if (req.body.role === "Candidate" && user.role === "Candidate") {
      return res.status(403).json({
        status: "fail",
        error: "User is already a candidate",
      });
    }

    if (req.body.role === "Admin" || req.body.role === "Hiring-Manager" || req.body.role === "Candidate") {
      user.role = req.body.role;

      await user.save({ validateBeforeSave: false });

      res.status(200).json({
        status: "success",
        message: `Successfully promoted user to ${req.body.role}`,
      });
    }else{
      res.status(403).json({
        status: "fail",
        error:`You are not allowed to promote user to ${req.body.role}. Possible roles are Admin, Hiring-Manager & Candidate`,
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "fail",
      error,
    });
  }
};

exports.getCandidates = async (req, res) => {
  try {
    const candidates = await allCandidatesService();

    res.status(200).json({
      status: "success",
      data: candidates,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      error,
    });
  }
}

exports.getCandidateById = async (req, res) => {
  try {
    const { id } = req.params;

    const candidate = await candidateByIdService(id);

    if (!candidate) {
      return res.status(404).json({
        status: "fail",
        error: "No candidate found",
      });
    }

    res.status(200).json({
      status: "success",
      data: candidate,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      error,
    });
  }
}

exports.getManagers = async (req, res) => {
  try {
    const hiringManagers = await allHiringManagersService();

    res.status(200).json({
      status: "success",
      data: hiringManagers,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      error,
    });
  }
};
const express = require("express");
const router = express.Router();
// const companyController = require("../controllers/company.controller");
// const authorization = require("../middleware/authorization");
// const verifyToken = require("../middleware/verifyToken");

router
  .route("/")
//   .get(companyController.getCompanies)
//   .post(
//     verifyToken,
//     authorization("Admin", "Hiring-Manager"),
//     companyController.createCompany
//   );

// router.route("/:id").get(companyController.getCompanyById);

module.exports = router;

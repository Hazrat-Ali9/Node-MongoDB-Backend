const {
    createCompanyService,
    getCompanyByIdService,
    getCompaniesService,
  } = require("../services/company.service");
  
  exports.getCompanies = async (req, res, next) => {
    try {
      let filters = { ...req.query };
      const excludeFields = ["sort", "page", "limit"];
      excludeFields.forEach((field) => delete filters[field]);
  
      //gt ,lt ,gte .lte
      let filtersString = JSON.stringify(filters);
      filtersString = filtersString.replace(
        /\b(gt|gte|lt|lte)\b/g,
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
        const { page = 1, limit = 10 } = req.query;
  
        const skip = (page - 1) * parseInt(limit);
        queries.skip = skip;
        queries.limit = parseInt(limit);
      }
  
      const stocks = await getCompaniesService(filters, queries);
  
      res.status(200).json({
        status: "success",
        data: stocks,
      });
    } catch (error) {
      res.status(400).json({
        status: "fail",
        message: "can't get the data",
        error: error.message,
      });
    }
  };
  
  exports.getCompanyById = async (req, res) => {
    try {
      const { id } = req.params;
      let company = await getCompanyByIdService(id);
  
      if (!company) {
        return res.status(400).json({
          status: "fail",
          error: "can't get the stock with this id",
        });
      }
      res.status(400).json({
        status: "success",
        data: company,
      });
    } catch (error) {
      res.status(400).json({
        status: "fail",
        message: "can't get the company with this id",
        error: error.message,
      });
    }
  };
  
  exports.createCompany = async (req, res, next) => {
    try {
      // save or create
  
      const result = await createCompanyService(req.body);
  
      res.status(200).json({
        status: "success",
        messgae: "Company created successfully!",
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
  
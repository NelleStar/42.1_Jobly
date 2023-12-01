"use strict";

/** Routes for companies. */

// require/import jsonschema, express, badRequest from expressError file, ensureLoggedIn from middleware file, Company model from the models folder, 2 schemas from our schema folder, and expressRouter
const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");

const router = new express.Router();

// POST / { company } =>  { company } - company should be { handle, name, description, numEmployees, logoUrl }  -Returns { handle, name, description, numEmployees, logoUrl } * Authorization required: login 
router.post("/", ensureLoggedIn, async function (req, res, next) {
  try {
    // check the request body to validate and set to variable validator
    const validator = jsonschema.validate(req.body, companyNewSchema);
    // if the variable is not valid - map the errors as a stack and throw them using the expresserror we imported
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    // set the variable company to an await to the Company model that we imported using the req body - return the response with a 201 status and a company object
    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  } catch (err) {
    // if there is an issue above - return next error
    return next(err);
  }
});

// GET /  => { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] } Can filter on provided search filters: - minEmployees - maxEmployees - nameLike (will find case-insensitive, partial matches) Authorization required: none 
router.get("/", async function (req, res, next) {
  try {
    let companies;
    const { minEmployees, maxEmployees, nameLike } = req.query;

    // Check if any filtering criteria are provided
    if (minEmployees || maxEmployees || nameLike) {
      const criteria = {};

      if (minEmployees !== undefined) {
        criteria.minEmployees = parseInt(minEmployees, 10);
      }
      if (maxEmployees !== undefined) {
        criteria.maxEmployees = parseInt(maxEmployees, 10);
      }
      if (nameLike) {
        criteria.name = nameLike;
      }

      // Call filterCompanies method with the criteria collected
      companies = await Company.filterCompanies(criteria);
    } else {
      // If no criteria given, retrieve all companies
      companies = await Company.findAll();
    }

    return res.json({ companies });
  } catch (err) {
    // if there is an issue above - return next error
    return next(err);
  }
});



// GET /[handle] => { company } Company is { handle, name, description, numEmployees, logoUrl, jobs } where jobs is [{ id, title, salary, equity }, ...] Authorization required: none 
router.get("/:handle", async function (req, res, next) {
  try {
    const company = await Company.get(req.params.handle);
    return res.json({ company });
  } catch (err) {
    // if there is an issue above - return next error
    return next(err);
  }
});

// PATCH /[handle] { fld1, fld2, ... } => { company } Patches company data. fields can be: { name, description, numEmployees, logo_url } Returns { handle, name, description, numEmployees, logo_url } Authorization required: login 
router.patch("/:handle", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.update(req.params.handle, req.body);
    return res.json({ company });
  } catch (err) {
    // if there is an issue above - return next error
    return next(err);
  }
});

// DELETE /[handle]  =>  { deleted: handle } Authorization: login 
router.delete("/:handle", ensureLoggedIn, async function (req, res, next) {
  try {
    await Company.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  } catch (err) {
    // if there is an issue above - return next error
    return next(err);
  }
});


module.exports = router;

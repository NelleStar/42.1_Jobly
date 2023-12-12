"use strict";

/** Routes for jobs */

// require/import jsonschema, express, badRequest from expressError file, ensureLoggedIn from middleware file, Company model from the models folder, 2 schemas from our schema folder, and expressRouter
const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

// POST '/' : {job} instance obj should be {id, title, salary, equity, companyHandle} --- return the obj --- authorization required: login with admin
router.post("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);

        if(!validator.valid){
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    } catch(err) {
        return next(err)
    };
});

// GET '/' : [{job}, {job},...] where each instance obj has {id, title, salary, equity, companyHandle} --- authorization required: NONE
// STEP 4.2 // Can filter on provided search filter - title, salary, equity (case insenseitive)
router.get("/", async function (req, res, next) {
    try {
        let jobs;
        const { title, salary, equity } = req.query;

        if( title || salary || equity ) {
            const criteria = {};

            if(salary !== undefined) {
                criteria.salary = parseFloat(salary);
            }

            if(equity !== undefined) {
                criteria.equity = parseFloat(equity);
            }

            if (title) {
              criteria.title = { $ilike: `%${String(title).toLowerCase()}%` };
            }

            // console.log(title ,salary, equity)
            jobs = await Job.filterJobs(criteria);
        } else {
            jobs = await Job.findAll();
        }

        return res.json( { jobs } )
    } catch(err) {
        return next(err)
    };
});

// GET '/:id' : { job } instance obj where returns { id, title, salary, equity, companyHandle } --- authorization required: none
router.get("/:id", async function (req, res, next) {
    try {
        const job = await Job.get(req.params.id);
        // console.log(job)
        return res.json( { job } ); 
    } catch(err) {
        return next(err);
    };
})

// PATCH '/:id' : updates instance of Job - fields to update include { title, salary, equity } and returns { id, title, salary, equity, companyHandle } --- Authorization required: Login and Admin
router.patch("/:id", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if(!validator.valid){
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const job = await Job.update(req.params.id, req.body);
        return res.json({job});

    } catch(err) {
        return next(err);
    };
})

// DELETE '/:id' should return {deleted: :id} --- Authorization: login and Admin
router.delete("/:id", ensureLoggedIn, ensureAdmin, async function(req, res, next) {
    try {
        await Job.remove(req.params.id);
        return res.json({ deleted: req.params.id });
    } catch(err) {
        return next(err);
    };
})

module.exports = router;
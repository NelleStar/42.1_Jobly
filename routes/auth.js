"use strict";

/** Routes for authentication. */

const jsonschema = require("jsonschema");

const User = require("../models/user");
const express = require("express");
const router = new express.Router();
const { createToken } = require("../helpers/tokens");
const userAuthSchema = require("../schemas/userAuth.json");
const userRegisterSchema = require("../schemas/userRegister.json");
const { BadRequestError } = require("../expressError");

// POST /auth/token:  { username, password } => { token } Returns JWT token which can be used to authenticate further requests.  Authorization required: none
router.post("/token", async function (req, res, next) {
  try {
    // set variable validator to the userAuth.json schema and reqest body info making sure we have the needed info
    const validator = jsonschema.validate(req.body, userAuthSchema);
    // if the validator is not valid throw the errors as a stack using the imported expressError
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    //if the validator has required properties set username and password to variables of the same name, send an await request of the User model and method authenticate using the req body information and set it to variable user, then create a varaiable token using the imported method from helpers and the user instance and return said token
    const { username, password } = req.body;
    const user = await User.authenticate(username, password);
    const token = createToken(user);
    return res.json({ token });

    // if there is an issue - throw an error
  } catch (err) {
    return next(err);
  }
});


// POST /auth/register: { user } => { token } user must include { username, password, firstName, lastName, email } Returns JWT token which can be used to authenticate further requests. Authorization required: none 
router.post("/register", async function (req, res, next) {
  try {
    // set a variable validator to the request body and the userRegister schema info to make sure we have the needed info
    const validator = jsonschema.validate(req.body, userRegisterSchema);
    // if the validator is not valid throw the errors as a stack using the imported expressError
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    // create a newUser instance using an await call to the User model and the register method collecting the information from the request body needed - then create a new token variable using the createToken and newUser instance  and return a 201 status and the token
    const newUser = await User.register({ ...req.body });
    const token = createToken(newUser);
    return res.status(201).json({ token });

    // if there is an issue - throw an error
  } catch (err) {
    return next(err);
  }
});

// export for use in other files within the app
module.exports = router;

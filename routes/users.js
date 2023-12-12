"use strict";

/** Routes for users. */
// require/import jsonschema, express, middleware, expressError, User model, createToken from helps, newUser and updateuser schemas and express Router
const jsonschema = require("jsonschema");
const express = require("express");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");
const router = express.Router();

// POST /users/:username/jobs/:id*** that allows that user to apply for a job (or an admin to do it for them). That route should return JSON like: `{ applied: jobId }`
router.post('/:username/jobs/:id', async (req, res, next) => {
  const {username, id} = req.params;

  try {
    // save the username to a var for easy access, if no user with that username sent error
    const user = await User.get(username);
    if(!user) {
      return res.status(404).json({ error: `User ${username} not found` });
    }

    // use the apply method made in the User model
    await User.applyForJob(username, parseInt(id));

    // return success
    return res.status(200).json({ applied: parseInt(id) });
  } catch(err) {
    return next(err)
  }
})

//POST / { user }  => { user, token } Adds a new user. This is not the registration endpoint --- instead, this is only for admin users to add new users. The new user being added can be an admin. * This returns the newly created user and an authentication token for them: {user: { username, firstName, lastName, email, isAdmin }, token } * Authorization required: login
router.post("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});

//GET / => { users: [ {username, firstName, lastName, email }, ... ] } Returns list of all users. * Authorization required: login 
router.get("/", ensureLoggedIn, ensureAdmin, async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});


// GET /[username] => { user } Returns { username, firstName, lastName, isAdmin } * Authorization required: login 
router.get("/:username", ensureLoggedIn, async function (req, res, next) {
  try {
    // Extract the username of the requesting user
    const requestedUsername = req.params.username;
    const requestingUser = res.locals.user.username;

    // Check if the requesting user is an admin or if it's the same as the requested user
    if (requestingUser !== requestedUsername && !res.locals.user.isAdmin) {
      throw new ForbiddenError(
        "Unauthorized to access this user's information"
      );
    }
    const user = await User.get(requestedUsername);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


//PATCH /[username] { user } => { user } Data can include: { firstName, lastName, password, email } Returns { username, firstName, lastName, email, isAdmin } * Authorization required: login
router.patch("/:username", ensureLoggedIn, async function (req, res, next) {
  try {
    // Extract the username of the requesting user
    const requestedUsername = req.params.username;
    const requestingUser = res.locals.user.username;
    const userData = req.body;

    // Check if the requesting user is an admin or if it's the same as the requested user
    if (requestingUser !== requestedUsername && !res.locals.user.isAdmin) {
      throw new ForbiddenError(
        "Unauthorized to update this user's information"
      );
    }
    const user = await User.update(requestedUsername, userData);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


//DELETE /[username]  =>  { deleted: username } * Authorization required: login
router.delete("/:username", ensureLoggedIn, async function (req, res, next) {
  try {
    // Extract the username of the requesting user
    const requestedUsername = req.params.username;
    const requestingUser = res.locals.user.username;

    // Check if the requesting user is an admin or if it's the same as the requested user
    if (requestingUser !== requestedUsername && !res.locals.user.isAdmin) {
      throw new ForbiddenError("Unauthorized to delete this user");
    }
    await User.remove(requestedUsername);
    return res.json({ deleted: requestedUsername });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;

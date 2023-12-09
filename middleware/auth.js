"use strict";

// import/require jsonwebtoken, SECRET_KEY from our config file and UnauthorizedError from our expressError file
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


// Middleware: Authenticate user. If a token was provided, verify it, and, if valid, store the token payload on res.locals (this will include the username and isAdmin field.) It's not an error if no token was provided or if the token is not valid. 
function authenticateJWT(req, res, next) {
  try {
    // check if there is an auth req in header
    const authHeader = req.headers && req.headers.authorization;
    // if there is - extract the Bearer token from the header and verify ot using jwt.verfy() and our SECRET KEY - if valid store the username and isAdmin in res.locals.user
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    // continue to next middleware regardless of token
    return next();

    // but if there was any issue above we are going to catch and throw an error
  } catch (err) {
    return next();
  }
}

// Middleware to use when they must be logged in. If not, raises Unauthorized. 
function ensureLoggedIn(req, res, next) {
  try {
    // if there is NOT a res.locals.user token we throw a new UnauthorizedError and return the next middleware function
    if (!res.locals.user) throw new UnauthorizedError();
    return next();

    // but if we hit an error in the try - we will just return next error
  } catch (err) {
    return next(err);
  }
}

// Middleware to use when they must be an admin. If not, raises Forbidden.
function ensureAdmin(req, res, next) {
  try {
    // Check if the user is logged in and has an isAdmin field in the token payload
    if (!res.locals.user || !res.locals.user.isAdmin) {
      // If not an admin, throw a new UnauthorizedError
      throw new UnauthorizedError("Admin access required");
    }
    // If admin, proceed to the next middleware or route handler
    return next();

  } catch (err) {
    return next(err);
  }
}

// export both middleware functions for use in other files
module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
};

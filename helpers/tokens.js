// import/require jsonwebtoken and the secret key from the config file
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

/** return signed JWT from user data. */
function createToken(user) {
  // user object is expected as argument - checks if isAdmin property exists within the user object 
  console.assert(user.isAdmin !== undefined,
      "createToken passed user without isAdmin property");

  // construct payload for JWT with username and isAdmin from the user object - default to false if isAdmin is not present
  let payload = {
    username: user.username,
    isAdmin: user.isAdmin || false,
  };

  // .sign() method to create a signed JWT using the payload we set up right above and the SECRET_KEY
  return jwt.sign(payload, SECRET_KEY);
}

// export for use in other files
module.exports = { createToken };

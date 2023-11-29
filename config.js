"use strict";

require("dotenv").config();
require("colors");


const dbUsername = process.env.PGUSER;
const dbPassword = process.env.PGPASSWORD;
const dbName = "jobly"; // Modify the database name accordingly

console.log("PGUSER:", process.env.PGUSER);
console.log("PGPASSWORD:", process.env.PGPASSWORD);

function getDatabaseUri() {
  return process.env.NODE_ENV === "test"
    ? `postgresql://${dbUsername}:${dbPassword}@localhost:5432/${dbName}_test`
    : `postgresql://${dbUsername}:${dbPassword}@localhost:5432/${dbName}`;
}

const SECRET_KEY = process.env.SECRET_KEY || "secret-dev";
const PORT = +process.env.PORT || 3001;
// Speed up bcrypt during tests, since the algorithm safety isn't being tested WJB: Evaluate in 2021 if this should be increased to 13 for non-test use
const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 12;

console.log("Jobly Config:".green);
console.log("SECRET_KEY:".yellow, SECRET_KEY);
console.log("PORT:".yellow, PORT.toString());
console.log("BCRYPT_WORK_FACTOR".yellow, BCRYPT_WORK_FACTOR);
console.log("Database:".yellow, getDatabaseUri());
console.log("---");

module.exports = {
  SECRET_KEY,
  PORT,
  BCRYPT_WORK_FACTOR,
  getDatabaseUri,
};

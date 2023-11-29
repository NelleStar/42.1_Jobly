// common test functions that will be imported into each test file to reduce duplication
// require/import bcrypt, our database, and the work factor from the config file
const bcrypt = require("bcrypt");
const db = require("../db.js");
const { SECRET_KEY, PORT, BCRYPT_WORK_FACTOR, getDatabaseUri } = require("../config");


async function commonBeforeAll() {
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM companies");
  // noinspection SqlWithoutWhere
  await db.query("DELETE FROM users");

  await db.query(`
    INSERT INTO companies(handle, name, num_employees, description, logo_url)
    VALUES ('c1', 'C1', 1, 'Desc1', 'http://c1.img'),
           ('c2', 'C2', 2, 'Desc2', 'http://c2.img'),
           ('c3', 'C3', 3, 'Desc3', 'http://c3.img')`);

  await db.query(`
        INSERT INTO users(username,
                          password,
                          first_name,
                          last_name,
                          email)
        VALUES ('u1', $1, 'U1F', 'U1L', 'u1@email.com'),
               ('u2', $2, 'U2F', 'U2L', 'u2@email.com')
        RETURNING username`,
      [
        await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
        await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
      ]);
}

// SQL command that starts a new transaction and held within the transaction block until explicitly commited
async function commonBeforeEach() {
  await db.query("BEGIN");
}

// SQL command used to undo or discard changes made that are not committed
async function commonAfterEach() {
  await db.query("ROLLBACK");
}

// closes the db connection down to prevent potential resource leaks
async function commonAfterAll() {
  await db.end();
}

//export these functions for use in specific models test files.
module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
};
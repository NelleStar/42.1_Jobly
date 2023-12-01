"use strict";

// require our jobly db,  2 functions from our expressError file, and a function from helpers.sql
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

// Related functions for companies put into a model
class Company {

  // Create a company (from data), update db, return new company data. Data should be { handle, name, description, numEmployees, logoUrl } Returns an instance object { handle, name, description, numEmployees, logoUrl } Throws BadRequestError if company already in database. 
  static async create({ handle, name, description, numEmployees, logoUrl }) {
    // first check to see if the company already has this handle in db using sql command - if there is a duplicate throw new error with the handle
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    // make a result variable where we insert the company information into our companies table in this specific order to ensure values go into correct columns
    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );

    // create the company variable based on the result row we just created and return the new company instance
    const company = result.rows[0];
    return company;
  }

  // Find all companies. Returns an array of objects [{ handle, name, description, numEmployees, logoUrl }, ...] 
  static async findAll() {
    // create a companiesResults variable with a sql command that returns all rows obtained from the DB
    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`);
    return companiesRes.rows;
  }

  // Adding a feature to filter companies based on certain criteria
  static async filterCompanies(criteria) {
    // First set up some variables - name, minEmployees, maxEmployees are all set equal to criteria given - whereClause will be set to an empty string and values is set to an empty array to gather the updated criteria
    const { name, minEmployees, maxEmployees } = criteria;
    let whereClause = "";
    const values = [];

    // check that min is less than max
    if (
      minEmployees !== undefined 
      && maxEmployees !== undefined 
      && minEmployees > maxEmployees) {
      throw new BadRequestError(
        "Minimum Employees must be smaller than Max Employees",
        400
      );
    }

    // if a company name is provided start to build WHERE clause - make the name lowercase to match the db - use LIKE for pattern matching - use '%...%' for wildcard pattern matches - a placeholder that will be replaced
    if (name) {
      whereClause += `LOWER(name) LIKE '%' || $${values.length + 1} || '%' `;
      // push the name to the values array in lowercase
      values.push(name.toLowerCase());
    }

    // if min or max employees were given make a scenario up for that 
    if (minEmployees !== undefined) {
      // if already have a whereClause - add onto it using AND
      if (whereClause) whereClause += " AND ";
      // either start or append to the clause using a placeholder of $${values.length + 1} that will get replaced by the actual minEmployees value
      whereClause += `num_employees >= $${values.length + 1}`;
      // and push the minEmployees into values array
      values.push(minEmployees);
    }

    if (maxEmployees !== undefined) {
      // if already a whereClause - add onto it using AND
      if (whereClause) whereClause += " AND ";
      // either start or append to the clause using a placeholder of $${values.length + 1} that will get replaced by the actual maxEmployees value
      whereClause += `num_employees <= $${values.length + 1}`;
      // and push the minEmployees into values array
      values.push(maxEmployees);
    }

    // Now that criteria has been handled - construct the query to filter the companies
    const query = `
      SELECT handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"
      FROM companies
      ${whereClause ? `WHERE ${whereClause}` : ""}
      ORDER BY name`;

    // Execute the query with the constructed WHERE clause and return the filtered companies
    const filteredCompanies = await db.query(query, values);
    return filteredCompanies.rows;
  }

  // Given a company handle, return data about company. Returns an object { handle, name, description, numEmployees, logoUrl, jobs } where jobs is an array of objects [{ id, title, salary, equity, companyHandle }, ...] Throws NotFoundError if not found.
  static async get(handle) {
    // create a company result variable using a sql command inserting the given handle
    const companyRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);

    // take the result and set it to the company variable - If the company was not found throw an error else return the company
    const company = companyRes.rows[0];
    if (!company) throw new NotFoundError(`No company: ${handle}`);
    return company;
  }

  //Update company data with `data`. This is a "partial update" --- it's fine if data doesn't contain all the fields; this only changes provided ones. Data can include: {name, description, numEmployees, logoUrl} Returns object {handle, name, description, numEmployees, logoUrl} Throws NotFoundError if not found.
  static async update(handle, data) {
    // using sqlForPartialUpdate from helpers/sql.js which takes dataToUpdate and jsToSql we set them equal to setCols and values
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    
    // set up the placeholder for the handle
    const handleVarIdx = "$" + (values.length + 1);

    // construct the SQL query to update the companies table 
    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;

    // execute the query and retrieve the updated company information
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    // if the company was not found we throw an error else we return the company
    if (!company) throw new NotFoundError(`No company: ${handle}`);
    return company;
  }

  // Delete given company from database; returns undefined. Throws NotFoundError if company not found.
  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;

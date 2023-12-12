"use strict";

// require our jobly db,  2 functions from our expressError file, and a function from helpers.sql
const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

// Related functions for jobs put into a model
class Job {
  // Create a job (from data), update db,return new job data
  // Data for RETURN should be and instance object { id, title, salary, equity, company_handle }
  // Throws BadRequestError if job already in db
  static async create({ title, salary, equity, companyHandle }) {
    // first check to see if job already exsits - if there is a duplicate throw a new error
    const duplicateCheck = await db.query(
      `SELECT id
            FROM jobs
            WHERE title = $1 AND company_handle=$2`,
      [title, companyHandle]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate job for ${companyHandle}: ${title}`);

    // result variable to insert the company info into table
    const result = await db.query(
      `INSERT INTO jobs
                (title, salary, equity, company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle]
    );

    // Fetch the job and convert equity to a float
    const job = result.rows[0];
    job.equity = parseFloat(job.equity);
    job.id = parseInt(job.id);

    return job;
  }

  // find all jobs
  // return array of objects [{id, title, salary, equity, companyHandle},...]
  static async findAll() {
    // create jobResults var using sql to return all rows from db
    const jobResults = await db.query(
      `SELECT id, 
              title, 
              salary, 
              equity, 
              company_handle AS "companyHandle"
            FROM jobs`
    );
    return jobResults.rows;
  }

  //Adding a filter feature to Job class based on certain criteria
  static async filterJobs(criteria) {
    const { title, salary, equity } = criteria;
    let whereClause = "";
    const values = [];

    if (title && typeof title === "string") {
      whereClause += `title ILIKE '%' || $${values.length + 1} || '%' `;
      values.push(title.toLowerCase());
    }

    if (salary !== undefined) {
      if (whereClause) whereClause += " AND ";
      whereClause += `salary >= $${values.length + 1}`;
      values.push(parseFloat(salary));
    }

    if (equity !== undefined) {
      if (whereClause) whereClause += " AND ";
      whereClause += `equity >= $${values.length + 1}`;
      values.push(parseFloat(equity));
    }

    const query = `
        SELECT id,
            title,
            salary AS "minSalary",
            equity AS "hasEquity",
            company_handle AS "companyHandle"
        FROM jobs
        ${whereClause ? `WHERE ${whereClause}` : ""}
        ORDER BY title`;

    try {
      const filteredJobs = await db.query(query, values);
      return filteredJobs.rows;
    } catch (error) {
      console.error("Error executing query:", error);
      throw error;
    }
  }

  // given a job id return the instance object 
  // throw NotFoundError if not found
  static async get(id) {
    const jobResults = await db.query(
      `SELECT id, 
                title, 
                salary, 
                equity, 
                company_handle AS "companyHandle"
            FROM jobs
            WHERE id = $1`,
      [id]
    );

    // from jobResults either set it to return or throw new error
    if (jobResults.rows.length === 0) {
      throw new NotFoundError(`No jobs: ${id}`);
    }

    return jobResults.rows;
  }

  // update job listing with partial update
  // can include: {title, salary, equity}
  // returns instance obj {title, salary, equity, companyHandle}
  // Thow new error it not found
  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      companyHandle: "company_handle",
    });

    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;

    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) {
      throw new NotFoundError(`No job with id: ${id}`);
    }
    return job;
  }

  // delete a job posting - return undefined or throw an error
  static async remove(id) {
    const result = await db.query(
      `DELETE
        FROM jobs
        WHERE id = $1
        RETURNING id`,
      [id]
    );
    const job = result.rows[0];
    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;
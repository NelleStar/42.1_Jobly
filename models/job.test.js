"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError.js");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "New Job",
    salary: 50000,
    equity: '0.05',
    companyHandle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    newJob.id = job.id;
    newJob.equity = parseFloat(newJob.equity);
    expect(job).toEqual(newJob);

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
       FROM jobs
       WHERE title = 'New Job'`
    );
    console.log(result.rows)
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "New Job",
        salary: 50000,
        equity: '0.05',
        company_handle: "c1",
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "Job 1",
        salary: 60000,
        equity: '0.1',
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "Job 2",
        salary: 80000,
        equity: '0.15',
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "Job 3",
        salary: 70000,
        equity: '0.12',
        companyHandle: "c3",
      },
    ]);
  });
});

/***************************************** filter */
describe("filterJobs", function () {
  test("works: filter by title", async function () {
    const filterByTitle = {
      title: "Job 1",
    };
    const filteredJobs = await Job.filterJobs(filterByTitle);

    expect(filteredJobs).toEqual([
      {
        id: expect.any(Number),
        title: "Job 1",
        minSalary: 60000,
        hasEquity: '0.1',
        companyHandle: "c1",
      },
    ]);
  });

  test("works: filter by minSalary", async function () {
    const filterByMinSalary = {
      minSalary: 75000,
    };
    const filteredJobs = await Job.filterJobs(filterByMinSalary);

    for (const job of filteredJobs) {
      expect(job.minSalary).toBeGreaterThanOrEqual(75000);
    }
  });

  test("works: filter by hasEquity", async function () {
    const filterByHasEquity = {
      hasEquity: 0.05,
    };
    const filteredJobs = await Job.filterJobs(filterByHasEquity);

    for (const job of filteredJobs) {
        const hasEquityValue = parseFloat(job.hasEquity);
        expect(hasEquityValue).toBeGreaterThanOrEqual(0.05);
    }
  });

  test("works: filter by title, minSalary, and hasEquity", async function () {
    const filterByMultipleCriteria = {
      title: "Engineer",
      minSalary: 80000,
      hasEquity: 0.1,
    };
    const filteredJobs = await Job.filterJobs(filterByMultipleCriteria);

    expect(filteredJobs.length).toEqual(0); // Adjust this based on your expected outcome
    // Add more specific assertions based on your expected results
  });
});


/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get("Job 1");
    expect(job).toEqual([
      {
        id: expect.any(Number),
        title: "Job 1",
        salary: 60000,
        equity: '0.1',
        companyHandle: "c1",
      },
    ]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  test("works", async function () {
    const jobQuery = await db.query("SELECT id FROM jobs LIMIT 1");
    const jobId = jobQuery.rows[0].id;

    const updateData = {
      title: "New Job Title",
      salary: 75000,
      equity: 0.08,
    };

    let job = await Job.update(jobId, updateData); 
    expect(job).toEqual({
      id: expect.any(Number),
      ...updateData,
      companyHandle: expect.any(String),
      equity: expect.any(String),
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
       FROM jobs
       WHERE id = $1`,
      [jobId]
    );

    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "New Job Title",
        salary: 75000,
        equity: '0.08',
        company_handle: expect.any(String), 
      },
    ]);
  });

  const updateData = {
    title: "Updated Job Title",
    salary: 60000,
    equity: 0.1,
  };

  test("not found if no such job", async function () {
    await expect(Job.update(0, updateData)).rejects.toThrow(NotFoundError);
  });


  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const jobQuery = await db.query("SELECT id FROM jobs LIMIT 1"); 
    const jobId = jobQuery.rows[0].id; // Extract the ID from the query result   
    await Job.remove(jobId);
   
    const res = await db.query(`SELECT id FROM jobs WHERE id = $1`, [jobId]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(1000); 
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

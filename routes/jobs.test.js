"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "New Job",
    salary: 70000,
    equity: 0.05,
    companyHandle: "c1",
  };

    test("ok for admin", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);

        expect(resp.statusCode).toEqual(201);
        expect(resp.body.job).toEqual(
            expect.objectContaining({
            companyHandle: newJob.companyHandle,
            equity: newJob.equity,
            salary: newJob.salary,
            title: newJob.title,
            })
        );
    });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "New Job",
        salary: 70000,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        ...newJob,
        salary: "not-a-number",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for all users", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toHaveProperty("jobs");
  });

  test("returns filtered jobs with valid criteria", async function () {
    const resp = await request(app).get("/jobs").query({
      title: "job",
      minSalary: 70000,
      hasEquity: 0.05,
    });

    // console.log(resp)
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toHaveProperty("jobs");
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for all users", async function () {
    const jobResp = await db.query("SELECT id FROM jobs LIMIT 1");
    const jobId = jobResp.rows[0].id;
    const resp = await request(app).get(`/jobs/${jobId}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toHaveProperty("job");
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admin", async function () {
    const jobResp = await db.query("SELECT id FROM jobs LIMIT 1");
    const jobId = jobResp.rows[0].id;
    const resp = await request(app)
      .patch(`/jobs/${jobId}`)
      .send({
        title: "Updated Job Title",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      job: expect.objectContaining({
        title: "Updated Job Title",
      }),
    });
  });

  test("unauth for non-admin", async function () {
    const jobResp = await db.query("SELECT id FROM jobs LIMIT 1");
    const jobId = jobResp.rows[0].id;
    const resp = await request(app).patch(`/jobs/${jobId}`).send({
      title: "Updated Job Title",
    });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/0`)
      .send({
        title: "Updated Job Title",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on invalid data", async function () {
    const jobResp = await db.query("SELECT id FROM jobs LIMIT 1");
    const jobId = jobResp.rows[0].id;
    const resp = await request(app)
      .patch(`/jobs/${jobId}`)
      .send({
        salary: "not-a-number",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admin", async function () {
    const jobResp = await db.query("SELECT id FROM jobs LIMIT 1");
    const jobId = jobResp.rows[0].id;
    const resp = await request(app)
      .delete(`/jobs/${jobId}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ deleted: expect.any(String) });
  });

  test("unauth for non-admin", async function () {
    const jobResp = await db.query("SELECT id FROM jobs LIMIT 1");
    const jobId = jobResp.rows[0].id;
    const resp = await request(app).delete(`/jobs/${jobId}`);
    // console.log(`job ${jobResp}, id ${jobId}, resp ${resp}`)
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
      .delete(`/jobs/0`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});

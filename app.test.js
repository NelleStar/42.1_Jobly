// need to import/require supertest for it to work
const request = require("supertest");

//need to import/require app from app.js and our database from db.js
const app = require("./app");
const db = require("./db");

//
test("not found for site 404", async function () {
  const resp = await request(app).get("/no-such-path");
  expect(resp.statusCode).toEqual(404);
});

test("not found for site 404 (test stack print)", async function () {
  process.env.NODE_ENV = "";
  const resp = await request(app).get("/no-such-path");
  expect(resp.statusCode).toEqual(404);
  delete process.env.NODE_ENV;
});

afterAll(function () {
  db.end();
});

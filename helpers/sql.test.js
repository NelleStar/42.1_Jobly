const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");

describe("sqlForPartialUpdate function", () => {
  test("throws BadRequestError for empty dataToUpdate", () => {
    expect(() => sqlForPartialUpdate({}, {})).toThrow(BadRequestError);
  });

  test("returns the correct setCols and values properties", () => {
    // Test input
    const dataToUpdate = {
      firstName: "John",
      lastName: "Doe",
      age: 30,
    };

    const jsToSql = {
      firstName: "first_name",
      lastName: "last_name",
      age: "user_age",
    };

    // Expected output to show the array properly aligned with k:v
    const expectedOutput = {
      setCols: '"first_name"=$1, "last_name"=$2, "user_age"=$3',
      values: ["John", "Doe", 30],
    };

    // Execute the function and assert the output
    expect(sqlForPartialUpdate(dataToUpdate, jsToSql)).toEqual(expectedOutput);
  });

});

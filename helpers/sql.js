// import the BadRequestError function from expressError file for use here
const { BadRequestError } = require("../expressError");

// params expect 2 args - object containing the data to be updated in db and map object that translates JS keys to column name in sql db
function sqlForPartialUpdate(dataToUpdate, jsToSql) {

  // create variable of the keys from the dataToUpdate param and if its length is 0 throw the BadRequestError(400)
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // now we need to map the keys taken from the dataToUpdate param and map it to the corresponding SQL column names (using jbToSl )if available or the key itself - returns an array that has been generated in proper alignment - 
  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  // return an object xontaining setCols which is a str of cols to be updated in SQL query formated above and the values of each key in the dataToUpdate param
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

// export sqlForPartialUpdate for use in other files
module.exports = { sqlForPartialUpdate };

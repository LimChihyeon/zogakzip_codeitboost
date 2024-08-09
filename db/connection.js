const mysql = require("mysql");

const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "lch",
  password: "dlaclgus1106",
  database: "zogakzip",
  connectionLimit: 10,
});

module.exports = pool;

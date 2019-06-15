"use strict";
let config = require('./config');
let mysql = require("mysql");
let db;

//Восстановление соединения MySQL при сбое
function handleDbDisconnect() {
  db = mysql.createConnection(config.db);

  //асинхронная функция для механизма async/await
  db.aquery = async function(sql, values) {
    return new Promise(function(resolve, reject) {
      let query = db.query(sql, values, function(err, rows) {
        console.debug("query " + query.sql);
        if (err) {
          reject(new Error(err.message + "<|>" + query.sql));
        } else {
          resolve(rows);
        }
      });
    });
  };

  db.connect(function(err) {
    // The server is either down
    if (err) {
      // or restarting (takes a while sometimes).
      console.error("error when connecting to db:", err);
      setTimeout(handleDbDisconnect, 2000); // We introduce a delay before attempting to reconnect,
    } // to avoid a hot loop, and to allow our node script to
  }); // process asynchronous requests in the megantime.
  // If you're also serving http, display a 503 error.
  db.on("error", function(err) {
    console.error("db error", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      // Connection to the MySQL server is usually
      handleDbDisconnect(); // lost due to either server restart, or a
    } else {
      // connnection idle timeout (the wait_timeout
      throw err; // server variable configures this)
    }
  });
}

//Создание соединения MySQL при первом запуске приложения
handleDbDisconnect();

async function getParamValue(osm_ids, param_id, year, month) {
  let rows = await db.aquery("SELECT osm_id, param_value FROM stat WHERE osm_id IN (?) AND param_id=? AND year=? AND month=?",
                             [osm_ids, param_id, year, month]);
  return rows;
}


module.exports = {
  getParamValue: getParamValue
};

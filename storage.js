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
    if (err) {
      console.error("error when connecting to db:", err);
      setTimeout(handleDbDisconnect, 2000);
    }
  });
  db.on("error", function(err) {
    console.error("db error", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      handleDbDisconnect();
    } else {
      throw err;
    }
  });
}

//Создание соединения MySQL при первом запуске приложения
handleDbDisconnect();

async function getOsmData(osm_ids, param_id) {
  let osm_data = await db.aquery("SELECT osm_id, year, month, param_value FROM stat WHERE osm_id IN (?) AND param_id=?",
                             [osm_ids, param_id]);
  return osm_data;
}

async function getParams() {
  let params = await db.aquery("SELECT id, name, legend, min_legend, max_legend FROM param");
  return params;
}


module.exports = {
  getParams: getParams,
  getOsmData: getOsmData
};

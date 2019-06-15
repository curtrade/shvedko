let config = require('./config');
let storage = require('./storage');
let express = require('express');
let bodyParser = require('body-parser');
let app = express();

app.use("/public", express.static(__dirname + '/public'));
app.use("/", express.static(__dirname + '/public'));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
  extended: true
})); // support encoded bodies

app.post("/get_param_for_osm_list/:param_id", async (req, res) => {
 let year = 2017;
 let month = 12;
  console.debug('/get_param_value', req.body.osmIds);
  const result = await storage.getParamValue(req.body.osmIds,req.params.param_id,year,month);
  res.json(result);
});

app.listen(config.web.port);

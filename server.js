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

app.get("/get_param_value/:osm_id/:param_id/:year/:month", async (req, res) => {
  const result = await storage.getParamValue(req.params.osm_id,req.params.param_id,req.params.year,req.params.month);
  res.json(result);
});

app.listen(config.web.port);

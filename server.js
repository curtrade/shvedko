let config = require('./config');
let storage = require('./storage');
let express = require('express');
let bodyParser = require('body-parser');
let app = express();

app.use("/", express.static(__dirname + '/public'));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({
  extended: true
})); // support encoded bodies

app.post("/get_osm_data/:paramId", async (req, res) => {
  console.debug('/get_osm_data', req.body.osmIds);
  const osmData = await storage.getOsmData(req.body.osmIds,req.params.paramId);
  res.json(osmData);
});

app.get("/get_params", async (req, res) => {
  console.debug('/get_params');
  const params = await storage.getParams();
  res.json(params);
});

app.listen(config.web.port);

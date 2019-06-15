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


app.get("/get_regions", async (req, res) => {
  console.debug('/get_regions started!');
  const regions = await storage.getRegions();
  res.json(regions);
});

app.get("/get_cities/:region", async (req, res) => {
  const cities = await storage.getCities(req.params.region);
  res.json(cities);
});

app.get("/get_districts/:city", async (req, res) => {
  const districts = await storage.getCities(req.params.city);
  res.json(districts);
});

app.get("/get_microdistricts/:district", async (req, res) => {
  const microdistricts = await storage.getCities(req.params.district);
  res.json(microdistricts);
});

app.listen(config.web.port);

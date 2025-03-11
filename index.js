const express = require("express");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { Sequelize } = require('sequelize');
const fs = require('fs');

const compression = require("compression"); // Compress response body
app.use(compression());

const helmet = require("helmet"); // Helps to secure this app by setting various HTTP headers
app.use(helmet());

const cors = require("cors");
app.use(cors());

// const rateLimit = require("express-rate-limit"); // Limit repeated requests to APIs
// const limiter = rateLimit({
//   windowMs: 1000, // 1 second
//   max: 2, // limit each IP to 2 requests per windowMs
// });
// app.use(limiter);
app.set("trust proxy", 1); // Enable if you're behind a reverse proxy

const hpp = require("hpp"); // Prevent HTTP Parameter Pollution
app.use(hpp());

const si = require("systeminformation");

// For tracing in AWS X-Ray
const AWSXRay = require("aws-xray-sdk");
app.use(AWSXRay.express.openSegment("Sample Express API"));

const axios = require("axios");

// For winston logging
const { createLogger, format, transports } = require("winston");
const { combine, timestamp } = format;
const timezoned = () => {
  return new Date().toLocaleString("en-SG");
};
const log = createLogger({
  format: combine(timestamp({ format: timezoned }), format.prettyPrint()),
  transports: [new transports.Console()],
});

const port = process.env.PORT || 8000;
var req_count = 0

app.get("/", async function (req, res) {
  let [cpu, mem, graphics, os] = await Promise.all([
    si.cpu(),
    si.mem(),
    si.graphics(),
    si.osInfo(),
  ]);

  let defaultNetworkInterface = await si.networkInterfaces("default");
  let ip_address = defaultNetworkInterface.ip4;
  let network_type = defaultNetworkInterface.type;
  let network_speed = defaultNetworkInterface.speed;

  let graphicsInfo =
    graphics.controllers.length > 0
      ? `${graphics.controllers[0].model} (VRAM: ${graphics.controllers[0].vram})`
      : "";

  var content = '<!DOCTYPE html><html><head><title>System Information</title></head><body><h1>System Information</h1>'
  let items = [
    {'key': 'Host Name', 'value': os.hostname},
    {'key': 'IP Address', 'value': `${ip_address} (${network_type}, ${network_speed} Mbit / s)`},
    {'key': 'CPU', 'value': `${cpu.manufacturer} ${cpu.brand} ${cpu.speed} GHz (${cpu.cores} cores)`},
    {'key': 'Memory', 'value': `${mem.total / 1000000000} GB`},
    {'key': 'Graphic', 'value': graphicsInfo},
    {'key': 'OS', 'value': `${os.distro} ${os.release} ${os.codename} ${os.kernel}`}
  ]
  content += "<table cellpadding='10'>"
  for (var item of items) {
    content += "<tr><td>" + item["key"] + "</td><td>" + item["value"] + "</td></tr>"
  }
  content += "</table></body></html>"

  req_count += 1
  res.status(200).send(content);
});

app.get("/env-var", async function (req, res) {
  var envVar =
    "<table cellpadding='10'><tr><th align='left'>Key</th><th align='left'>Value</th></tr>";
  for (var attr in process.env) {
    envVar +=
      "<tr><td>" + attr + "</td><td>" + process.env[attr] + "</td></tr>";
  }
  envVar +=
      "<tr><td>REQUEST_COUNT</td><td>" + req_count + "</td></tr>";
  envVar += "</table>";

  res.send(`
    <h1>Environment Variables</h1>
    ${envVar}`);
});

app.get("/req", async function (req, res) {
  const protocol = req.query.protocol ? req.query.protocol : "http";
  const host = req.query.host ? req.query.host : "localhost";
  const port = req.query.port ? req.query.port : "8000";
  const path = req.query.path ? req.query.path : "/";
  const url = protocol + "://" + host + ":" + port + path;
  await axios
    .get(url)
    .then((response) => {
      res
        .status(200)
        .send("Sent a request to '" + url + "'\n\n" + response.data);
    })
    .catch((error) => {
      log.error(error.message);
      res.status(500).send(error.message);
    });
});

app.get("/log/:message?", async function (req, res) {
  if (req.params.message) {
    log.info(req.params.message);
    res.status(200).send("Logged: " + req.params.message);
  } else {
    res
      .status(200)
      .send("Use '/log/[your message]' to log a custom message to stdout.");
  }
});

app.get("/error", async function (req, res) {
  log.error("Trigger Error");
  res.status(500).send("Trigger Error");
});

app.get("/crash", async function (req, res) {
  log.error("Trigger Crash");
  throw "Crash";
});

app.get("/psql", async function (req, res) {
  var ssl = true
  var dialectOptions = {
    ssl: {
        rejectUnauthorized: false,
    }
  }
  if (req.query.nossl == "") {
    ssl = false
    dialectOptions = {}
  }

  const sequelize = new Sequelize(process.env["db_username"], process.env["db_username"], process.env["db_password"], {
    host: process.env["db_host"],
    dialect: 'postgres',
    port: process.env["db_port"],
    ssl,
    dialectOptions
  });

  try {
    await sequelize.authenticate();
    res.status(200).send('Connection has been established successfully.');
  } catch (error) {
    res.status(500).send(error);
  }
});

app.use(function (req, res, next) {
  var fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;
  log.warn("Unable to find API - " + fullUrl);
  res.status(404).send("Unable to find API - " + fullUrl);
});

// For tracing in AWS X-Ray
app.use(AWSXRay.express.closeSegment());

app.listen(port, function () {
  console.log("Listening at port " + port);
});

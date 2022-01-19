const express = require("express");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const compression = require("compression"); // Compress response body
app.use(compression());

const helmet = require("helmet"); // Helps to secure this app by setting various HTTP headers
app.use(helmet());

const cors = require("cors");
app.use(cors());

const rateLimit = require("express-rate-limit"); // Limit repeated requests to APIs
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);
app.set("trust proxy", 1); // Enable if you're behind a reverse proxy

const hpp = require("hpp"); // Prevent HTTP Parameter Pollution
app.use(hpp());

const si = require("systeminformation");

// For tracing in AWS X-Ray
var AWSXRay = require('aws-xray-sdk');
app.use(AWSXRay.express.openSegment('Sample Express API'));

var logger = require('fluent-logger')
logger.configure('sample-express-api', {
   host: 'localhost',
   port: 24224,
   timeout: 3.0,
   reconnectInterval: 600000 // 10 minutes
});

const port = process.env.PORT || 8000;

app.get("/", async function (req, res) {
  let [cpu, mem, graphics, os] = await Promise.all([si.cpu(), si.mem(), si.graphics(), si.osInfo()]);
  var address,
    ifaces = require("os").networkInterfaces();
  for (var dev in ifaces) {
    ifaces[dev].filter((details) =>
      details.family === "IPv4" && details.internal === false
        ? (address = details.address)
        : undefined
    );
  }
  var graphicsInfo = graphics.controllers.length > 0 ? `${graphics.controllers[0].model} (VRAM: ${graphics.controllers[0].vram})` : "";

  var envVar = "<table cellpadding='10'><tr><th align='left'>Key</th><th align='left'>Value</th></tr>";
  for (var attr in process.env) {
    envVar += "<tr><td>" + attr + "</td><td>" + process.env[attr] + "</td></tr>";
  }
  envVar += "</table>";

  res.send(`
    <h1>Host Information</h1>
    <table cellpadding='10'>
      <tr>
        <td>
          Host Name
        </td>
        <td>
          ${os.hostname}
        </td>
      </tr>
      <tr>
        <td>
          IP Address
        </td>
        <td>
          ${address}
        </td>
      </tr>
      <tr>
        <td>
          CPU
        </td>
        <td>
          ${cpu.manufacturer} ${cpu.brand} ${cpu.speed} GHz (${cpu.cores} cores)
        </td>
      </tr>
      <tr>
        <td>
          Memory
        </td>
        <td>
          ${mem.total / 1000000000} GB
        </td>
      </tr>
      <tr>
        <td>
          Graphics
        </td>
        <td>
          ${graphicsInfo}
        </td>
      </tr>
      <tr>
        <td>
          OS
        </td>
        <td>
          ${os.distro} ${os.release} ${os.codename} ${os.kernel}
        </td>
      </tr>
    </table>
    <h1>Environment Variables</h1>
    ${envVar}`);
});

app.get("/log", async function (req, res) {
  console.log("Trigger Log");
  logger.emit("trigger-log", {record: 'This is a log'})
  res.status(200).send("Log");
});

app.get("/error", async function (req, res) {
  console.error("Trigger Error")
  logger.emit("trigger-error", {record: 'This is an error'})
  res.status(500).send("Error");
});

app.get("/crash", async function (req, res) {
  console.error("Trigger Crash")
  logger.emit("trigger-crash", {record: 'App has crashed'})
  throw "Crash";
});

app.use(function (err, req, res, next) {
  console.log(err.stack);
  logger.emit("error", {record: err.stack})
  res.status(500).send("An error has occurred");
});

app.use(function (req, res, next) {
  var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  logger.emit("not-found", {record: "Unable to find API - " + fullUrl})
  res.status(404).send("Unable to find API - " + fullUrl);
});

// For tracing in AWS X-Ray
app.use(AWSXRay.express.closeSegment());

app.listen(port, function () {
  console.log("Listening at port " + port);
});

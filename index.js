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

app.use(function (err, req, res, next) {
  console.log(err.stack);
  res.status(500).send("An error has occurred");
});

app.use(function (req, res, next) {
  res.status(404).send("Unable to find API");
});

app.listen(port, function () {
  console.log("Listening at port " + port);
});

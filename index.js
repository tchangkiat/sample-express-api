// Middlewares
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
  const cpu = await si.cpu();
  const os = await si.osInfo();
  const mem = await si.mem();
  var address,
    ifaces = require("os").networkInterfaces();
  for (var dev in ifaces) {
    ifaces[dev].filter((details) =>
      details.family === "IPv4" && details.internal === false
        ? (address = details.address)
        : undefined
    );
  }
  res.send(`Host Name: ${os.hostname}<p/>
    IP Address: ${address}<p/>
    CPU: ${cpu.manufacturer} ${cpu.brand} ${cpu.speed} (${cpu.cores} cores)<p/>
    OS: ${os.distro} ${os.release} ${os.codename}<p/>
    Memory: ${mem.total / 1000000000} GB<p/>
    v20200601`);
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

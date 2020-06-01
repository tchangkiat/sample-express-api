const express = require("express");
const app = express();
const port = process.env.PORT || 8000;
const si = require("systeminformation");
const cors = require("cors");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/", async function (req, res) {
  const cpu = await si.cpu();
  const os = await si.osInfo();
  const ni = await si.networkInterfaces();
  const mem = await si.mem();
  res.send(`Host Name: ${os.hostname}<p/>
    IP Address: ${ni[0].ip4}<p/>
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

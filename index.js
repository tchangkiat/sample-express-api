const express = require("express");
const app = express();
const port = process.env.PORT || 8000;
var cors = require("cors");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

var serverIP;

app.get("/", function (req, res) {
  res.send("Running at http://" + serverIP + ":" + port);
});

app.use(function (err, req, res, next) {
  console.log(err.stack);
  res.status(500).send("An error has occurred");
});

app.use(function (req, res, next) {
  res.status(404).send("Unable to find API");
});

var server = app.listen(port, function () {
  serverIP = server.address().address;
  console.log("Running at http://" + serverIP + ":" + port);
});

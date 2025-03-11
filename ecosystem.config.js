module.exports = {
  apps : [{
    name: "sample-express-api",
    script: "./index.js",
    exec_mode: "cluster",
    instances: "3"
  }]
}

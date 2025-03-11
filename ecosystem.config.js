module.exports = {
  apps : [{
    name: "sample-express-api",
    script: "./index.js",
    exec_mode: "cluster",
    instances: "3",
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
}

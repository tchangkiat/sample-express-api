module.exports = {
  apps: [
    {
      name: "sample-express-api",
      script: "./index.js",
      exec_mode: "cluster",
      instances: "4",
      env: {
        PORT: 8000,
        NODE_ENV: "development",
      },
      kill_timeout: 60000,
    },
  ],
};

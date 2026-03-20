module.exports = {
  apps: [
    {
      name: "unface-web",
      cwd: __dirname,
      script: "node_modules/.bin/next",
      args: "start -H 127.0.0.1 -p 3000",
      env_file: ".env.production",
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      watch: false,
      time: true,
    },
    {
      name: "unface-socket",
      cwd: __dirname,
      script: "node_modules/.bin/tsx",
      args: "server/socket-server.ts",
      env_file: ".env.production",
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      watch: false,
      time: true,
    },
  ],
}

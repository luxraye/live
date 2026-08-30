// PM2 configuration for running bloodchain-fabric-node in the sandbox.
// (On Render/Replit the service is started with `node dist/index.js` directly.)
module.exports = {
  apps: [
    {
      name: 'bloodchain-fabric-node',
      script: 'dist/index.js',
      cwd: '/home/user/webapp',
      env: {
        NODE_ENV: 'development',
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork',
    },
  ],
};

module.exports = {
  apps: [
    {
      name: 'hearts-online',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      max_memory_restart: '300M',
      time: true
    }
  ]
};

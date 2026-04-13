module.exports = {
    apps: [
        {
            name:         "roon-extension-tidbyt",
            script:       "src/index.js",
            cwd:          __dirname,
            instances:    1,
            autorestart:  true,
            watch:        false,
            max_restarts: 10,
            min_uptime:   "10s",
            restart_delay: 3000,
            env: {
                NODE_ENV: "production",
            },
        },
    ],
};

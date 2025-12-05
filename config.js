module.exports = {
    prefix: '!',
    nodes: [{
        host: process.env.LAVALINK_HOST || "lavalink.jirayu.net",
        password: process.env.LAVALINK_PASSWORD || "youshallnotpass",
        port: 13592,
        secure: false,
        name: "Main Node"
    }],
    spotify: {
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET
    },
    botToken: process.env.BOT_TOKEN,
    embedColor: "#0061ff"
};
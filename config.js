module.exports = {
    prefix: '!',
    nodes: [{
        host: process.env.LAVALINK_HOST || "lavalinkv4.serenetia.com",
        password: process.env.LAVALINK_PASSWORD || "https://seretia.link/discord",
        port: parseInt(process.env.LAVALINK_PORT) || 443,
        secure: process.env.LAVALINK_SECURE !== "false",
        name: "Main Node"
    }],
    spotify: {
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET
    },
    botToken: process.env.BOT_TOKEN,
    embedColor: "#0061ff",
    guildId: process.env.GUILD_ID || null
};
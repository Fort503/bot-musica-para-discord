require('dotenv').config();
const { Client, GatewayDispatchEvents, Collection } = require("discord.js");
const { Riffy } = require("riffy");
const { Spotify } = require("riffy-spotify");
const fs = require('fs');
const path = require('path');
const config = require("./config.js");
const messages = require("./utils/messages.js");
const emojis = require("./emojis.js");

const client = new Client({
    intents: [
        "Guilds",
        "GuildMessages",
        "GuildVoiceStates",
        "GuildMessageReactions",
        "MessageContent",
        "DirectMessages",
    ],
});

const spotify = new Spotify({
    clientId: config.spotify.clientId,
    clientSecret: config.spotify.clientSecret
});

client.riffy = new Riffy(client, config.nodes, {
    send: (payload) => {
        const guild = client.guilds.cache.get(payload.d.guild_id);
        if (guild) guild.shard.send(payload);
    },
    defaultSearchPlatform: "ytmsearch",
    restVersion: "v4",
    plugins: [spotify]
});

// Load slash commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
}

const helpCommands = client.commands.map(cmd => ({
    name: cmd.data.name,
    description: cmd.data.description
}));

client.once("ready", async () => {
    client.riffy.init(client.user.id);

    // Register slash commands
    const commands = client.commands.map(command => command.data);
    try {
        if (config.guildId) {
            const guild = client.guilds.cache.get(config.guildId);
            if (guild) {
                await guild.commands.set(commands);
                console.log(`${emojis.success} Slash commands registered in guild: ${guild.name}`);
            } else {
                await client.application.commands.set(commands);
                console.log(`${emojis.success} Guild not found, registered slash commands globally`);
            }
        } else {
            await client.application.commands.set(commands);
            console.log(`${emojis.success} Slash commands registered globally`);
        }
    } catch (error) {
        console.error(`${emojis.error} Error registering slash commands:`, error);
    }

    console.log(`${emojis.success} Logged in as ${client.user.tag}`);
});

// Slash command handler
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction, client);
    } catch (error) {
        console.error(`${emojis.error} Error executing /${interaction.commandName}:`, error);
        const errorMsg = '¡Ocurrió un error al ejecutar este comando!';
        if (interaction.deferred || interaction.replied) {
            await interaction.followUp({ content: `${emojis.error} ${errorMsg}`, ephemeral: true });
        } else {
            await interaction.reply({ content: `${emojis.error} ${errorMsg}`, ephemeral: true });
        }
    }
});

// Prefix command handler
client.on("messageCreate", async (message) => {
    if (!message.content.startsWith(config.prefix) || message.author.bot) return;

    const args = message.content.slice(config.prefix.length).trim().split(" ");
    const command = args.shift().toLowerCase();

    const musicCommands = ["play", "skip", "stop", "pause", "resume", "queue", "nowplaying", "volume", "shuffle", "loop", "remove", "clear"];
    if (musicCommands.includes(command)) {
        if (!message.member.voice.channel) {
            return messages.error(message.channel, "¡Debes estar en un canal de voz!");
        }
    }

    switch (command) {
        case "help": {
            messages.help(message.channel, helpCommands);
            break;
        }

        case "play": {
            const query = args.join(" ");
            if (!query) return messages.error(message.channel, "¡Por favor, proporciona una canción o URL para buscar!");

            try {
                let player = client.riffy.players.get(message.guild.id);
                if (!player) {
                    player = client.riffy.createConnection({
                        guildId: message.guild.id,
                        voiceChannel: message.member.voice.channel.id,
                        textChannel: message.channel.id,
                        deaf: true,
                    });
                } else {
                    player.textChannel = message.channel.id;
                }

                const resolve = await client.riffy.resolve({
                    query: query,
                    requester: message.member,
                });

                const { loadType, tracks, playlistInfo } = resolve;

                if (loadType === "playlist") {
                    for (const track of resolve.tracks) {
                        track.info.requester = message.member;
                        player.queue.add(track);
                    }

                    messages.addedPlaylist(message.channel, playlistInfo, tracks);
                    if (!player.playing && !player.paused) return player.play();
                } else if (loadType === "search" || loadType === "track") {
                    const track = tracks.shift();
                    track.info.requester = message.member;
                    const position = player.queue.length + 1;
                    player.queue.add(track);

                    messages.addedToQueue(message.channel, track, position);
                    if (!player.playing && !player.paused) return player.play();
                } else {
                    return messages.error(message.channel, "¡No se encontraron resultados! Intenta con otro término de búsqueda.");
                }
            } catch (error) {
                console.error(error);
                return messages.error(message.channel, "¡Ocurrió un error al reproducir la canción! Por favor, inténtalo de nuevo más tarde.");
            }
            break;
        }

        case "skip": {
            const player = client.riffy.players.get(message.guild.id);
            if (!player) return messages.error(message.channel, "¡No se está reproduciendo nada!");
            if (!player.queue.length) return messages.error(message.channel, "¡No hay más canciones en la cola para saltar!");

            player.stop();
            messages.success(message.channel, "¡Se ha saltado la canción actual!");
            break;
        }

        case "stop": {
            const player = client.riffy.players.get(message.guild.id);
            if (!player) return messages.error(message.channel, "¡No se está reproduciendo nada!");

            player.destroy();
            messages.success(message.channel, "¡Se detuvo la música y se limpió la cola!");
            break;
        }

        case "pause": {
            const player = client.riffy.players.get(message.guild.id);
            if (!player) return messages.error(message.channel, "¡No se está reproduciendo nada!");
            if (player.paused) return messages.error(message.channel, "¡El reproductor ya está en pausa!");

            player.pause(true);
            messages.success(message.channel, "¡Música pausada!");
            break;
        }

        case "resume": {
            const player = client.riffy.players.get(message.guild.id);
            if (!player) return messages.error(message.channel, "¡No se está reproduciendo nada!");
            if (!player.paused) return messages.error(message.channel, "¡El reproductor ya se está reproduciendo!");

            player.pause(false);
            messages.success(message.channel, "¡Música reanudada!");
            break;
        }

        case "queue": {
            const player = client.riffy.players.get(message.guild.id);
            if (!player) return messages.error(message.channel, "¡No se está reproduciendo nada!");

            const queue = player.queue;
            if (!queue.length && !player.queue.current) {
                return messages.error(message.channel, "¡La cola está vacía! Añade algunas canciones con el comando play.");
            }

            messages.queueList(message.channel, queue, player.queue.current);
            break;
        }

        case "nowplaying": {
            const player = client.riffy.players.get(message.guild.id);
            if (!player) return messages.error(message.channel, "¡No se está reproduciendo nada!");
            if (!player.current) return messages.error(message.channel, "¡Ninguna canción se está reproduciendo actualmente!");

            messages.nowPlaying(message.channel, player.current, player.position);
            break;
        }

        case "volume": {
            const player = client.riffy.players.get(message.guild.id);
            if (!player) return messages.error(message.channel, "¡No se está reproduciendo nada!");

            const volume = parseInt(args[0]);
            if (!volume && volume !== 0 || isNaN(volume) || volume < 0 || volume > 100) {
                return messages.error(message.channel, "¡Por favor, proporciona un volumen válido entre 0 y 100!");
            }

            player.setVolume(volume);
            messages.success(message.channel, `Volumen ajustado a ${volume}%`);
            break;
        }

        case "shuffle": {
            const player = client.riffy.players.get(message.guild.id);
            if (!player) return messages.error(message.channel, "¡No se está reproduciendo nada!");
            if (!player.queue.length) return messages.error(message.channel, "¡No hay suficientes canciones en la cola para mezclar!");

            player.queue.shuffle();
            messages.success(message.channel, `${emojis.shuffle} ¡La cola ha sido mezclada!`);
            break;
        }

        case "loop": {
            const player = client.riffy.players.get(message.guild.id);
            if (!player) return messages.error(message.channel, "¡No se está reproduciendo nada!");

            const currentMode = player.loop;
            const newMode = currentMode === "none" ? "queue" : "none";

            player.setLoop(newMode);
            messages.success(message.channel, `¡Modo de repetición ${newMode === "queue" ? "activado" : "desactivado"}!`);
            break;
        }

        case "remove": {
            const player = client.riffy.players.get(message.guild.id);
            if (!player) return messages.error(message.channel, "¡No se está reproduciendo nada!");

            const position = parseInt(args[0]);
            if (!position || isNaN(position) || position < 1 || position > player.queue.length) {
                return messages.error(message.channel, `¡Por favor, proporciona una posición de canción válida entre 1 y ${player.queue.length}!`);
            }

            const removed = player.queue.remove(position - 1);
            messages.success(message.channel, `¡Se ha eliminado **${removed.info.title}** de la cola!`);
            break;
        }

        case "clear": {
            const player = client.riffy.players.get(message.guild.id);
            if (!player) return messages.error(message.channel, "¡No se está reproduciendo nada!");
            if (!player.queue.length) return messages.error(message.channel, "¡La cola ya está vacía!");

            player.queue.clear();
            messages.success(message.channel, "¡La cola ha sido limpiada!");
            break;
        }

        case "status": {
            const player = client.riffy.players.get(message.guild.id);
            if (!player) return messages.error(message.channel, "¡No se encontró un reproductor activo!");

            messages.playerStatus(message.channel, player);
            break;
        }
    }
});

client.riffy.on("nodeConnect", (node) => {
    console.log(`${emojis.success} Node "${node.name}" connected.`);
});

client.riffy.on("nodeError", (node, error) => {
    console.log(`${emojis.error} Node "${node.name}" encountered an error: ${error.message}.`);
});

client.riffy.on("trackStart", async (player, track) => {
    const channel = client.channels.cache.get(player.textChannel);
    if (!channel) return;
    messages.nowPlaying(channel, track);
});

client.riffy.on("queueEnd", async (player) => {
    const channel = client.channels.cache.get(player.textChannel);
    if (!channel) return;
    player.destroy();
    messages.queueEnded(channel);
});

client.on("raw", (d) => {
    if (![GatewayDispatchEvents.VoiceStateUpdate, GatewayDispatchEvents.VoiceServerUpdate].includes(d.t)) return;
    client.riffy.updateVoiceState(d);
});

process.on("unhandledRejection", (error) => {
    if (error?.message?.includes("Queue is empty")) return;
    console.error(`${emojis.error} Unhandled rejection:`, error);
});

client.riffy.on("trackError", (player, track, payload) => {
    const errMsg = payload?.exception?.message || payload?.exception || "Unknown error";
    const source = track?.info?.sourceName || "unknown";
    const title = track?.info?.title || "unknown";
    console.error(`${emojis.error} Track error for guild ${player.guildId} [${source}] "${title}": ${errMsg}`);
    const channel = client.channels.cache.get(player.textChannel);
    if (channel) messages.error(channel, `No se pudo reproducir "${title}": ${errMsg}`);
});

client.login(config.botToken);

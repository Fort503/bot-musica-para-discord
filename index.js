const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice');
const scdl = require('soundcloud-downloader').default;
const path = require('path');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const guildAudioPlayers = new Map();

client.once('clientReady', () => {
    console.log(`Bot conectado como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const args = message.content.trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command === '!play') {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('Debes estar en un canal de voz.');
        if (!args[0]) return message.reply('Debes poner un enlace o nombre de cancion.');

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        let url = args[0];

        try {
            if (!scdl.isValidUrl(url)) {
                const query = args.join(' ');
                const results = await scdl.search({ query, limit: 1, resourceType: 'tracks' });

                if (!results || !results.collection || results.collection.length === 0)
                    return message.reply('No se encontraron resultados.');

                url = results.collection[0].permalink_url;
            }

            const stream = await scdl.download(url);
            const resource = createAudioResource(stream);
            const player = createAudioPlayer();

            connection.subscribe(player);
            player.play(resource);
            guildAudioPlayers.set(message.guild.id, { player, connection });

            player.on(AudioPlayerStatus.Playing, () => {
                console.log('Reproduciendo:', url);
                message.reply(`Reproduciendo: ${url}`);
            });

            player.on('error', (error) => {
                console.error('Error en el reproductor:', error);
                message.reply('Hubo un error al reproducir la cancion.');
            });

        } catch (error) {
            console.error('Error al obtener la cancion:', error);
            message.reply('Error al reproducir la cancion de SoundCloud.');
        }
    }

    if (command === '!playlocal') {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('Debes estar en un canal de voz.');

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        const filePath = path.join(__dirname, 'songs', 'test.mp3');
        const resource = createAudioResource(filePath);
        const player = createAudioPlayer();

        connection.subscribe(player);
        player.play(resource);

        guildAudioPlayers.set(message.guild.id, { player, connection });

        player.on(AudioPlayerStatus.Playing, () => {
            console.log('Reproduciendo archivo local');
            message.reply('Reproduciendo archivo local');
        });
    }

    if (command === '!pause') {
        const audioData = guildAudioPlayers.get(message.guild.id);
        if (!audioData) return message.reply('No hay musica reproduciendose.');

        const { player } = audioData;
        if (player.state.status !== 'playing') return message.reply('La musica no esta reproduciendose.');

        player.pause();
        message.reply('Musica pausada');
    }

    if (command === '!resume') {
        const audioData = guildAudioPlayers.get(message.guild.id);
        if (!audioData) return message.reply('No hay musica reproduciendose.');

        const { player } = audioData;
        if (player.state.status !== 'paused') return message.reply('La musica no esta pausada.');

        player.unpause();
        message.reply('Musica reanudada');
    }

    if (command === '!stop') {
        const audioData = guildAudioPlayers.get(message.guild.id);
        if (!audioData) return message.reply('No hay musica reproduciendose.');

        const { player, connection } = audioData;
        player.stop();
        connection.destroy();
        guildAudioPlayers.delete(message.guild.id);

        message.reply('Reproduccion detenida');
    }
});

client.login(process.env.TOKEN);
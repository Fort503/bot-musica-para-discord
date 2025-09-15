const { createAudioResource } = require('@discordjs/voice');
const { connectToVoiceChannel, playAudioResource } = require('../utils/audioManager');
const { downloadSoundcloudTrack, isValidSoundcloudUrl } = require('../utils/soundcloud');
const scdl = require('soundcloud-downloader').default;

module.exports = {
    name: 'playlist',
    description: 'Reproduce una playlist de SoundCloud (máximo 10 canciones)',
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('Debes estar en un canal de voz.');
        if (!args[0]) return message.reply('Debes poner el enlace de una playlist de SoundCloud.');

        const url = args[0];
        try {
            if (!isValidSoundcloudUrl(url) || !url.includes('/sets/')) {
                return message.reply('Ese enlace no parece ser una playlist de SoundCloud.');
            }

            const playlist = await scdl.getSetInfo(url);
            if (!playlist || !playlist.tracks.length) {
                return message.reply('No se encontraron canciones en esa playlist.');
            }

            const tracks = playlist.tracks.slice(0, 20); 
            message.reply(`Agregando las primeras ${tracks.length} canciones de **${playlist.title}**`);

            connectToVoiceChannel(voiceChannel);

            for (const track of tracks) {
                const stream = await downloadSoundcloudTrack(track.permalink_url);
                const resource = createAudioResource(stream);

                const metadata = {
                    title: track.title,
                    url: track.permalink_url,
                    requestedBy: message.author.username
                };

                playAudioResource(message.guild.id, resource, metadata);
            }

        } catch (error) {
            console.error('Error al reproducir playlist:', error);
            message.reply('Error al reproducir la playlist de SoundCloud.');
        }
    }
};

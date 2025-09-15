const { createAudioResource } = require('@discordjs/voice');
const { connectToVoiceChannel, playAudioResource, addToQueue, getQueue } = require('../utils/audioManager');
const { searchSoundcloudTrack, downloadSoundcloudTrack, isValidSoundcloudUrl } = require('../utils/soundcloud');

module.exports = {
    name: 'play',
    description: 'Reproduce una canción de SoundCloud o la añade a la cola',
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('Debes estar en un canal de voz.');
        if (!args[0]) return message.reply('Debes poner un enlace o nombre de cancion.');

        let url = args[0];
        let trackInfo = null;

        try {
            if (!isValidSoundcloudUrl(url)) {
                const query = args.join(' ');
                const track = await searchSoundcloudTrack(query);
                
                if (!track) return message.reply('No se encontraron resultados.');
                
                url = track.permalink_url;
                trackInfo = {
                    title: track.title,
                    artist: track.user.username,
                    duration: track.duration,
                    artwork: track.artwork_url
                };
                
                message.reply(`Encontrado: **${track.title}** por ${track.user.username}`);
            }

            connectToVoiceChannel(voiceChannel);
            
            const stream = await downloadSoundcloudTrack(url);
            const resource = createAudioResource(stream);
            
            const metadata = {
                title: trackInfo?.title || 'Título desconocido',
                url: url,
                requestedBy: message.author.username
            };

            const result = playAudioResource(message.guild.id, resource, metadata);
            
            if (result.status === 'playing') {
                message.reply(`Reproduciendo: **${metadata.title}**, ${metadata.url}`);
            } else if (result.status === 'queued') {
                const queue = getQueue(message.guild.id);
                message.reply(`Añadido a la cola: **${metadata.title}** (Posición #${queue.length})`);
            }

        } catch (error) {
            console.error('Error al reproducir:', error);
            message.reply('Error al reproducir la canción de SoundCloud.');
        }
    }
};
const { createAudioResource } = require('@discordjs/voice');
const { connectToVoiceChannel, playAudioResource } = require('../utils/audioManager');
const { searchSoundcloudTrack, downloadSoundcloudTrack, isValidSoundcloudUrl } = require('../utils/soundcloud');

module.exports = {
    name: 'play',
    description: 'Reproduce una canción de SoundCloud',
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('Debes estar en un canal de voz.');
        if (!args[0]) return message.reply('Debes poner un enlace o nombre de cancion.');

        let url = args[0];

        try {
            if (!isValidSoundcloudUrl(url)) {
                const query = args.join(' ');
                const track = await searchSoundcloudTrack(query);
                
                if (!track) return message.reply('No se encontraron resultados.');
                
                url = track.permalink_url;
                message.reply(`Encontrado: ${track.title} por ${track.user.username}`);
            }

            connectToVoiceChannel(voiceChannel);
            const stream = await downloadSoundcloudTrack(url);
            const resource = createAudioResource(stream);
            const player = playAudioResource(message.guild.id, resource);

            player.on('stateChange', (oldState, newState) => {
                if (newState.status === 'playing') {
                    message.reply(`Reproduciendo: ${url}`);
                }
            });

        } catch (error) {
            console.error('Error al reproducir:', error);
            message.reply('Error al reproducir la cancion de SoundCloud.');
        }
    }
};
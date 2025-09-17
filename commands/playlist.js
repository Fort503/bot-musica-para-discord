const { createAudioResource } = require('@discordjs/voice');
const { connectToVoiceChannel, playAudioResource } = require('../utils/audioManager');
const { downloadSoundcloudTrack, isValidSoundcloudUrl } = require('../utils/soundcloud');
const scdl = require('soundcloud-downloader').default;

module.exports = {
    name: 'playlist',
    description: 'Reproduce una playlist de SoundCloud (máximo 20 canciones)',
    options: [
        {
            name: 'url',
            description: 'El enlace de la playlist de SoundCloud',
            type: 3, // STRING
            required: true,
        },
    ],
    async execute(interaction, args, client) {
        await interaction.deferReply();

        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) return interaction.followUp('Debes estar en un canal de voz.');

        let url = interaction.options.getString('url');
        if (!url) {
            if (!args || args.length === 0) {
                return interaction.followUp('Debes poner el enlace de una playlist de SoundCloud.');
            }
            url = args[0];
        }

        try {
            if (!isValidSoundcloudUrl(url) || !url.includes('/sets/')) {
                return interaction.followUp('Ese enlace no parece ser una playlist de SoundCloud.');
            }

            const playlist = await scdl.getSetInfo(url);
            if (!playlist || !playlist.tracks.length) {
                return interaction.followUp('No se encontraron canciones en esa playlist.');
            }

            const tracks = playlist.tracks.slice(0, 20); 
            await interaction.followUp(`Agregando las primeras ${tracks.length} canciones de **${playlist.title}**`);

            connectToVoiceChannel(voiceChannel);

            for (const track of tracks) {
                const stream = await downloadSoundcloudTrack(track.permalink_url);
                const resource = createAudioResource(stream);

                const metadata = {
                    title: track.title,
                    url: track.permalink_url,
                    requestedBy: interaction.user.username
                };

                playAudioResource(interaction.guild.id, resource, metadata);
            }

        } catch (error) {
            console.error('Error al reproducir playlist:', error);
            await interaction.followUp('Error al reproducir la playlist de SoundCloud.');
        }
    }
};

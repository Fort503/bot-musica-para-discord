const { createAudioResource } = require('@discordjs/voice');
const { connectToVoiceChannel, playAudioResource, getQueue } = require('../utils/audioManager');
const { searchSoundcloudTrack, downloadSoundcloudTrack, isValidSoundcloudUrl } = require('../utils/soundcloud');

module.exports = {
    name: 'play',
    description: 'Reproduce una canción de SoundCloud o la añade a la cola',
    options: [
        {
            name: 'song',
            description: 'El nombre o URL de la canción en SoundCloud',
            type: 3, // STRING
            required: true,
        },
    ],
    async execute(interaction, args, client) {
        await interaction.deferReply();

        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) return interaction.followUp('Debes estar en un canal de voz.');

        let query = interaction.options.getString('song');
        if (!query) {
             // Compatibility with message commands
            if (!args || args.length === 0) {
                return interaction.followUp('Debes poner un enlace o nombre de cancion.');
            }
            query = args.join(' ');
        }


        let url = query;
        let trackInfo = null;

        try {
            if (!isValidSoundcloudUrl(url)) {
                const track = await searchSoundcloudTrack(query);
                
                if (!track) return interaction.followUp('No se encontraron resultados.');
                
                url = track.permalink_url;
                trackInfo = {
                    title: track.title,
                    artist: track.user.username,
                    duration: track.duration,
                    artwork: track.artwork_url
                };
                
                await interaction.followUp(`Encontrado: **${track.title}** por ${track.user.username}`);
            }

            connectToVoiceChannel(voiceChannel);
            
            const stream = await downloadSoundcloudTrack(url);
            const resource = createAudioResource(stream);
            
            const metadata = {
                title: trackInfo?.title || 'Título desconocido',
                url: url,
                requestedBy: interaction.user.username
            };

            const result = playAudioResource(interaction.guild.id, resource, metadata);
            
            if (result.status === 'playing') {
                await interaction.followUp(`Reproduciendo: **${metadata.title}**, ${metadata.url}`);
            } else if (result.status === 'queued') {
                const queue = getQueue(interaction.guild.id);
                await interaction.followUp(`Añadido a la cola: **${metadata.title}** (Posición #${queue.length})`);
            }

        } catch (error) {
            console.error('Error al reproducir:', error);
            await interaction.followUp('Error al reproducir la canción de SoundCloud.');
        }
    }
};
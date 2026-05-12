const { SlashCommandBuilder } = require('discord.js');
const messages = require('../utils/messages.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Reproduce una canción o playlist')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Nombre de la canción o URL')
                .setRequired(true)),

    async execute(interaction, client) {
        if (!interaction.member.voice.channel) {
            return messages.error(interaction, '¡Debes estar en un canal de voz!');
        }

        await interaction.deferReply();

        const query = interaction.options.getString('query');

        try {
            let player = client.riffy.players.get(interaction.guild.id);
            if (!player) {
                player = client.riffy.createConnection({
                    guildId: interaction.guild.id,
                    voiceChannel: interaction.member.voice.channel.id,
                    textChannel: interaction.channel.id,
                    deaf: true,
                });
            } else {
                player.textChannel = interaction.channel.id;
            }

            const resolve = await client.riffy.resolve({
                query: query,
                requester: interaction.member,
            });

            const { loadType, tracks, playlistInfo } = resolve;

            if (loadType === "playlist") {
                for (const track of resolve.tracks) {
                    track.info.requester = interaction.member;
                    player.queue.add(track);
                }

                await messages.addedPlaylist(interaction, playlistInfo, tracks);
                if (!player.playing && !player.paused) return player.play();
            } else if (loadType === "search" || loadType === "track") {
                const track = tracks.shift();
                track.info.requester = interaction.member;
                const position = player.queue.length + 1;
                player.queue.add(track);

                await messages.addedToQueue(interaction, track, position);
                if (!player.playing && !player.paused) return player.play();
            } else {
                return messages.error(interaction, "¡No se encontraron resultados! Intenta con otro término de búsqueda.");
            }
        } catch (error) {
            console.error(error);
            return messages.error(interaction, "¡Ocurrió un error al reproducir la canción! Por favor, inténtalo de nuevo más tarde.");
        }
    }
};

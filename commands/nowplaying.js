const { SlashCommandBuilder } = require('discord.js');
const messages = require('../utils/messages.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Muestra información de la canción actual'),

    async execute(interaction, client) {
        if (!interaction.member.voice.channel) {
            return messages.error(interaction, '¡Debes estar en un canal de voz!');
        }

        const player = client.riffy.players.get(interaction.guild.id);
        if (!player) return messages.error(interaction, '¡No se está reproduciendo nada!');
        if (!player.current) return messages.error(interaction, '¡Ninguna canción se está reproduciendo actualmente!');

        return messages.nowPlaying(interaction, player.current, player.position);
    }
};

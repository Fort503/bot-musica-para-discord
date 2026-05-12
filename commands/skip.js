const { SlashCommandBuilder } = require('discord.js');
const messages = require('../utils/messages.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Salta la canción actual'),

    async execute(interaction, client) {
        if (!interaction.member.voice.channel) {
            return messages.error(interaction, '¡Debes estar en un canal de voz!');
        }

        const player = client.riffy.players.get(interaction.guild.id);
        if (!player) return messages.error(interaction, '¡No se está reproduciendo nada!');
        if (!player.queue.length) return messages.error(interaction, '¡No hay más canciones en la cola para saltar!');

        player.stop();
        return messages.success(interaction, '¡Se ha saltado la canción actual!');
    }
};

const { SlashCommandBuilder } = require('discord.js');
const messages = require('../utils/messages.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Limpia la cola de reproducción'),

    async execute(interaction, client) {
        if (!interaction.member.voice.channel) {
            return messages.error(interaction, '¡Debes estar en un canal de voz!');
        }

        const player = client.riffy.players.get(interaction.guild.id);
        if (!player) return messages.error(interaction, '¡No se está reproduciendo nada!');
        if (!player.queue.length) return messages.error(interaction, '¡La cola ya está vacía!');

        player.queue.clear();
        return messages.success(interaction, '¡La cola ha sido limpiada!');
    }
};

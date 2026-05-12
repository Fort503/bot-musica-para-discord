const { SlashCommandBuilder } = require('discord.js');
const messages = require('../utils/messages.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Muestra la cola de reproducción actual'),

    async execute(interaction, client) {
        if (!interaction.member.voice.channel) {
            return messages.error(interaction, '¡Debes estar en un canal de voz!');
        }

        const player = client.riffy.players.get(interaction.guild.id);
        if (!player) return messages.error(interaction, '¡No se está reproduciendo nada!');

        const queue = player.queue;
        if (!queue.length && !player.queue.current) {
            return messages.error(interaction, '¡La cola está vacía! Añade algunas canciones con el comando play.');
        }

        return messages.queueList(interaction, queue, player.queue.current);
    }
};

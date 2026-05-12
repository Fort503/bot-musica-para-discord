const { SlashCommandBuilder } = require('discord.js');
const messages = require('../utils/messages.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Elimina una canción de la cola')
        .addIntegerOption(option =>
            option.setName('posición')
                .setDescription('Número de posición en la cola')
                .setRequired(true)
                .setMinValue(1)),

    async execute(interaction, client) {
        if (!interaction.member.voice.channel) {
            return messages.error(interaction, '¡Debes estar en un canal de voz!');
        }

        const player = client.riffy.players.get(interaction.guild.id);
        if (!player) return messages.error(interaction, '¡No se está reproduciendo nada!');

        const position = interaction.options.getInteger('posición');
        if (position > player.queue.length) {
            return messages.error(interaction, `¡Por favor, proporciona una posición de canción válida entre 1 y ${player.queue.length}!`);
        }

        const removed = player.queue.remove(position - 1);
        return messages.success(interaction, `¡Se ha eliminado **${removed.info.title}** de la cola!`);
    }
};

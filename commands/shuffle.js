const { SlashCommandBuilder } = require('discord.js');
const messages = require('../utils/messages.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Mezcla la cola de reproducción'),

    async execute(interaction, client) {
        if (!interaction.member.voice.channel) {
            return messages.error(interaction, '¡Debes estar en un canal de voz!');
        }

        const player = client.riffy.players.get(interaction.guild.id);
        if (!player) return messages.error(interaction, '¡No se está reproduciendo nada!');
        if (!player.queue.length) return messages.error(interaction, '¡No hay suficientes canciones en la cola para mezclar!');

        player.queue.shuffle();
        return messages.success(interaction, `${require('../emojis.js').shuffle} ¡La cola ha sido mezclada!`);
    }
};

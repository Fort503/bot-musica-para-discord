const { SlashCommandBuilder } = require('discord.js');
const messages = require('../utils/messages.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Muestra el estado del reproductor'),

    async execute(interaction, client) {
        const player = client.riffy.players.get(interaction.guild.id);
        if (!player) return messages.error(interaction, '¡No se encontró un reproductor activo!');

        return messages.playerStatus(interaction, player);
    }
};

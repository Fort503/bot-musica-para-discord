const { SlashCommandBuilder } = require('discord.js');
const messages = require('../utils/messages.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Activa/desactiva el modo de repetición'),

    async execute(interaction, client) {
        if (!interaction.member.voice.channel) {
            return messages.error(interaction, '¡Debes estar en un canal de voz!');
        }

        const player = client.riffy.players.get(interaction.guild.id);
        if (!player) return messages.error(interaction, '¡No se está reproduciendo nada!');

        const currentMode = player.loop;
        const newMode = currentMode === "none" ? "queue" : "none";

        player.setLoop(newMode);
        return messages.success(interaction, `¡Modo de repetición ${newMode === "queue" ? "activado" : "desactivado"}!`);
    }
};

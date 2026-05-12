const { SlashCommandBuilder } = require('discord.js');
const messages = require('../utils/messages.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Ajusta el volumen del reproductor')
        .addIntegerOption(option =>
            option.setName('nivel')
                .setDescription('Volumen (0-100)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(100)),

    async execute(interaction, client) {
        if (!interaction.member.voice.channel) {
            return messages.error(interaction, '¡Debes estar en un canal de voz!');
        }

        const player = client.riffy.players.get(interaction.guild.id);
        if (!player) return messages.error(interaction, '¡No se está reproduciendo nada!');

        const volume = interaction.options.getInteger('nivel');
        player.setVolume(volume);
        return messages.success(interaction, `Volumen ajustado a ${volume}%`);
    }
};

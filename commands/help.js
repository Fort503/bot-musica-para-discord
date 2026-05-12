const { SlashCommandBuilder } = require('discord.js');
const messages = require('../utils/messages.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Muestra la lista de comandos disponibles'),

    async execute(interaction, client) {
        const commands = client.commands.map(cmd => ({
            name: cmd.data.name,
            description: cmd.data.description
        }));
        return messages.help(interaction, commands);
    }
};

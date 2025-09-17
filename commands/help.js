const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'help',
    description: 'Muestra una lista de todos los comandos disponibles.',
    execute(interaction) {
        const commandsPath = path.join(__dirname, '.');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Comandos Disponibles')
            .setDescription('Aquí tienes una lista de todos los comandos que puedes usar:');

        for (const file of commandFiles) {
            const command = require(`./${file}`);
            if (command.name && command.description) {
                embed.addFields({ name: `/${command.name}`, value: command.description });
            }
        }

        interaction.reply({ embeds: [embed], ephemeral: true });
    }
};

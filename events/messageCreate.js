const { prefix } = require('../config');

module.exports = {
    name: 'messageCreate',
    execute(message, client) {
        if (message.author.bot) return;
        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.get(commandName);
        if (!command) return;

        try {
            command.execute(message, args, client);
        } catch (error) {
            console.error(error);
            message.reply('Hubo un error al ejecutar el comando.');
        }
    }
};
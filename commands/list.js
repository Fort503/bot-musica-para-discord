const { getQueue } = require('../utils/audioManager');

module.exports = {
    name: 'list',
    description: 'Muestra la cola de canciones',
    async execute(message) {
        const queue = getQueue(message.guild.id);

        if (!queue || queue.length === 0) {
            return message.reply('La cola está vacía.');
        }

        let reply = '**Cola actual:**\n';
        queue.forEach((track, i) => {
            reply += `${i === 0 ? '▶' : `${i}.`} ${track.metadata.title} (pedido por ${track.metadata.requestedBy})\n`;
        });

        message.reply(reply);
    }
};

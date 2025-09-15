const { skipCurrentTrack, getQueue } = require('../utils/audioManager');

module.exports = {
    name: 'skip',
    description: 'Salta la canción actual',
    execute(message, args, client) {
        const queue = getQueue(message.guild.id);
        
        if (queue.length === 0) {
            return message.reply('No hay canciones en la cola para saltar.');
        }
        
        skipCurrentTrack(message.guild.id);
        message.reply('Saltando canción actual...');
    }
};
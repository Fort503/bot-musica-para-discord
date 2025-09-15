const { getQueue, getCurrentTrack } = require('../utils/audioManager');

module.exports = {
    name: 'queue',
    description: 'Muestra la cola de reproducción actual',
    execute(message, args, client) {
        const queue = getQueue(message.guild.id);
        const currentTrack = getCurrentTrack(message.guild.id);
        
        if (queue.length === 0 && !currentTrack) {
            return message.reply('No hay canciones en la cola de reproducción.');
        }
        
        let queueMessage = '**Cola de Reproducción**\n\n';
        
        if (currentTrack) {
            queueMessage += `**Reproduciendo ahora:** ${currentTrack.metadata.title}\n\n`;
        }
        
        if (queue.length > 0) {
            queueMessage += '**Próximas canciones:**\n';
            queue.slice(0, 10).forEach((item, index) => {
                queueMessage += `${index + 1}. ${item.metadata.title} (Solicitado por: ${item.metadata.requestedBy})\n`;
            });
            
            if (queue.length > 10) {
                queueMessage += `\n... y ${queue.length - 10} más`;
            }
        } else {
            queueMessage += 'No hay más canciones en la cola.';
        }
        
        message.reply(queueMessage);
    }
};
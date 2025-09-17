const { skipCurrentTrack, getQueue } = require('../utils/audioManager');

module.exports = {
    name: 'skip',
    description: 'Salta la canción actual',
    execute(interaction, args, client) {
        const queue = getQueue(interaction.guild.id);
        
        if (queue.length === 0) {
            return interaction.reply('No hay canciones en la cola para saltar.');
        }
        
        skipCurrentTrack(interaction.guild.id);
        interaction.reply('Saltando canción actual...');
    }
};
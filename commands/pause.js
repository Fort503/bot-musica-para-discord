const { pauseAudio, getAudioPlayerStatus } = require('../utils/audioManager');

module.exports = {
    name: 'pause',
    description: 'Pausa la reproducción actual',
    execute(message, args, client) {
        const audioStatus = getAudioPlayerStatus(message.guild.id);
        if (audioStatus === 'idle') return message.reply('No hay musica reproduciendose.');

        if (pauseAudio(message.guild.id)) {
            message.reply('Musica pausada');
        } else {
            message.reply('No se pudo pausar la musica.');
        }
    }
};
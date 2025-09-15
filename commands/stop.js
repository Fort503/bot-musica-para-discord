const { stopAudio, getAudioPlayerStatus } = require('../utils/audioManager');

module.exports = {
    name: 'stop',
    description: 'Detiene la reproducción y desconecta al bot',
    execute(message, args, client) {
        const audioStatus = getAudioPlayerStatus(message.guild.id);
        if (audioStatus === 'idle') return message.reply('No hay musica reproduciendose.');

        if (stopAudio(message.guild.id)) {
            message.reply('Reproduccion detenida');
        } else {
            message.reply('No se pudo detener la reproduccion.');
        }
    }
};
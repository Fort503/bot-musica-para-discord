const { resumeAudio, getAudioPlayerStatus } = require('../utils/audioManager');

module.exports = {
    name: 'resume',
    description: 'Reanuda la reproducción pausada',
    execute(message, args, client) {
        const audioStatus = getAudioPlayerStatus(message.guild.id);
        if (audioStatus !== 'paused') return message.reply('La musica no esta pausada.');

        if (resumeAudio(message.guild.id)) {
            message.reply('Musica reanudada');
        } else {
            message.reply('No se pudo reanudar la musica.');
        }
    }
};
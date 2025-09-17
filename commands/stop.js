const { stopAudio, getAudioPlayerStatus } = require('../utils/audioManager');

module.exports = {
    name: 'stop',
    description: 'Detiene la reproducción y desconecta al bot',
    execute(interaction, args, client) {
        const audioStatus = getAudioPlayerStatus(interaction.guild.id);
        if (audioStatus === 'idle') return interaction.reply('No hay musica reproduciendose.');

        if (stopAudio(interaction.guild.id)) {
            interaction.reply('Reproduccion detenida');
        } else {
            interaction.reply('No se pudo detener la reproduccion.');
        }
    }
};
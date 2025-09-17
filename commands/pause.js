const { pauseAudio, getAudioPlayerStatus } = require('../utils/audioManager');

module.exports = {
    name: 'pause',
    description: 'Pausa la reproducción actual',
    execute(interaction, args, client) {
        const audioStatus = getAudioPlayerStatus(interaction.guild.id);
        if (audioStatus === 'idle') return interaction.reply('No hay musica reproduciendose.');

        if (pauseAudio(interaction.guild.id)) {
            interaction.reply('Musica pausada');
        } else {
            interaction.reply('No se pudo pausar la musica.');
        }
    }
};
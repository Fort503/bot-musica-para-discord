const { resumeAudio, getAudioPlayerStatus } = require('../utils/audioManager');

module.exports = {
    name: 'resume',
    description: 'Reanuda la reproducción pausada',
    execute(interaction, args, client) {
        const audioStatus = getAudioPlayerStatus(interaction.guild.id);
        if (audioStatus !== 'paused') return interaction.reply('La musica no esta pausada.');

        if (resumeAudio(interaction.guild.id)) {
            interaction.reply('Musica reanudada');
        } else {
            interaction.reply('No se pudo reanudar la musica.');
        }
    }
};
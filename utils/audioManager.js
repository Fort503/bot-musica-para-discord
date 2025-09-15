const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');

// Mapa para almacenar los reproductores por guild
const guildAudioPlayers = new Map();

function getOrCreateAudioPlayer(guildId) {
    if (!guildAudioPlayers.has(guildId)) {
        const player = createAudioPlayer();
        guildAudioPlayers.set(guildId, { player, connection: null });
        
        player.on('error', error => {
            console.error('Error en el reproductor:', error);
        });
    }
    return guildAudioPlayers.get(guildId);
}

function connectToVoiceChannel(voiceChannel) {
    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });
    
    const audioData = getOrCreateAudioPlayer(voiceChannel.guild.id);
    audioData.connection = connection;
    
    return connection;
}

function playAudioResource(guildId, resource) {
    const audioData = getOrCreateAudioPlayer(guildId);
    audioData.player.play(resource);
    
    if (audioData.connection) {
        audioData.connection.subscribe(audioData.player);
    }
    
    return audioData.player;
}

function pauseAudio(guildId) {
    const audioData = guildAudioPlayers.get(guildId);
    if (audioData && audioData.player.state.status === 'playing') {
        audioData.player.pause();
        return true;
    }
    return false;
}

function resumeAudio(guildId) {
    const audioData = guildAudioPlayers.get(guildId);
    if (audioData && audioData.player.state.status === 'paused') {
        audioData.player.unpause();
        return true;
    }
    return false;
}

function stopAudio(guildId) {
    const audioData = guildAudioPlayers.get(guildId);
    if (audioData) {
        audioData.player.stop();
        if (audioData.connection) {
            audioData.connection.destroy();
        }
        guildAudioPlayers.delete(guildId);
        return true;
    }
    return false;
}

function getAudioPlayerStatus(guildId) {
    const audioData = guildAudioPlayers.get(guildId);
    return audioData ? audioData.player.state.status : 'idle';
}

module.exports = {
    getOrCreateAudioPlayer,
    connectToVoiceChannel,
    playAudioResource,
    pauseAudio,
    resumeAudio,
    stopAudio,
    getAudioPlayerStatus,
    AudioPlayerStatus
};
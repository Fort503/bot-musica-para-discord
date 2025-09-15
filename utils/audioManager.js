const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');

const guildAudioPlayers = new Map();
const guildQueues = new Map();
const guildConnections = new Map();

function getOrCreateAudioPlayer(guildId) {
    if (!guildAudioPlayers.has(guildId)) {
        const player = createAudioPlayer();
        guildAudioPlayers.set(guildId, player);

        player.on('stateChange', (oldState, newState) => {
            if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                playNextInQueue(guildId);
            }
        });
        
        player.on('error', error => {
            console.error('Error en el reproductor:', error);
            playNextInQueue(guildId);
        });
    }
    return guildAudioPlayers.get(guildId);
}

function connectToVoiceChannel(voiceChannel) {
    const guildId = voiceChannel.guild.id;
    
    if (!guildConnections.has(guildId)) {
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });
        
        guildConnections.set(guildId, connection);
        
        const player = getOrCreateAudioPlayer(guildId);
        connection.subscribe(player);
    }
    
    return guildConnections.get(guildId);
}

function addToQueue(guildId, resource, metadata = {}) {
    if (!guildQueues.has(guildId)) {
        guildQueues.set(guildId, []);
    }
    
    const queueItem = {
        resource,
        metadata: {
            title: metadata.title || 'Sin título',
            url: metadata.url || '',
            requestedBy: metadata.requestedBy || 'Unknown',
            ...metadata
        }
    };
    
    guildQueues.get(guildId).push(queueItem);
    return queueItem;
}

function playNextInQueue(guildId) {
    if (!guildQueues.has(guildId) || guildQueues.get(guildId).length === 0) {
        const player = getOrCreateAudioPlayer(guildId);
        player.stop();
        return null;
    }
    
    const nextItem = guildQueues.get(guildId).shift();
    const player = getOrCreateAudioPlayer(guildId);
    
    try {
        player.play(nextItem.resource);
        return nextItem;
    } catch (error) {
        console.error('Error al reproducir siguiente canción:', error);
        return playNextInQueue(guildId);
    }
}

function playAudioResource(guildId, resource, metadata = {}) {
    const player = getOrCreateAudioPlayer(guildId);

    if (player.state.status === AudioPlayerStatus.Playing || player.state.status === AudioPlayerStatus.Paused) {
        const queueItem = addToQueue(guildId, resource, metadata);
        return { player, status: 'queued', queueItem };
    }

    try {
        player.play(resource);
        return { player, status: 'playing' };
    } catch (error) {
        console.error('Error al reproducir:', error);
        throw error;
    }
}

function getQueue(guildId) {
    return guildQueues.get(guildId) || [];
}

function clearQueue(guildId) {
    if (guildQueues.has(guildId)) {
        guildQueues.set(guildId, []);
    }
}

function skipCurrentTrack(guildId) {
    const player = getOrCreateAudioPlayer(guildId);
    player.stop();
}

function pauseAudio(guildId) {
    const player = getOrCreateAudioPlayer(guildId);
    if (player.state.status === AudioPlayerStatus.Playing) {
        player.pause();
        return true;
    }
    return false;
}

function resumeAudio(guildId) {
    const player = getOrCreateAudioPlayer(guildId);
    if (player.state.status === AudioPlayerStatus.Paused) {
        player.unpause();
        return true;
    }
    return false;
}

function stopAudio(guildId) {
    const player = getOrCreateAudioPlayer(guildId);
    player.stop();
    clearQueue(guildId);
    
    if (guildConnections.has(guildId)) {
        guildConnections.get(guildId).destroy();
        guildConnections.delete(guildId);
    }
    
    return true;
}

function getAudioPlayerStatus(guildId) {
    const player = getOrCreateAudioPlayer(guildId);
    return player.state.status;
}

function getCurrentTrack(guildId) {
    const player = getOrCreateAudioPlayer(guildId);
    if (player.state.status !== AudioPlayerStatus.Idle && guildQueues.has(guildId)) {
        const queue = guildQueues.get(guildId);
        if (queue.length > 0) {
            return queue[0];
        }
    }
    return null;
}

module.exports = {
    getOrCreateAudioPlayer,
    connectToVoiceChannel,
    playAudioResource,
    addToQueue,
    getQueue,
    clearQueue,
    skipCurrentTrack,
    pauseAudio,
    resumeAudio,
    stopAudio,
    getAudioPlayerStatus,
    getCurrentTrack,
    AudioPlayerStatus
};
const scdl = require('soundcloud-downloader').default;

async function searchSoundcloudTrack(query) {
    try {
        const results = await scdl.search({ query, limit: 1, resourceType: 'tracks' });
        
        if (!results || !results.collection || results.collection.length === 0) {
            return null;
        }
        
        return results.collection[0];
    } catch (error) {
        console.error('Error en búsqueda de SoundCloud:', error);
        throw error;
    }
}

async function downloadSoundcloudTrack(url) {
    try {
        return await scdl.download(url);
    } catch (error) {
        console.error('Error al descargar de SoundCloud:', error);
        throw error;
    }
}

function isValidSoundcloudUrl(url) {
    return scdl.isValidUrl(url);
}

module.exports = {
    searchSoundcloudTrack,
    downloadSoundcloudTrack,
    isValidSoundcloudUrl
};
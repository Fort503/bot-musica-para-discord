const scdl = require('soundcloud-downloader').default;

module.exports = {
    name: 'search',
    description: 'Buscar canciones en SoundCloud',
    async execute(message, args) {
        if (!args.length) {
            return message.reply('Debes escribir el nombre de la canción que quieres buscar.');
        }

        const query = args.join(' ');

        try {
            const results = await scdl.search({
                query,
                resourceType: 'tracks',
                limit: 5,
                clientID: process.env.SOUNDCLOUD_CLIENT_ID
            });

            if (!results.collection.length) {
                return message.reply('No encontré resultados.');
            }

            let response = `Resultados de búsqueda para **${query}**:\n\n`;

            results.collection.forEach((track, index) => {
                const duration = (track.duration / 1000 / 60).toFixed(2);
                response += `${index + 1}. **${track.title}** — ${track.user.username}— ${duration} min\n`;
            });

            message.client.searchCache = message.client.searchCache || {};
            message.client.searchCache[message.author.id] = results.collection;

            message.reply(response);

        } catch (error) {
            console.error('Error al buscar en SoundCloud:', error);
            message.reply('Hubo un error al buscar la canción.');
        }
    }
};

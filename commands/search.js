const scdl = require('soundcloud-downloader').default;

module.exports = {
    name: 'search',
    description: 'Buscar canciones en SoundCloud',
    options: [
        {
            name: 'query',
            description: 'La canción que quieres buscar',
            type: 3, // STRING
            required: true,
        },
    ],
    async execute(interaction, args) {
        let query = interaction.options.getString('query');
        if (!query) {
            if (!args || args.length === 0) {
                return interaction.reply('Debes escribir el nombre de la canción que quieres buscar.');
            }
            query = args.join(' ');
        }


        try {
            const results = await scdl.search({
                query,
                resourceType: 'tracks',
                limit: 5,
                clientID: process.env.SOUNDCLOUD_CLIENT_ID
            });

            if (!results.collection.length) {
                return interaction.reply('No encontré resultados.');
            }

            let response = `Resultados de búsqueda para **${query}**:\n\n`;

            results.collection.forEach((track, index) => {
                const duration = (track.duration / 1000 / 60).toFixed(2);
                response += `${index + 1}. **${track.title}** — ${track.user.username}— ${duration} min\n`;
            });

            interaction.client.searchCache = interaction.client.searchCache || {};
            interaction.client.searchCache[interaction.user.id] = results.collection;

            interaction.reply(response);

        } catch (error) {
            console.error('Error al buscar en SoundCloud:', error);
            interaction.reply('Hubo un error al buscar la canción.');
        }
    }
};

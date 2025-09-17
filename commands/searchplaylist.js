const scdl = require('soundcloud-downloader').default;

module.exports = {
    name: 'searchplaylist',
    description: 'Busca playlists en SoundCloud',
    options: [
        {
            name: 'query',
            description: 'El término para buscar playlists',
            type: 3, // STRING
            required: true,
        },
    ],
    async execute(interaction, args) {
        let query = interaction.options.getString('query');
        if (!query) {
            if (!args || args.length === 0) {
                return interaction.reply('Debes poner un término para buscar playlists.');
            }
            query = args.join(' ');
        }

        try {
            const results = await scdl.search({
                query,
                resourceType: 'playlists',
                limit: 5
            });

            if (!results.collection.length) {
                return interaction.reply('No se encontraron playlists.');
            }

            let reply = '**Playlists encontradas:**\n';
            results.collection.forEach((pl, i) => {
                reply += `${i + 1}. **${pl.title}** por ${pl.user.username} → ${pl.permalink_url}\n`;
            });

            interaction.reply(reply);
        } catch (error) {
            console.error('Error al buscar playlists:', error);
            interaction.reply('Error al buscar playlists en SoundCloud.');
        }
    }
};

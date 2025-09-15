const scdl = require('soundcloud-downloader').default;

module.exports = {
    name: 'searchplaylist',
    description: 'Busca playlists en SoundCloud',
    async execute(message, args) {
        if (!args[0]) return message.reply('Debes poner un término para buscar playlists.');

        const query = args.join(' ');
        try {
            const results = await scdl.search({
                query,
                resourceType: 'playlists',
                limit: 5
            });

            if (!results.collection.length) {
                return message.reply('No se encontraron playlists.');
            }

            let reply = '**Playlists encontradas:**\n';
            results.collection.forEach((pl, i) => {
                reply += `${i + 1}. **${pl.title}** por ${pl.user.username} → ${pl.permalink_url}\n`;
            });

            message.reply(reply);
        } catch (error) {
            console.error('Error al buscar playlists:', error);
            message.reply('Error al buscar playlists en SoundCloud.');
        }
    }
};

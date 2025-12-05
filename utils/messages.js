const { EmbedBuilder } = require('discord.js');
const emojis = require('../emojis.js');
const config = require('../config.js');

function formatDuration(ms) {
    // Return 'EN VIVO' for streams
    if (!ms || ms <= 0 || ms === 'Infinity') return 'EN VIVO';

    // Convert to seconds
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    // Format based on length
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function getDurationString(track) {
    if (track.info.isStream) return 'EN VIVO';
    if (!track.info.length) return 'N/D';
    return formatDuration(track.info.length);
}

module.exports = {
    success: (channel, message) => {
        return channel.send(`${emojis.success} | ${message}`);
    },

    error: (channel, message) => {
        return channel.send(`${emojis.error} | ${message}`);
    },

    nowPlaying: (channel, track) => {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.music} Reproduciendo Ahora`)
            .setDescription(`${track.info.title}`);

        if (track.info.thumbnail && typeof track.info.thumbnail === 'string') {
            embed.setThumbnail(track.info.thumbnail);
        }

        embed.addFields([
            { name: 'Artista', value: `${emojis.info} ${track.info.author}`, inline: true },
            { name: 'Duración', value: `${emojis.time} ${getDurationString(track)}`, inline: true },
            { name: 'Solicitado por', value: `${emojis.info} ${track.info.requester.tag}`, inline: true }
        ])
        .setFooter({ text: 'Usa !help para ver todos los comandos' });

        return channel.send({ embeds: [embed] });
    },

    addedToQueue: (channel, track, position) => {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(`${emojis.success} Añadido a la cola: ${track.info.title}`);

        if (track.info.thumbnail && typeof track.info.thumbnail === 'string') {
            embed.setThumbnail(track.info.thumbnail);
        }

        embed.addFields([
            { name: 'Artista', value: `${emojis.info} ${track.info.author}`, inline: true },
            { name: 'Duración', value: `${emojis.time} ${getDurationString(track)}`, inline: true },
            { name: 'Posición', value: `${emojis.queue} #${position}`, inline: true }
        ]);

        return channel.send({ embeds: [embed] });
    },

    addedPlaylist: (channel, playlistInfo, tracks) => {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.success} Playlist Añadida`)
            .setDescription(`**${playlistInfo.name}**`);

        if (playlistInfo.thumbnail && typeof playlistInfo.thumbnail === 'string') {
            embed.setThumbnail(playlistInfo.thumbnail);
        }

        // Calculate total duration excluding streams
        const totalDuration = tracks.reduce((acc, track) => {
            if (!track.info.isStream && track.info.length) {
                return acc + track.info.length;
            }
            return acc;
        }, 0);

        embed.addFields([
            { name: 'Total de Canciones', value: `${emojis.queue} ${tracks.length} canciones`, inline: true },
            { name: 'Duración Total', value: `${emojis.time} ${formatDuration(totalDuration)}`, inline: true },
            { name: 'Nº de Transmisiones', value: `${emojis.info} ${tracks.filter(t => t.info.isStream).length} transmisiones`, inline: true }
        ])
        .setFooter({ text: 'La playlist comenzará a reproducirse pronto' });

        return channel.send({ embeds: [embed] });
    },

    queueEnded: (channel) => {
        return channel.send(`${emojis.info} | La cola ha terminado. Saliendo del canal de voz.`);
    },

    queueList: (channel, queue, currentTrack, currentPage = 1, totalPages = 1) => {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.queue} Lista de Reproducción`);

        if (currentTrack) {
            embed.setDescription(
                `**Reproduciendo Ahora:**\n${emojis.play} ${currentTrack.info.title} - ${getDurationString(currentTrack)}\n\n**A Continuación:**`
            );

            if (currentTrack.info.thumbnail && typeof currentTrack.info.thumbnail === 'string') {
                embed.setThumbnail(currentTrack.info.thumbnail);
            }
        } else {
            embed.setDescription("**Cola de reproducción:**");
        }

        if (queue.length) {
            const tracks = queue.map((track, i) => 
                `\`${(i + 1).toString().padStart(2, '0')}\` ${emojis.song} ${track.info.title} - \`${getDurationString(track)}\``
            ).join('\n');
            embed.addFields({ name: '\u200b', value: tracks });

            // Calculate total duration excluding streams
            const totalDuration = queue.reduce((acc, track) => {
                if (!track.info.isStream && track.info.length) {
                    return acc + track.info.length;
                }
                return acc;
            }, 0);

            const streamCount = queue.filter(t => t.info.isStream).length;
            const durationText = streamCount > 0 
                ? `Duración Total: ${formatDuration(totalDuration)} (${streamCount} transmisiones)`
                : `Duración Total: ${formatDuration(totalDuration)}`;

            embed.setFooter({ 
                text: `Total de Canciones: ${queue.length} • ${durationText} • Página ${currentPage}/${totalPages}` 
            });
        } else {
            embed.addFields({ name: '\u200b', value: 'No hay canciones en la cola' });
            embed.setFooter({ text: `Página ${currentPage}/${totalPages}` });
        }

        return channel.send({ embeds: [embed] });
    },

    playerStatus: (channel, player) => {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.info} Estado del Reproductor`)
            .addFields([
                { 
                    name: 'Estado', 
                    value: player.playing ? `${emojis.play} Reproduciendo` : `${emojis.pause} Pausado`, 
                    inline: true 
                },
                { 
                    name: 'Volumen', 
                    value: `${emojis.volume} ${player.volume}%`, 
                    inline: true 
                },
                { 
                    name: 'Modo Bucle', 
                    value: `${emojis.repeat} ${player.loop === "queue" ? 'Cola' : 'Desactivado'}`, 
                    inline: true 
                }
            ]);

        if (player.queue.current) {
            const track = player.queue.current;
            embed.setDescription(
                `**Reproduciendo Actualmente:**\n${emojis.music} ${track.info.title}\n` +
                `${emojis.time} Duración: ${getDurationString(track)}`
            );
            
            if (track.info.thumbnail && typeof track.info.thumbnail === 'string') {
                embed.setThumbnail(track.info.thumbnail);
            }
        }

        return channel.send({ embeds: [embed] });
    },

    help: (channel, commands) => {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.info} Comandos Disponibles`)
            .setDescription(commands.map(cmd => 
                `${emojis.music} \`${cmd.name}\` - ${cmd.description}`
            ).join('\n'))
            .setFooter({ text: 'Prefijo: ! • Ejemplo: !play <nombre de la canción>' });
        return channel.send({ embeds: [embed] });
    }
}; 
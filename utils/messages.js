const { EmbedBuilder } = require('discord.js');
const emojis = require('../emojis.js');
const config = require('../config.js');

function formatDuration(ms) {
    if (!ms || ms <= 0 || ms === 'Infinity') return 'EN VIVO';

    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

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
            .setAuthor({ name: "Reproduciendo Ahora" })
            .setTitle(track.info.title)
            .setURL(track.info.uri);

        if (track.info.thumbnail && typeof track.info.thumbnail === 'string') {
            embed.setThumbnail(track.info.thumbnail);
        }

        embed.addFields([
            { name: 'Artista', value: track.info.author, inline: true },
            { name: 'Duración', value: getDurationString(track), inline: true },
            { name: 'Solicitado por', value: `${track.info.requester}`, inline: true }
        ])
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
            { name: 'Artista', value: track.info.author, inline: true },
            { name: 'Posición en la cola', value: `\`#${position}\``, inline: true },
            { name: 'Duración', value: `\`${getDurationString(track)}\``, inline: true },
        ]);
    
        return channel.send({ embeds: [embed] });
    },

    addedPlaylist: (channel, playlistInfo, tracks) => {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.success} Playlist Añadida`)
            .setDescription(`Se añadieron **${tracks.length}** canciones de la playlist **${playlistInfo.name}** a la cola.`);
    
        if (playlistInfo.thumbnail && typeof playlistInfo.thumbnail === 'string') {
            embed.setThumbnail(playlistInfo.thumbnail);
        }

        const totalDuration = tracks.reduce((acc, track) => {
            if (!track.info.isStream && track.info.length) {
                return acc + track.info.length;
            }
            return acc;
        }, 0);

        embed.addFields([
            { name: 'Canciones', value: `\`${tracks.length}\``, inline: true },
            { name: 'Duración Total', value: `\`${formatDuration(totalDuration)}\``, inline: true },
            { name: 'Transmisiones en vivo', value: `\`${tracks.filter(t => t.info.isStream).length}\``, inline: true }
        ]);
        return channel.send({ embeds: [embed] });
    },

    queueEnded: (channel) => {
        return channel.send(`${emojis.info} | La cola ha terminado. Saliendo del canal de voz.`);
    },

    queueList: (channel, queue, currentTrack, currentPage = 1, totalPages = 1) => {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor);

        if (currentTrack) {
            embed.setAuthor({ name: "Cola de Reproducción" });
            embed.setDescription(
                `**${emojis.play} Reproduciendo Ahora**\n${currentTrack.info.title} - \`${getDurationString(currentTrack)}\`\n\n**${emojis.queue} A Continuación:**`
            ); 

            if (currentTrack.info.thumbnail && typeof currentTrack.info.thumbnail === 'string') {
                embed.setThumbnail(currentTrack.info.thumbnail);
            }
        } else {
            embed.setDescription("**Cola de reproducción:**");
        }

        if (queue.length) {
            const tracks = queue.map((track, i) => 
                `\`${(i + 1).toString().padStart(2, '0')}.\` ${track.info.title.substring(0, 40)} - \`${getDurationString(track)}\``
            ).join('\n');
            embed.addFields({ name: `Total: ${queue.length} canciones`, value: tracks });

            const totalDuration = queue.reduce((acc, track) => {
                if (!track.info.isStream && track.info.length) {
                    return acc + track.info.length;
                }
                return acc;
            }, 0);

            const streamCount = queue.filter(t => t.info.isStream).length;
            const durationText = streamCount > 0 
                ? `Duración: ${formatDuration(totalDuration)} (+${streamCount} en vivo)`
                : `Duración: ${formatDuration(totalDuration)}`;

            embed.setFooter({ 
                text: `${durationText} • Página ${currentPage}/${totalPages}` 
            });
        } else {
            embed.setFooter({ text: `Página ${currentPage}/${totalPages}` });
        }

        return channel.send({ embeds: [embed] });
    },

    playerStatus: (channel, player) => {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setAuthor({ name: "Estado del Reproductor" });

        if (player.queue.current) {
            const track = player.queue.current;
            embed.setDescription(
                `**Reproduciendo:**\n${track.info.title}`
            );
            
            embed.addFields([
                { 
                    name: 'Estado', 
                    value: player.playing ? `${emojis.play} Reproduciendo` : `${emojis.pause} Pausado`, 
                    inline: true 
                },
                { 
                    name: 'Volumen', 
                    value: `${emojis.volume} \`${player.volume}%\``, 
                    inline: true 
                },
                { 
                    name: 'Repetición', 
                    value: `${emojis.repeat} \`${player.loop === "queue" ? 'Cola' : 'Desactivado'}\``, 
                    inline: true 
                }
            ]);
            
            if (track.info.thumbnail && typeof track.info.thumbnail === 'string') {
                embed.setThumbnail(track.info.thumbnail);
            }
        }

        return channel.send({ embeds: [embed] });
    },

    help: (channel, commands) => {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setAuthor({ name: "Ayuda de Comandos" })
            .setDescription(commands.map(cmd => 
                `\`${config.prefix}${cmd.name}\` - ${cmd.description}`
            ).join('\n'))
            .setFooter({ text: `Ejemplo: ${config.prefix}play <nombre de la canción>` });
        return channel.send({ embeds: [embed] });
    }
}; 
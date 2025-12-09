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
            .setAuthor({ name: "Reproduciendo Ahora", iconURL: channel.client.user.displayAvatarURL() })
            .setTitle(track.info.title)
            .setURL(track.info.uri)
            .setFooter({ text: `Solicitado por ${track.info.requester.user.tag}`, iconURL: track.info.requester.displayAvatarURL() });

        if (track.info.thumbnail && typeof track.info.thumbnail === 'string') {
            embed.setThumbnail(track.info.thumbnail);
        }

        const fields = [
            { name: `${emojis.music} Artista`, value: track.info.author, inline: true },
            { name: `${emojis.time} Duración`, value: `\`${getDurationString(track)}\``, inline: true }
        ];

        if (track.info.requester && track.info.requester.voice && track.info.requester.voice.channel) {
            fields.push({ name: 'Canal de Voz', value: `<#${track.info.requester.voice.channel.id}>`, inline: true });
        }

        embed.addFields(fields);
        return channel.send({ embeds: [embed] });
    },

    addedToQueue: (channel, track, position) => {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setAuthor({ name: "Añadido a la Cola", iconURL: channel.client.user.displayAvatarURL() })
            .setDescription(`${track.info.title}`)
            .setFooter({ text: `Solicitado por ${track.info.requester.user.tag}`, iconURL: track.info.requester.displayAvatarURL() });
    
        if (track.info.thumbnail && typeof track.info.thumbnail === 'string') {
            embed.setThumbnail(track.info.thumbnail);
        }
    
        embed.addFields([
            { name: 'Artista', value: track.info.author, inline: true },
            { name: 'Posición', value: `\`#${position}\``, inline: true },
            { name: 'Duración', value: `\`${getDurationString(track)}\``, inline: true },
        ]);
    
        return channel.send({ embeds: [embed] });
    },

    addedPlaylist: (channel, playlistInfo, tracks) => {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setAuthor({ name: "Playlist Añadida", iconURL: channel.client.user.displayAvatarURL() })
            .setTitle(playlistInfo.name)
            .setDescription(`Se añadieron **${tracks.length}** canciones a la cola.`);
    
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
            { name: 'Total de Canciones', value: `\`${tracks.length}\``, inline: true },
            { name: 'Duración Estimada', value: `\`${formatDuration(totalDuration)}\``, inline: true },
            { name: 'En Vivo', value: `\`${tracks.filter(t => t.info.isStream).length}\``, inline: true }
        ])
        .setFooter({ text: `Solicitado por ${tracks[0].info.requester.user.tag}`, iconURL: tracks[0].info.requester.displayAvatarURL() });
        return channel.send({ embeds: [embed] });
    },

    queueEnded: (channel) => {
        return channel.send(`${emojis.info} | La cola ha terminado. Saliendo del canal de voz.`);
    },

    queueList: (channel, queue, currentTrack, currentPage = 1, totalPages = 1) => {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor);

        if (currentTrack) {
            embed.setAuthor({ name: "Cola de Reproducción", iconURL: channel.client.user.displayAvatarURL() });
            embed.setDescription(
                `**${emojis.play} Reproduciendo Ahora**\n${currentTrack.info.title} - \`${getDurationString(currentTrack)}\`\n\n**${emojis.queue} A Continuación:**`
            ); 

            if (currentTrack.info.thumbnail && typeof currentTrack.info.thumbnail === 'string') {
                embed.setThumbnail(currentTrack.info.thumbnail);
            }
        } else {
            embed.setAuthor({ name: "Cola de Reproducción", iconURL: channel.client.user.displayAvatarURL() });
            embed.setDescription("La cola está vacía.");
        }

        if (queue.length) {
            const tracks = queue.map((track, i) => 
                `\`${(i + 1).toString().padStart(2, '0')}.\` ${track.info.title.substring(0, 35)}... - \`${getDurationString(track)}\``
            ).join('\n');
            embed.addFields({ name: `\u200b`, value: tracks });

            const totalDuration = queue.reduce((acc, track) => {
                if (!track.info.isStream && track.info.length) {
                    return acc + track.info.length;
                }
                return acc;
            }, 0);

            const streamCount = queue.filter(t => t.info.isStream).length;
            const durationText = streamCount > 0 
                ? ` | Duración: ${formatDuration(totalDuration)} (+${streamCount} en vivo)`
                : ` | Duración: ${formatDuration(totalDuration)}`;

            embed.setFooter({ 
                text: `${queue.length} canciones en cola${durationText} • Página ${currentPage}/${totalPages}` 
            });
        } else {
            embed.setFooter({ text: `La cola está vacía • Página ${currentPage}/${totalPages}` });
        }

        return channel.send({ embeds: [embed] });
    },

    playerStatus: (channel, player) => {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setAuthor({ name: "Estado del Reproductor", iconURL: channel.client.user.displayAvatarURL() });

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
                    value: `${emojis.repeat} \`${player.loop === "queue" ? 'Cola' : (player.loop === "track" ? 'Canción' : 'Desactivado')}\``, 
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
            .setAuthor({ name: "Ayuda de Comandos", iconURL: channel.client.user.displayAvatarURL() })
            .setDescription(commands.map(cmd => 
                `\`${config.prefix}${cmd.name}\` - ${cmd.description}`
            ).join('\n'))
            .setFooter({ text: `${channel.client.user.username} | Prefijo: ${config.prefix}` });
        return channel.send({ embeds: [embed] });
    }
}; 
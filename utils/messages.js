const { EmbedBuilder } = require('discord.js');
const emojis = require('../emojis.js');
const config = require('../config.js');

async function sendOrReply(context, options) {
    if (!context) return;
    if (context.reply) {
        if (context.deferred || context.replied) {
            return context.followUp(options);
        }
        return context.reply(options);
    }
    if (context.send) {
        return context.send(options);
    }
}

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

function createProgressBar(current, total, size = 12) {
    if (!current || !total || total <= 0) return '';
    const progress = Math.min(current / total, 1);
    const filled = Math.round(progress * size);
    const empty = size - filled;
    return '█'.repeat(filled) + '░'.repeat(empty) + ` \`${formatDuration(current)} / ${formatDuration(total)}\``;
}

function createBaseEmbed() {
    return new EmbedBuilder()
        .setColor(config.embedColor)
        .setTimestamp();
}

function setRequesterFooter(embed, requester) {
    if (requester) {
        embed.setFooter({
            text: `Solicitado por ${requester.user?.tag || 'Desconocido'}`,
            iconURL: requester.displayAvatarURL?.() || requester.user?.displayAvatarURL?.()
        });
    }
    return embed;
}

function setThumbnail(embed, track) {
    if (track?.info?.thumbnail && typeof track.info.thumbnail === 'string') {
        embed.setThumbnail(track.info.thumbnail);
    }
    return embed;
}

module.exports = {
    success: async (context, message) => {
        const embed = createBaseEmbed()
            .setColor('#00c853')
            .setDescription(`${emojis.success} ${message}`);
        return sendOrReply(context, { embeds: [embed] });
    },

    error: async (context, message) => {
        const embed = createBaseEmbed()
            .setColor('#ff1744')
            .setDescription(`${emojis.error} ${message}`);
        return sendOrReply(context, { embeds: [embed] });
    },

    nowPlaying: async (context, track, playerPosition) => {
        const embed = createBaseEmbed()
            .setAuthor({
                name: "▶  Reproduciendo Ahora",
                iconURL: context.client?.user?.displayAvatarURL()
            })
            .setTitle(track.info.title)
            .setURL(track.info.uri);

        let desc = `${emojis.music} **Artista:** ${track.info.author}\n${emojis.time} **Duración:** \`${getDurationString(track)}\``;

        if (!track.info.isStream && track.info.length && playerPosition > 0) {
            desc += `\n\n${createProgressBar(playerPosition, track.info.length)}`;
        }

        embed.setDescription(desc);
        setThumbnail(embed, track);
        setRequesterFooter(embed, track.info.requester);

        return sendOrReply(context, { embeds: [embed] });
    },

    addedToQueue: async (context, track, position) => {
        const embed = createBaseEmbed()
            .setAuthor({
                name: "➕  Añadido a la Cola",
                iconURL: context.client?.user?.displayAvatarURL()
            })
            .setTitle(track.info.title)
            .setURL(track.info.uri)
            .setDescription(
                `${emojis.music} **Artista:** ${track.info.author}\n` +
                `${emojis.queue} **Posición:** \`#${position}\`\n` +
                `${emojis.time} **Duración:** \`${getDurationString(track)}\``
            );

        setThumbnail(embed, track);
        setRequesterFooter(embed, track.info.requester);

        return sendOrReply(context, { embeds: [embed] });
    },

    addedPlaylist: async (context, playlistInfo, tracks) => {
        const totalDuration = tracks.reduce((acc, track) => {
            if (!track.info.isStream && track.info.length) return acc + track.info.length;
            return acc;
        }, 0);

        const embed = createBaseEmbed()
            .setAuthor({
                name: "📑  Playlist Añadida",
                iconURL: context.client?.user?.displayAvatarURL()
            })
            .setTitle(playlistInfo.name)
            .setDescription(`Se añadieron **${tracks.length}** canciones a la cola.`)
            .addFields([
                { name: `${emojis.queue} Total`, value: `\`${tracks.length}\``, inline: true },
                { name: `${emojis.time} Duración`, value: `\`${formatDuration(totalDuration)}\``, inline: true },
                { name: `${emojis.play} En Vivo`, value: `\`${tracks.filter(t => t.info.isStream).length}\``, inline: true }
            ]);

        if (playlistInfo.thumbnail && typeof playlistInfo.thumbnail === 'string') {
            embed.setThumbnail(playlistInfo.thumbnail);
        }
        setRequesterFooter(embed, tracks[0]?.info?.requester);

        return sendOrReply(context, { embeds: [embed] });
    },

    queueEnded: async (context) => {
        const embed = createBaseEmbed()
            .setColor('#ff6d00')
            .setDescription(`${emojis.info} La cola ha terminado. Saliendo del canal de voz.`);
        return sendOrReply(context, { embeds: [embed] });
    },

    queueList: async (context, queue, currentTrack, currentPage = 1, totalPages = 1) => {
        const embed = createBaseEmbed()
            .setAuthor({
                name: "📜  Cola de Reproducción",
                iconURL: context.client?.user?.displayAvatarURL()
            });

        if (currentTrack) {
            let desc = `**▶ Reproduciendo Ahora**\n[${currentTrack.info.title}](${currentTrack.info.uri}) - \`${getDurationString(currentTrack)}\``;

            if (currentTrack.info.requester) {
                desc += ` — *${currentTrack.info.requester.user.username}*`;
            }

            if (queue.length) {
                desc += `\n\n**📋 A Continuación:**`;
            }

            embed.setDescription(desc);
            setThumbnail(embed, currentTrack);
        } else {
            embed.setDescription("La cola está vacía.");
        }

        if (queue.length) {
            const tracks = queue.map((track, i) => {
                const num = (i + 1).toString().padStart(2, '0');
                return `\`${num}.\` [${track.info.title}](${track.info.uri}) - \`${getDurationString(track)}\``;
            }).join('\n');

            embed.addFields({ name: `\u200b`, value: tracks });

            const totalDuration = queue.reduce((acc, track) => {
                if (!track.info.isStream && track.info.length) return acc + track.info.length;
                return acc;
            }, 0);

            const streamCount = queue.filter(t => t.info.isStream).length;
            let footerText = `${queue.length} canciones en cola`;
            footerText += ` • Duración: ${formatDuration(totalDuration)}`;
            if (streamCount > 0) footerText += ` (+${streamCount} en vivo)`;
            footerText += ` • Página ${currentPage}/${totalPages}`;

            embed.setFooter({ text: footerText });
        } else {
            embed.setFooter({ text: `La cola está vacía • Página ${currentPage}/${totalPages}` });
        }

        return sendOrReply(context, { embeds: [embed] });
    },

    playerStatus: async (context, player) => {
        const embed = createBaseEmbed()
            .setAuthor({
                name: "🎛️  Estado del Reproductor",
                iconURL: context.client?.user?.displayAvatarURL()
            });

        if (player.queue.current) {
            const track = player.queue.current;
            let desc = `**Reproduciendo:** [${track.info.title}](${track.info.uri})`;

            if (!track.info.isStream && track.info.length && player.position) {
                desc += `\n\n${createProgressBar(player.position, track.info.length, 14)}`;
            }

            embed.setDescription(desc);
            embed.addFields([
                { name: 'Estado', value: player.playing ? `${emojis.play} Reproduciendo` : `${emojis.pause} Pausado`, inline: true },
                { name: 'Volumen', value: `${emojis.volume} \`${player.volume}%\``, inline: true },
                { name: 'Repetición', value: `${emojis.repeat} \`${player.loop === "queue" ? 'Cola' : (player.loop === "track" ? 'Canción' : 'Desactivado')}\``, inline: true }
            ]);
            setThumbnail(embed, track);
        }

        return sendOrReply(context, { embeds: [embed] });
    },

    help: async (context, commands) => {
        const isInteraction = !!(context?.reply);
        const prefix = isInteraction ? '/' : config.prefix;

        const embed = createBaseEmbed()
            .setAuthor({
                name: "📖  Ayuda de Comandos",
                iconURL: context.client?.user?.displayAvatarURL()
            })
            .setDescription(commands.map(cmd =>
                `\`${prefix}${cmd.name}\` — ${cmd.description}`
            ).join('\n'))
            .setFooter({ text: `${context.client?.user?.username || 'Bot'} | ${isInteraction ? 'Comandos Slash' : `Prefijo: ${config.prefix}`} | ${commands.length} comandos` });
        return sendOrReply(context, { embeds: [embed] });
    }
};

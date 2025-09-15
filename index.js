const { Player } = require('discord-player');
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { YoutubeiExtractor } = require('discord-player-youtubei');
const path = require('path');
require('dotenv').config();
global.crypto = require('crypto');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates
    ],
});

const player = new Player(client);
player.extractors.register(YoutubeiExtractor);

let currentPlayerMessage = null; 

client.once('clientReady', () => {
    console.log(`✅ Bot conectado como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'player') {
        if (currentPlayerMessage) {
            await currentPlayerMessage.delete();
        }

        await updateMusicPanel(message.channel);
    }

    if (command === 'play') {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('❌ Debes estar en un canal de voz.');
    
        const query = args.join(' ');
        if (!query) return message.reply('❌ Debes especificar una canción.');
    
        try {
            let queue = player.nodes.get(message.guild.id);
    
            if (!queue) {
                queue = player.nodes.create(message.guild.id, {
                    metadata: { channel: message.channel },
                    selfDeaf: true,
                    volume: 20,
                    leaveOnEmpty: true,
                    leaveOnEmptyCooldown: 10000,
                    leaveOnEnd: false,
                    leaveOnEndCooldown: 10000,
                });
            }
    
            const { track } = await player.play(voiceChannel, query, {
                nodeOptions: queue,
            });
    
            message.reply(`🎶 **${track.title}** ha sido agregada a la cola.`);
        } catch (error) {
            console.error('❌ Error al intentar reproducir:', error);
            message.reply('❌ Ocurrió un error al intentar reproducir la canción.');
        }
    }

    if (command === 'stop') {
        const queue = player.nodes.get(message.guild.id);
        if (!queue || !queue.isPlaying()) return message.reply('❌ No hay música en reproducción.');
        queue.delete();
        message.reply('⏹ Música detenida.');
    }

    if (command === 'skip') {
        const queue = player.nodes.get(message.guild.id);
        if (!queue || !queue.isPlaying()) return message.reply('❌ No hay música en reproducción.');
        queue.node.skip();
        message.reply('⏭ Canción saltada.');
    }

    if (command === 'pause') {
        const queue = player.nodes.get(message.guild.id);
        if (!queue || !queue.isPlaying()) return message.reply('❌ No hay música en reproducción.');
        queue.node.setPaused(true);
        message.reply('⏸ Música pausada.');
    }

    if (command === 'resume') {
        const queue = player.nodes.get(message.guild.id);
        if (!queue || !queue.isPlaying()) return message.reply('❌ No hay música pausada.');
        queue.node.setPaused(false);
        message.reply('▶ Música reanudada.');
    }

    if (command === 'volume') {
        const queue = player.nodes.get(message.guild.id);
        if (!queue || !queue.isPlaying()) return message.reply('❌ No hay música en reproducción.');
        const volume = parseInt(args[0]);
        if (isNaN(volume) || volume < 0 || volume > 100) return message.reply('❌ Especifica un volumen entre 0 y 100.');
        queue.node.setVolume(volume);
        message.reply(`🔊 Volumen ajustado a **${volume}%**`);
    }

    if (command === 'list') {
        const queue = player.nodes.get(message.guild.id);
        if (!queue || queue.tracks.size === 0) return message.reply('❌ La lista de reproducción está vacía.');
    
        const tracks = queue.tracks.map((track, index) => `\`${index + 1}.\` **${track.title}** - ${track.author}`).join('\n');
    
        message.reply(`🎵 **Lista de reproducción:**\n${tracks}`);
    }

    if (command === 'info') {
        const queue = player.nodes.get(message.guild.id);
        if (!queue || !queue.isPlaying()) return message.reply('❌ No hay música en reproducción.');
        
        const currentTrack = queue.currentTrack;
        const tracks = queue.tracks.toArray(); 
        const nextTrack = tracks[0]; 
    
        const volume = queue.node.volume;
    
        const response = `🎵 **Información de reproducción**\n` +
            `▶ **Reproduciendo:** ${currentTrack.title} - ${currentTrack.author}\n` +
            (nextTrack ? `⏭ **Siguiente:** ${nextTrack.title} - ${nextTrack.author}\n` : '⏭ **Siguiente:** No hay más canciones en la cola.\n') +
            `🔊 **Volumen:** ${volume}%`;
        
        message.reply(response);
    } 

    if (command === 'time') {
        const queue = player.nodes.get(message.guild.id);
        if (!queue || !queue.isPlaying()) return message.reply('❌ No hay música en reproducción.');
    
        const currentTrack = queue.currentTrack;
        const elapsedTime = queue.node.position; 
        const totalDuration = currentTrack.durationMS; 
        const remainingTime = totalDuration - elapsedTime;
    
        if (remainingTime <= 0) {
            return message.reply('⏳ La canción está por terminar.');
        }
    
        const formatTime = (ms) => {
            const seconds = Math.floor((ms / 1000) % 60);
            const minutes = Math.floor((ms / 1000 / 60) % 60);
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };
    
        message.reply(`⏳ **Tiempo restante:** ${formatTime(remainingTime)}`);
    }

    if (command === 'playlocal') {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('❌ Debes estar en un canal de voz.');

        const filePath = path.join(__dirname, 'songs', 'test.mp3'); // archivo local dentro de /songs

        try {
            let queue = player.nodes.get(message.guild.id);

            if (!queue) {
                queue = player.nodes.create(message.guild.id, {
                    metadata: { channel: message.channel },
                    selfDeaf: true,
                    volume: 20,
                    leaveOnEmpty: true,
                    leaveOnEmptyCooldown: 10000,
                    leaveOnEnd: false,
                    leaveOnEndCooldown: 10000,
                });
            }

            const { track } = await player.play(voiceChannel, filePath, {
                nodeOptions: queue,
                queryType: 'file' 
            });

            message.reply(`🎶 Reproduciendo archivo local: **${track.title || 'Archivo MP3'}**`);
        } catch (error) {
            console.error('❌ Error al intentar reproducir archivo local:', error);
            message.reply('❌ Ocurrió un error al intentar reproducir el archivo local.');
        }
    }
});

player.events.on('playerStart', async (queue, track) => {
    await updateMusicPanel(queue.metadata.channel);
});

player.events.on('trackAdd', async (queue) => {
    await updateMusicPanel(queue.metadata.channel);
});

player.events.on('trackEnd', async (queue) => {
    await updateMusicPanel(queue.metadata.channel);
});

async function updateMusicPanel(channel) {
    const queue = player.nodes.get(channel.guild.id);
    if (!queue || !queue.isPlaying()) {
        return channel.send({ content: '❌ No hay música en reproducción.', embeds: [], components: [] });
    }

    const currentTrack = queue.currentTrack;
    const nextTrack = queue.tracks.toArray()[0];

    const embed = new EmbedBuilder()
        .setColor(0x1DB954)
        .setTitle('🎵 Reproduciendo ahora')
        .setDescription(`▶ **${currentTrack.title}**\n🎤 ${currentTrack.author}`)
        .setThumbnail(currentTrack.thumbnail)
        .addFields(
            { name: '⏭ Siguiente canción', value: nextTrack ? `🎵 **${nextTrack.title}**` : '🚫 No hay más canciones en la cola.', inline: false }
        );

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('pause').setLabel('⏸ Pausar').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('resume').setLabel('▶ Reanudar').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('skip').setLabel('⏭ Saltar').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('stop').setLabel('⏹ Detener').setStyle(ButtonStyle.Danger)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId('search').setLabel('🔎 Agregar canción').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('lista').setLabel('📋 Lista de canciones').setStyle(ButtonStyle.Secondary)
        );

    const message = await channel.send({ embeds: [embed], components: [row, row2] });
    currentPlayerMessage = message;
}

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton() && !interaction.isModalSubmit()) return;

    const queue = player.nodes.get(interaction.guild.id);

    if (interaction.customId === 'pause') {
        if (!queue || !queue.isPlaying()) return interaction.reply({ content: '❌ No hay música en reproducción.', ephemeral: true });
        queue.node.setPaused(true);
        await interaction.reply({ content: '⏸ Música pausada.', ephemeral: true });
    }

    if (interaction.customId === 'resume') {
        if (!queue || !queue.isPlaying()) return interaction.reply({ content: '❌ No hay música en reproducción.', ephemeral: true });
        queue.node.setPaused(false);
        await interaction.reply({ content: '▶ Música reanudada.', ephemeral: true });
    }

    if (interaction.customId === 'skip') {
        if (!queue || !queue.isPlaying()) return interaction.reply({ content: '❌ No hay música en reproducción.', ephemeral: true });
        queue.node.skip();
        await interaction.reply({ content: '⏭ Canción saltada.', ephemeral: true });
        if (currentPlayerMessage) {
            await currentPlayerMessage.delete();
        }
    }

    if (interaction.customId === 'stop') {
        if (!queue || !queue.isPlaying()) return interaction.reply({ content: '❌ No hay música en reproducción.', ephemeral: true });
        queue.delete();
        await interaction.reply({ content: '⏹ Música detenida.', ephemeral: true });
    }

    if (interaction.customId === 'search') {
        const modal = new ModalBuilder()
            .setCustomId('search_modal')
            .setTitle('🔎 Buscar Canción');

        const songInput = new TextInputBuilder()
            .setCustomId('song_name')
            .setLabel('Nombre de la canción')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const actionRow = new ActionRowBuilder().addComponents(songInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);
    }

    if (interaction.customId === 'search_modal') {
        await interaction.deferReply({ ephemeral: true });
        const songName = interaction.fields.getTextInputValue('song_name');
        
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) return interaction.followUp({ content: '❌ Debes estar en un canal de voz.', ephemeral: true });

        try {
            let queue = player.nodes.get(interaction.guild.id);
            if (!queue) {
                queue = player.nodes.create(interaction.guild.id, {
                    metadata: { channel: interaction.channel },
                    selfDeaf: true,
                    volume: 20,
                    leaveOnEmpty: true,
                    leaveOnEmptyCooldown: 10000,
                    leaveOnEnd: false,
                    leaveOnEndCooldown: 10000,
                });
            }

            const { track } = await player.play(voiceChannel, songName, { nodeOptions: queue });
            
            await interaction.followUp({ content: `🎶 **${track.title}** ha sido agregada a la cola.`, ephemeral: true });
            if (currentPlayerMessage) {
                await currentPlayerMessage.delete();
            }
            await updateMusicPanel(interaction.channel);
        } catch (error) {
            console.error('❌ Error al intentar reproducir:', error);
            interaction.followUp({ content: '❌ Ocurrió un error al intentar reproducir la canción.', ephemeral: true });
        }
    }

    if (interaction.customId === 'lista') {
        const tracks = queue.tracks.toArray();
        const list = tracks.map((track, index) => `\`${index + 1}\`. ${track.title}`).join('\n');
        await interaction.reply({ content: list || '❌ No hay canciones en la cola.', ephemeral: true });
    }
});

client.login(process.env.TOKEN);
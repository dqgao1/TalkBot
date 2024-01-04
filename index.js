const { 
  Client, 
  GatewayIntentBits } = require("discord.js");
  
const {
  joinVoiceChannel,
  createAudioResource,
  createAudioPlayer,
  StreamType,
  NoSubscriberBehavior,
} = require("@discordjs/voice");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const ytdl = require('ytdl-core');
const playdl = require('play-dl'); // Everything related to playing music from YouTube/Spotify/SoundCloud

/* CHANGE THESE 3 TO YOUR TARGETED USER, SERVER AND PREFERRED URL */
const userIdToTrack = "<USERIDHERE>"; // Replace 'userIDToTrack' with the ID of the user you want to track
const guildIdToTrack = "<GUILDIDHERE>"; // Replace 'guildIDToTrack' with the ID of the server you want to the bot to join
let URL = "https://www.youtube.com/watch?v=-ol3PSROlwg"; // URL - Can use YouTube, Spotify or SoundCloud links
/******************************************************************/

let stoppedTalking = false; //Track if the user stopped talking
let isPlaying = false; // To track if the sound is already playing
let currentConnection = null; // To store the current voice connection

const guild = null; // Store the guild
const member = null; // Store member/user information
const userVoiceChannel = null; // Store the voice channel information
let stream = null;


// Store an instance of the audio player and the audio resource to avoid empty audio resources
let player = null;
let resource = null;

let ifDisconnected = false; //if user disconnected then rejoined


client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  const guild = client.guilds.cache.get(guildIdToTrack);
  const member = guild.members.cache.get(userIdToTrack);
  const userVoiceChannel = member && member.voice.channel;

  if (userVoiceChannel) {
      const connection = joinVoiceChannel({
        channelId: userVoiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: false,
      });

    stream = await playdl.stream(URL);
    // Create a audio player and audio resource
    player = createAudioPlayer({behaviors: {
      noSubscriber: NoSubscriberBehavior.Play
    }});
    resource = createAudioResource(stream.stream, {inputType: stream.type});

    
    // Checks if tracked user is speaking and plays the audio resource
    connection.receiver.speaking.on("start", (userId) => {
      if (userId === userIdToTrack && !isPlaying && !stoppedTalking) {
        if(resource !== null) {
          player.play(resource);
          connection.subscribe(player);
        } else {
          resource = createAudioResource(stream.stream, {inputType: stream.type});
          player.play(resource);
          connection.subscribe(player);
        }
        isPlaying = true;
        stoppedTalking = true;
      } else if (userId === userIdToTrack && !isPlaying && stoppedTalking) {
        if (player.checkPlayable() && resource !== null) {
          player.unpause();
          isPlaying = true;
        }
      }
    });
    // Stops the audio resource when the user stops talking
    connection.receiver.speaking.on("end", (userId) => {
      if (userId === userIdToTrack && isPlaying && stoppedTalking) {
        player.pause();
        isPlaying = false;
      }
    });
    // Save the conenction state to follow the user to other voice channels
    currentConnection = connection;
    }
  });


//Follows the user around to different voice channels
client.on("voiceStateUpdate", async (oldState, newState) => {
  if (newState.member.user.id === userIdToTrack && newState.channel) {
    try {
      const connection = joinVoiceChannel({
        channelId: newState.channelId,
        guildId: newState.guild.id,
        adapterCreator: newState.guild.voiceAdapterCreator,
        selfDeaf: false,
      });
      stream = await playdl.stream(URL);
      // If user has dced and resource is available, play audio
      if(ifDisconnected && resource !== null) {
        player.play(resource);
        connection.subscribe(player);
        player.pause(resource);
        connection.receiver.speaking.on("start", (userId) => {
          if (userId === userIdToTrack && !isPlaying && !stoppedTalking) {
            player.play(resource);
            connection.subscribe(player);
            isPlaying = true;
            stoppedTalking = true;
          } else if (userId === userIdToTrack && !isPlaying && stoppedTalking) {
            if (player.checkPlayable()) {
              player.unpause();
              isPlaying = true;
            }
          }
        });

        connection.receiver.speaking.on("end", (userId) => {
          if (userId === userIdToTrack && isPlaying && stoppedTalking) {
            player.pause();
            isPlaying = false;
          }
        });
      } else if (!ifDisconnected && resource !== null) {
        player.play(resource);
        connection.subscribe(player);
        player.pause(resource);
        connection.receiver.speaking.on("start", (userId) => {
          if (userId === userIdToTrack && !isPlaying && !stoppedTalking) {
            player.play(resource);
            connection.subscribe(player);
            isPlaying = true;
            stoppedTalking = true;
          } else if (userId === userIdToTrack && !isPlaying && stoppedTalking) {
            if (player.checkPlayable()) {
              player.unpause();
              isPlaying = true;
            }
          }
        });

        connection.receiver.speaking.on("end", (userId) => {
          if (userId === userIdToTrack && isPlaying && stoppedTalking) {
            player.pause();
            isPlaying = false;
          }
        });
      } else if (!ifDisconnected && resource === null){
        stream = await playdl.stream(URL);
        player = createAudioPlayer({behaviors: {
          noSubscriber: NoSubscriberBehavior.Play
        }});
        resource = createAudioResource(stream.stream, {inputType: stream.type});
        connection.receiver.speaking.on("start", (userId) => {
          if (userId === userIdToTrack && !isPlaying && !stoppedTalking) {
            player.play(resource);
            connection.subscribe(player);
            isPlaying = true;
            stoppedTalking = true;
          } else if (userId === userIdToTrack && !isPlaying && stoppedTalking) {
            if (player.checkPlayable()) {
              player.unpause();
              isPlaying = true;
            }
          }
        });
        connection.receiver.speaking.on("end", (userId) => {
          if (userId === userIdToTrack && isPlaying && stoppedTalking) {
            player.pause();
            isPlaying = false;
          }
        });
      } else {
        resource = createAudioResource(stream.stream, {inputType: stream.type});
        player.play(resource);
        connection.subscribe(player);
        player.pause(resource);
        connection.receiver.speaking.on("start", (userId) => {
          if (userId === userIdToTrack && !isPlaying && !stoppedTalking) {
            player.play(resource);
            connection.subscribe(player);
            isPlaying = true;
            stoppedTalking = true;
          } else if (userId === userIdToTrack && !isPlaying && stoppedTalking) {
            if (player.checkPlayable()) {
              player.unpause();
              isPlaying = true;
            }
          }
        });

        connection.receiver.speaking.on("end", (userId) => {
          if (userId === userIdToTrack && isPlaying && stoppedTalking) {
            player.pause();
            isPlaying = false;
          }
        });
      }

      

      currentConnection = connection;
    } catch (error) {
      console.error("Error joining/playing sound:", error);
    }
  }
  else if (newState.member.user.id === userIdToTrack && !newState.channel) {
    try{
      currentConnection.destroy();
      stream = await playdl.stream(URL);
      if(resource !== null) {
        player.play(resource);
      } else {
        resource = createAudioResource(stream.stream, {inputType: stream.type});
        player.play(resource);
      }
      ifDisconnected = true;
    } catch (error) {
      console.error("Error joining/playing sound:", error);
    }
  }
});

// Login using bot api token
client.login(process.env.TOKEN);

var fs = require("fs");
const Discord = require("discord.js");
var request = require('request');
var cache = require('memory-cache');
var pckg = require('./package.json');
var utils = require('./utils.js');
var swDestiny = require('./starwarsdestiny.js');
var magicTcg = require('./magicthegathering.js');

var p1p1version = pckg.version;

const scryfallHeaders = {
  'User-Agent': `Pick1Pack1Bot/${pckg.version} (https://github.com/yourname/Pick1Pack1Bot)`,
  'Accept': 'application/json'
};

if(process.env.PROD !== "true") {
    require('dotenv').load();
}

const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

const slashCommands = [
  {
    name: 'p1p1',
    description: 'Generate a Magic booster or other p1p1 features',
    options: [
      { name: 'set', description: 'Set code (e.g. m19)', type: 1, options: [
          { name: 'code', description: 'Set code (e.g. m19)', type: 3, required: true }
        ] 
      },
      { name: 'cubecobra', description: 'CubeCobra full url', type: 1, options: [
          { name: 'url', description: 'Full CubeCobra URL', type: 3, required: true }
        ] },
      { name: 'paupercube', description: 'Use paupercube', type: 1, required: true },
      { name: 'brewchallenge', description: 'Brew challenge', type: 1, required: true },
      { name: 'roll', description: 'Roll a dN (provide N)', type: 1, options: [
          { name: 'max', description: 'Max number N', type: 4, required: true }
        ] }
    ]
  },
  {
    name: 'p1p1swd',
    description: 'Generate a Star Wars Destiny booster',
    options: [{ name: 'set', description: 'Swd set code', type: 3, required: true }]
  }
];

client.once('ready', async () => {
  utils.log("The P1P1 bot is online!");
  try {
    await client.application.commands.set(slashCommands);
    utils.log("Registered slash commands");
  } catch (err) {
    utils.log("Failed to register slash commands: " + err);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'p1p1') {
    const sub = (() => {
      try { return interaction.options.getSubcommand(); } catch (e) { return null; }
    })();

    if (sub === 'brewchallenge') {
      request('https://api.scryfall.com/cards/random', {json: true, headers: scryfallHeaders}, function (error, response, body) {
        const embed = new EmbedBuilder().setTitle(body.name)
          .setDescription("This is your card now and your challenge is to brew a deck around it.")
          .setImage(body.image_uris?.normal || null)
          .setURL(body.scryfall_uri)
        interaction.editReply({ embeds: [embed] });
        utils.log(interaction.user.id + " started a brewchallenge and got: " + body.name);
      });
      return;
    }

    if (sub === 'paupercube') {
      let options = { url: 'https://cubecobra.com/cube/api/cubelist/thepaupercube', headers: { 'User-Agent': 'node' } };
      request(options, function (error, response, body) {
        let booster = getCardsFromCC(body, 15);
        var scryfalllink = magicTcg.createScryfallLink(booster, "name");
        utils.setActivity(booster, client);
        interaction.editReply({ content: scryfalllink, embeds: [ new EmbedBuilder().setDescription(booster.join('\n')).setTitle("15 cards from thepaupercube.com").setURL(scryfalllink).setFooter({ text: "paypal.me/yunra" }) ] });
      });
      return;
    }

    if (sub === 'cubecobra') {
      await interaction.deferReply();

      const rawUrl = interaction.options.getString('url');
      try {
        const parsed = new URL(rawUrl);
        const allowedHosts = ['cubecobra.com', 'www.cubecobra.com'];
        const validPath = /^\/cube\/api\/cubelist\/[^\/]+$/i;

        if (parsed.protocol !== 'https:' || !allowedHosts.includes(parsed.hostname) || !validPath.test(parsed.pathname)) {
          return interaction.editReply("Invalid CubeCobra URL. Use a URL like:\nhttps://cubecobra.com/cube/api/cubelist/<your-id>");
        }

        const options = { url: parsed.toString(), headers: { 'User-Agent': 'Pick1Pack1Bot' } };
        request(options, function (error, response, body) {
          if (error) return interaction.editReply("Error fetching CubeCobra: " + error);
          if (!response || response.statusCode !== 200) return interaction.editReply("CubeCobra returned status " + (response && response.statusCode));

          let booster = getCardsFromCC(body, 15);
          var scryfalllink = magicTcg.createScryfallLink(booster, "name");
          utils.setActivity(booster, client);
          const embed = new EmbedBuilder()
            .setDescription(booster.join('\n'))
            .setTitle("15 cards from cubecobra")
            .setURL(scryfalllink)
          interaction.editReply({ content: scryfalllink, embeds: [embed] });
        });
      } catch (err) {
        return interaction.editReply("Invalid URL format. Make sure it's a full URL starting with https://");
      }
      return;
    }

    if (sub === 'roll') {
      const max = interaction.options.getInteger('max');
      const result = utils.rollDice(max);
      await interaction.reply("Dice landed on: " + result);
      return;
    }

    if (sub === 'set') {
      const code = interaction.options.getString('code');
      await interaction.deferReply();
      await magicTcg.generateBoosterFromScryfall(client, interaction, code.toLowerCase(), 14);
      return;
    }

   await interaction.deferReply();
    interaction.editReply("Use a subcommand: /p1p1 set, /p1p1 paupercube, /p1p1 brewchallenge, /p1p1 cubecobra or /p1p1 roll");
  } 
  else if (interaction.commandName === 'p1p1swd') {
    const set = interaction.options.getString('set');
    await interaction.deferReply();
    await swDestiny.getSwdBooster(set, interaction, client);
  }
});

client.on("messageCreate", (message) => {
    // Ignore bot messages and DMs
    if (message.author.bot || !message.guild) return;

    if (message.content.startsWith("!p1p1 brewchallenge")) {
        request('https://api.scryfall.com/cards/random', {json: true}, function (error, response, body) {
            if (error) {
                message.channel.send("Error fetching card: " + error);
                return;
            }
            const embed = new EmbedBuilder()
                .setTitle(body.name)
                .setDescription("This is your card now and your challenge is to brew a deck around it. \n Any format where it is legal is allowed.")
                .setImage(body.image_uris?.normal || null)
                .setURL(body.scryfall_uri)
                .setFooter({ text: "paypal.me/yunra" });
            message.channel.send({ embeds: [embed] });
            utils.log(message.author.id + " started a brewchallenge and got: " + body.name);
        });
    } 
    else if (message.content.startsWith("!p1p1 paupercube") || message.content.startsWith("!paupercube")) {
        let options = {
            url: 'https://cubecobra.com/cube/api/cubelist/thepaupercube',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36'
            }
        };
        request(options, function (error, response, body) {
            if (error) {
                message.channel.send("Error fetching cube: " + error);
                return;
            }
            let booster = getCardsFromCC(body, 15);
            var scryfalllink = magicTcg.createScryfallLink(booster, "name");
            utils.setActivity(booster, client);
            const embed = new EmbedBuilder()
                .setDescription(booster.join('\n'))
                .setURL(scryfalllink)
                .setTitle("15 cards from thepaupercube.com")
            message.channel.send({ embeds: [embed] });
            utils.log(message.author.id + " generated a booster from a cubecobra cube");
        });
    } 
    else if (message.content.startsWith("!p1p1 roll")) {
        var maxNumber = message.content.split(" ");
        message.channel.send("Dice landed on: " + utils.rollDice(maxNumber[2]));
    } 
    else if (message.content.startsWith("!p1p1 cubecobra")) {
        const parts = message.content.trim().split(/\s+/);
        if (parts.length < 3) {
            message.channel.send("Usage: !p1p1 cubecobra {cubecobraUrl} — e.g. !p1p1 cubecobra https://cubecobra.com/cube/api/cubelist/myid");
            return;
        }
        const rawUrl = parts.slice(2).join(' ').trim();
        try {
            const parsed = new URL(rawUrl);
            const allowedHosts = ['cubecobra.com', 'www.cubecobra.com'];
            const validPath = /^\/cube\/api\/cubelist\/[^\/]+$/i;

            if (parsed.protocol !== 'https:' || !allowedHosts.includes(parsed.hostname) || !validPath.test(parsed.pathname)) {
                message.channel.send("Invalid CubeCobra URL. Use a URL like:\nhttps://cubecobra.com/cube/api/cubelist/<your-id>");
                return;
            }

            let options = { url: parsed.toString(), headers: { 'User-Agent': 'Pick1Pack1Bot' } };
            request(options, function (error, response, body) {
                if (error) {
                    message.channel.send("Error fetching cube: " + error);
                    return;
                }
                if (!response || response.statusCode !== 200) {
                    message.channel.send("CubeCobra returned status " + (response && response.statusCode));
                    return;
                }
                let booster = getCardsFromCC(body, 15);
                var scryfalllink = magicTcg.createScryfallLink(booster, "name");
                utils.setActivity(booster, client);
                const embed = new EmbedBuilder()
                    .setDescription(booster.join('\n'))
                    .setURL(scryfalllink)
                    .setTitle("15 cards from cubecobra")
                    .setFooter({ text: "paypal.me/yunra" });
                message.channel.send({ embeds: [embed] });
                utils.log(message.author.id + " generated a booster from a cubecobra cube");
            });
        } catch (e) {
            message.channel.send("Invalid URL format. Make sure it starts with https://");
        }
    }
    else if (message.content.startsWith("!p1p1")) {
        // parse the command like: "!p1p1 m19" (supports multi-char set codes)
        const parts = message.content.trim().split(/\s+/);
        if (parts.length < 2) {
            message.channel.send("Usage: !p1p1 {setcode} — e.g. !p1p1 m19");
            return;
        }
        const setCode = parts[1].toLowerCase();
        const url = 'https://api.scryfall.com/sets/' + encodeURIComponent(setCode);
        request(url, { json: true, headers: scryfallHeaders }, function (error, response, setData) {
            if (error) {
                utils.log("Error fetching set " + setCode + ": " + error);
                message.channel.send("Error fetching set info. Try again later.");
                return;
            }
            if (!response || response.statusCode !== 200) {
                utils.log("Scryfall returned status " + (response && response.statusCode) + " for set " + setCode + " - body: " + JSON.stringify(setData));
                message.channel.send("Could not find set with set code: " + setCode + " — try the official set code from Scryfall (example: m19, khm).");
                return;
            }
            magicTcg.generateBoosterFromScryfall(client, message, setCode, 14);
        });
    }
});

function getCardsFromFile(file, amount) {
    var selected = [];
    selected = fs.readFileSync(file, 'utf8').toString().split('\n');
    var shuffled = utils.shuffleArray(selected);
    var cards = shuffled.slice(0,amount);
    return cards;
}

function getCardsFromCT(response, amount) {
    var selected = [];
    selected = response.toString().split('\n');
    selected.pop();
    selected.shift();
    var shuffled = utils.shuffleArray(selected);
    var cards = shuffled.slice(0,amount);
    return cards;
}

function getCardsFromCC(cube, amount) {
    var selected = [];
    selected = cube.toString().split('\n');
    selected.pop();
    selected.shift();
    var shuffled = utils.shuffleArray(selected);
    var cards = shuffled.slice(0,amount);
    return cards;
}

client.login(process.env.discord_token);
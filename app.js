var fs = require("fs");
const Discord = require("discord.js");
var request = require('request');
var cache = require('memory-cache');
var pckg = require('./package.json');
var utils = require('./utils.js');
var swDestiny = require('./starwarsdestiny.js');
var magicTcg = require('./magicthegathering.js');

//Global tag for the set searched for, used for lands f.ex
var p1p1version = pckg.version;

if(process.env.PROD !== "true") {
    require('dotenv').load();
}

const client = new Discord.Client();

client.on("ready", () => {
    utils.log("The P1P1 bot is online!");
    console.log("Bot is located in these servers: ");
    client.guilds.forEach(element => {
        console.log(element.name + " - " + element.id + " - users: "+ element.memberCount);
    });
});

//Get a booster with a certain number of cards from a certain set
function getCardsFromFile(file, amount) {
    var selected = [];
    selected = fs.readFileSync(file, 'utf8').toString().split('\n');
    var shuffled = utils.shuffleArray(selected);
    var cards = shuffled.slice(0,amount);
    return cards;
}

//Get a booster with a certain number of cards from a cubetutor
function getCardsFromCT(response, amount) {
    var selected = [];
    selected = response.toString().split('\n');
    selected.pop();
    selected.shift();
    var shuffled = utils.shuffleArray(selected);
    var cards = shuffled.slice(0,amount);
    return cards;
}

client.on("message", (message) => {
    if (message.content.startsWith("!p1p1 brewchallenge")) {
        request('https://api.scryfall.com/cards/random', {json: true}, function (error, response, body) {
            message.channel.send(new Discord.RichEmbed().setTitle(body.name).setDescription("This is your card now and your challenge is to brew a deck around it. \n Any format where it is legal is allowed.").setImage(body.image_uris.normal).setURL(body.scryfall_uri));
            utils.log(message.author.id + " started a brewchallenge and got: " + body.name);
        });
    }
    else if (message.content.startsWith("!p1p1 ct") || message.content.startsWith("!p1p1 paupercube") || message.content.startsWith("!paupercube")) {
        let ctID = message.content.replace("!p1p1 ct ", "")
        var title = "Results from cube with id: " + ctID;
        if (message.content.startsWith("!p1p1 paupercube") || message.content.startsWith("!paupercube")) {
            ctID = "96198";
            title = "15 cards from thepaupercube.com";
            utils.setActivityCard("thepaupercube.com", client)
        }
        if (/^[0-9]*$/.test(ctID)){
          let options = {
            url: 'http://www.cubetutor.com/viewcube/' + ctID,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36'
            }
          }
          request(options,
                   function (error, response, body) {

                      var a = /<\/a>/ig;
                      var a2 = /<a\b[^>]*>/ig;
                      var script = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;
                      var p = /<p[\s\S]*?>[\s\S]*?<\/p>/gi;
                      var li = /<li[\s\S]*?>[\s\S]*?<\/li>/gi;
                      var div1 = /<div[\s\S]*?>/gi;
                      var div2 = /<\/div>/gi;
                      var head = /<!DOC[\s\S]*?key:/gi;
                      var headAlt = /<!DOC[\s\S]*?<br\/>/gi;
                      var closer = /<\/body><\/html>/gi;
                      body2 = body.replace(a, '\n').replace(a2, '').replace(script, '').replace(p, '').replace(li, '').replace(div1, '').replace(div2, '').replace(head, '').replace(headAlt, '').replace(closer, '')
                      let booster = getCardsFromCT(body2, 15);
                      var scryfalllink = magicTcg.createScryfallLink(booster, "name");
                      utils.setActivity(booster, client);

                      message.channel.send(new Discord.RichEmbed().setDescription(booster).setURL(scryfalllink).setTitle(title).setFooter("patreon.com/yunra"));
                      utils.log(message.author.id + " generated a booster from a cardtutor list with id: " + ctID);
          });
        } else {
          message.channel.send(new Discord.RichEmbed().setDescription("The ID you entered is invalid").setTitle("Error"));
          utils.log("[DEBUG] " + message.author.id + " tried to generate a booster from a cardtutor list with id: " + ctID);
        }
    } 
    else if(message.content.startsWith('!p1p1 cc ')){
        let ccId =  message.content.replace("!p1p1 cc ", "")
        request({
            method:'GET',
            url: 'https://cubecobra.com/cube/api/p1p1/' + ccId +'/',
            headers: {
                "content-type": "application/json",
                "accept": "application/json"
            }
        },
        function (error, response, body) {
            if(!error){
                const parseBody = JSON.parse(body)
                let booster = parseBody.pack;
                
                var scryfalllink = magicTcg.createScryfallLink(booster, "name");

                utils.setActivity(booster, client);

                message.channel.send(new Discord.RichEmbed().setDescription(booster).setURL(scryfalllink).setTitle('Cube Cobra').setFooter("patreon.com/yunra"));
                utils.log(message.author.id + " generated a booster from a Cube Cobra list with id: " + ccId);
            } else {
                message.channel.send(new Discord.RichEmbed().setTitle('Something Went Wrong').setFooter("patreon.com/yunra"));
            }
        })
    }
    else if (message.content.startsWith("!p1p1swd")) {
        var set = message.content.split(" ");
        swDestiny.getSwdBooster(set[1], message, client);
    } else if (message.content.startsWith("!p1p1 about")) {
        message.channel.send("\
            This bot was made to generate booster packs and discuss what to pick first in packs. Most sets that were released in boosters in Magics 25 year history is supported. Some sets that have more or replaced basic lands might be misrepresented for now. \n \n Author: Martin Ekström \n Discord username: <@228197875308429313> \n Support development by donating: https://www.paypal.me/yunra \n \
    \n \
Contributors: Omniczech sorted out the integration with CubeTutor \n \
\n \
Current version: " + p1p1version);
    }
    else if (message.content.startsWith("!p1p1 help")) {
        message.channel.send("**Help section for Pack1Pick1-bot** \n \n \
All sets in magic can be generated using their 3 letter code like so:\n \
!p1p1 m19 \n \
(This gives you a Core Set 2019 booster) \n \
\n \
If you have or find a set on CubeTutor you can use its ID to generate a booster\n \
!p1p1 ct <id>\n \
The cubes cubetutor id can be found in the url of the cube.\n \
It is a set of numbers, just copy it and replace <ct> in the command above.\n \
\n \
!p1p1 paupercube - Generate a 15 card booster pack for thepaupercube.com \n \
!p1p1 brewchallenge - You get 1 randomly picked card and have to build a deck around it. \n \
!p1p1planechase - Get a planechase card. \n \
!p1p1planechase roll - Roll the chaos die \n \
\n \
!p1p1 roll 6 - Roll a d6 dice \n \
!p1p1 roll 20 - Roll a d20 dice \n \
\n \
Star Wars Destiny booster:\n \
!p1p1swd wotf - Gets a Way of the Force booster pack from Star Wars Destiny (change code to get other sets) \n \
\n \
!p1p1 about - Learn more about the bot. \n \
!p1p1 help - Displays this info, its literally the command you just used. \n \
\n \
**patreon.com/yunra** - please help support the development of the bot\n \
\n \
If you can not see the boosters, check your discord settings if you have disabled link previews.");
    } else if (message.content.startsWith("!whereisp1p1!")) {
        var servers = [];
        client.guilds.forEach(element => {
            servers.push(element.name + " - users: "+ element.memberCount + " - OwnerID: " + element.ownerID);
        });
        message.channel.send(servers);
    } else if (message.content.startsWith("!p1p1 momir")) {
        var splitMessage = message.content.split(" ");
        magicTcg.momir(splitMessage[2], message);
    } else if (message.content.startsWith("!p1p1planechase roll")) {
        var planarcard = magicTcg.rollForPlanes(message);
    } else if (message.content.startsWith("!p1p1planechase rules")) {
        message.channel.send("https://magic.wizards.com/en/articles/archive/feature/rules-revealed-2009-08-10");
    } else if (message.content.startsWith("!p1p1planechase")) {
        var planarcard = magicTcg.getPlanarCard(message);
    } else if (message.content.startsWith("!p1p1 roll")) {
        var maxNumber = message.content.split(" ");
        message.channel.send("Dice landed on: " + utils.rollDice(maxNumber[2]));
    }
    else if (message.content.startsWith("!p1p1")) {
        var set = message.content.substr(message.content.length -3).toLowerCase();
        request('https://api.scryfall.com/sets/' + set, {json: true}, function (error, response, setData) {
            if (setData.status == "404") {
                message.channel.send("Use !p1p1 help");
            } else {
                magicTcg.generateBoosterFromScryfall(client, message, set, 14);
            }
        });
    }
});

client.login(process.env.discord_token);

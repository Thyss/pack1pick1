var fs = require("fs");
const Discord = require("discord.js");
var request = require('request');
var cache = require('memory-cache');
var pckg = require('./package.json');
var utils = require('./utils.js');
var swDestiny = require('./starwarsdestiny.js');

//Global tag for the set searched for, used for lands f.ex
var setTag;
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

//Check if a set is released by comparing the releasedate with todays date
function isSetReleased(releasedate) {
    var today = new Date();
    var y = today.getFullYear();
    var m = today.getMonth();
    var d = today.getDay();
    
    var todayYMD = new Date(y,m,d);
    todayYMD.setHours(0,0,0,0);
    var released_at = new Date(releasedate);
    released_at.setHours(0,0,0,0);
    var released = false;
    if (todayYMD < released_at) {
        release = false;
    } else {
        released = true;
    }
    return released;
}

//Create the scryfall link so you can view the cards easily
function createScryfallLink(cardlist, order = "rarity", set) {
    var scryfalllink = "https://scryfall.com/search?unique=cards&as=grid&order=" + order + "&q=!";
    if (set) {
        scryfalllink += cardlist.join('+e%3A' + set + '+or+!');
        scryfalllink += '+e%3A' + set;
    } else {
        scryfalllink += cardlist.join('+or+!');
    }
    scryfalllink = scryfalllink.replace(/ /g, '-');
    scryfalllink = scryfalllink.replace(/\s/g, '');
    return scryfalllink;
}



//Get a basic land
function getBasicLand(amount = 1) {
    var lands = ["Plains", "Island", "Swamp", "Mountain", "Forest"];
    var ravnicaGuildGates = ["Boros Guildgate", "Dimir Guildgate", "Selesnya Guildgate", "Izzet Guildgate", "Golgari Guildgate"];
    if (setTag == "grn") {
        lands = ravnicaGuildGates;
    }
    var shuffledBasics = utils.shuffleArray(lands);
    return shuffledBasics.slice(0, amount);
}

//Create a booster with a set amount of mythics, rares, uncommons and commons
function createBooster(set, mythicrares = 1, uncommons = 3, commons = 10) {
    var mythic = [];
    var rare = [];
    var uncommon = [];
    var common = [];
    for (card of set) {
        if (card.rarity == "common") {
            common.push(card);
        } else if(card.rarity == "uncommon") {
            uncommon.push(card);
        } else if (card.rarity == "rare") {
            rare.push(card);
        } else if (card.rarity == "mythic") {
            mythic.push(card);
        }
    }
    common = utils.shuffleArray(common);
    uncommon = utils.shuffleArray(uncommon);
    rare = utils.shuffleArray(rare);
    mythic = utils.shuffleArray(mythic);
    var booster = common.slice(0,commons);
    booster = booster.concat(uncommon.slice(0,uncommons));
    if (Math.floor(Math.random() * 7) == 0) {
        booster = booster.concat(mythic.slice(0,mythicrares));
    } else {
        booster = booster.concat(rare.slice(0,mythicrares));
    }
    var cardnames = [];
    for (card of booster) {
        cardnames.push(card.name);
    }
    cardnames.push(getBasicLand());
    return cardnames;
}

//Takes a set (3 letters) and an amount of cards in the booster, default 14
function generateBoosterFromScryfall(message, set_code, amount = 14) {
    setTag = set_code;
    if (!cache.get(set_code)) {
        message.channel.send("Hold on " + message.author.toString() + ", fetching set and generating booster");
    }
    request('https://api.scryfall.com/sets/' + set_code, {json: true}, function (error, response, setData) {
        if(setData.card_count < 15) {
            if(setData.card_count >= 1) {                
                request('https://api.scryfall.com/cards/' + set_code, {json: true}, function(error, response, body){
                    message.channel.send(setData.name + " only contains " + setData.card_count + " cards and can therefore not generate a booster. \nIt will release or was released " + setData.released_at);
                    message.channel.send(new Discord.RichEmbed().setTitle("Check out the set on Scryfall").setURL(setData.scryfall_uri));
                    utils.log("[DEBUG]" + message.author.id + " wanted a " + setData.name + "-booster. the set only contains " + setData.card_count + " cards and can't generate a booster.");
                }); 
            } else {
                message.channel.send(setData.name + " only contains " + setData.card_count + " cards and can therefore not generate a booster. \nIt will release or was released " + setData.released_at);
            }
        } else {
            if (cache.get(set_code)) {
                var cached_set = cache.get(set_code);
                utils.log(setData.name + " was found in the cache");
                var cardnames = createBooster(cached_set);
                message.channel.send(new Discord.RichEmbed().setDescription(cardnames).setTitle(amount + " cards from " + setData.name).setURL(createScryfallLink(cardnames, "rarity", setData.code)).setFooter(setData.name + " was released " + setData.released_at));
            } else {
                var isBooster = "+is%3Abooster";
                if(isSetReleased(setData.released_at) == false) {
                    isBooster = "";
                }
                var scryfallSearchUri = "https://api.scryfall.com/cards/search?unique=cards&q=e%3A" + set_code + isBooster + "+-t%3Abasic+-t%3Agate";
                request(scryfallSearchUri, {json: true}, function (error, response, body) {
                    var set = JSON.parse(JSON.stringify(body));
                    var next_page = "";
                    let cards = set.data;
                    if (typeof cards !== 'undefined' && cards) {
                        if (set.total_cards > 175) { //Scryfall returns 175 cards per request - https://scryfall.com/docs/api/cards/search
                            next_page = set.next_page.replace("\u0026", "");
                            request(next_page, {json: true}, function (error, response, body2) {
                                var moreinset = JSON.parse(JSON.stringify(body2));
                                cards = cards.concat(moreinset.data);
                                var cardnames = createBooster(cards);
                                utils.setActivity(cardnames, client);
                                if (isSetReleased(setData.released_at) == true) {
                                    message.channel.send(new Discord.RichEmbed().setDescription(cardnames).setTitle(amount + " cards from " + setData.name).setURL(createScryfallLink(cardnames, "rarity", setData.code)).setFooter(setData.name + " was released " + setData.released_at));
                                } else {
                                    message.channel.send(new Discord.RichEmbed().setDescription("This set has not been release yet and for spoiler reasons you have to use the scryfall link to see the generated booster. The pack can contain any currently spoiled card, including promos and planeswalker deck cards.").setTitle(amount + " cards from " + setData.name).setURL(createScryfallLink(cardnames, "rarity", setData.code)).setFooter(setData.name + " will be released " + setData.released_at));
                                }
                                utils.log(message.author.id + " generated a " + setData.name + "-booster");
                            });
                        } else {
                            var cardnames = createBooster(cards);
                            utils.setActivity(cardnames, client);
                            if (isSetReleased(setData.released_at) == true) {
                                message.channel.send(new Discord.RichEmbed().setDescription(cardnames).setTitle(amount + " cards from " + setData.name).setURL(createScryfallLink(cardnames, "rarity", setData.code)).setFooter(setData.name + " was released " + setData.released_at));
                            } else {
                                message.channel.send(new Discord.RichEmbed().setDescription("This set has not been release yet and for spoiler reasons you have to use the scryfall link to see the generated booster. The pack can contain any currently spoiled card, including promos and planeswalker deck cards.").setTitle(amount + " cards from " + setData.name).setURL(createScryfallLink(cardnames, "rarity", setData.code)).setFooter(setData.name + " will be released " + setData.released_at));
                            }
                            utils.log(message.author.id + " generated a " + setData.name + "-booster");
                        }
                        if (isSetReleased(setData.released_at) == true) {
                            cache.put(set_code, cards, 2592000000);
                            utils.log("Adding set " + setData.name + " to cache with key: " + set_code);
                        }
                    } else if(body.status == 400) {
                        message.channel.send(set_code + " did not result in any hits.");
                        utils.log("[DEBUG] Could not find set with set code: " + set_code);
                    } else {
                        message.channel.send("Couldn't find any cards for a booster, " + setData.name + " might not have been released in boosters. Choose another set and try again or check out the set on scryfall.\n" + setData.scryfall_uri);
                    }
                });
            }
        }
    });
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
                      var scryfalllink = createScryfallLink(booster, "name");

                      message.channel.send(new Discord.RichEmbed().setDescription(booster).setURL(scryfalllink).setTitle(title));
                      utils.log(message.author.id + " generated a booster from a cardtutor list with id: " + ctID);
          });
        } else {
          message.channel.send(new Discord.RichEmbed().setDescription("The ID you entered is invalid").setTitle("Error"));
          utils.log("[DEBUG] " + message.author.id + " tried to generate a booster from a cardtutor list with id: " + ctID);
        }
    } else if (message.content.startsWith("!p1p1swd")) {
        var set = message.content.split(" ");
        swDestiny.getSwdBooster(set[1], message);
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
\n \
**!p1p1 about - Learn more about the bot.** \n \
!p1p1 help - Displays this info, its literally the command you just used. \n \
\n \
If you can not see the boosters, check your discord settings if you have disabled link previews. \n \
\n \
Disclaimer: Some sets are not represented properly, like Dominaria f.ex is missing its guaranteed legendary. This is being worked on as it pops up, feel free to report any set that is not working as it should."
        );
    } else if (message.content.startsWith("!whereisp1p1!")) {
        client.guilds.forEach(element => {
            message.channel.send(element.name + " - users: "+ element.memberCount);
        });
    }
    else if (message.content.startsWith("!p1p1")) {
        var set = message.content.substr(message.content.length -3).toLowerCase();
        request('https://api.scryfall.com/sets/' + set, {json: true}, function (error, response, setData) {
            if (setData.status == "404") {
                message.channel.send("Use !p1p1 help");
            } else {
                generateBoosterFromScryfall(message, set, 14);
            }
        });
    }
});

client.login(process.env.discord_token);

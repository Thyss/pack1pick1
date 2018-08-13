var fs = require("fs");
const Discord = require("discord.js");
var request = require('request');

if(process.env.PROD !== "true") {
    require('dotenv').load();
}

const client = new Discord.Client();

client.on("ready", () => {
    console.log("I am ready!");
});

//Shuffle the array of cards to not always get the same 15 cards
function shuffleArray(o) {
	for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
};

//Get a booster with a certain number of cards from a certain set
function getCardsFromFile(file, amount) {
    var selected = [];
    selected = fs.readFileSync(file, 'utf8').toString().split('\n');
    var shuffled = shuffleArray(selected);
    var cards = shuffled.slice(0,amount);
    return cards;
}

//Get a booster with a certain number of cards from a cubetutor
function getCardsFromCT(response, amount) {
    var selected = [];
    selected = response.toString().split('\n');
    selected.pop();
    selected.shift();
    console.log(selected.length);
    var shuffled = shuffleArray(selected);
    var cards = shuffled.slice(0,amount);
    return cards;
}


//Create the scryfall link so you can view the cards easily
function createScryfallLink(cardlist, order = "rarity", set = "m19") {
    var scryfalllink = "https://scryfall.com/search?unique=cards&as=grid&order=" + order + "&set=" + set + "&q=!";
    scryfalllink += cardlist.join('+or+!');
    scryfalllink = scryfalllink.replace(/ /g, '-');
    scryfalllink = scryfalllink.replace(/\s/g, '');
    return scryfalllink;
}

//Select a random card from the booster to set as the "playing" for the bot.
function setActivity(booster) {
    var randcard = Math.floor(Math.random() * booster.length);
    client.user.setActivity(booster[randcard].toString(), { type: 'PLAYING'});
}

//Takes a set (3 letters) and an amount of cards in the booster, default 14
function generateBoosterFromScryfall(message, set, amount = 14) {
    message.channel.send("Hold on, generating booster");
    request('https://api.scryfall.com/sets/' + set, {json: true}, function (error, response, setData) {
        var mythic = [];
        var rare = [];
        var uncommon = [];
        var common = [];
        request('https://api.scryfall.com/cards/search?unique=cards&q=e%3A' + set + '+is%3Abooster+-t%3Abasic', {json: true}, function (error, response, body) {
            var set = JSON.parse(JSON.stringify(body));
            var next_page = "";
            let cards = set.data;
            if (set.has_more = "true") {
                next_page = set.next_page.replace("\u0026", "");
                request(next_page, {json: true}, function (error, response, body2) {
                    var moreinset = JSON.parse(JSON.stringify(body2));
                    cards = cards.concat(moreinset.data);
                    for (card of cards) {
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
                    common = shuffleArray(common);
                    uncommon = shuffleArray(uncommon);
                    rare = shuffleArray(rare);
                    mythic = shuffleArray(mythic);
                    var booster = common.slice(0,10);
                    booster = booster.concat(uncommon.slice(0,3));
                    if (Math.floor(Math.random() * 7) == 0) {
                        booster = booster.concat(mythic.slice(0,1));
                    } else {
                        booster = booster.concat(rare.slice(0,1));
                    }
                    var cardnames = [];
                    for (card of booster) {
                        cardnames.push(card.name);
                    }
                    setActivity(cardnames);
                    message.channel.send(new Discord.RichEmbed().setDescription(cardnames).setTitle(amount + " cards from " + setData.name).setURL(createScryfallLink(cardnames, "rarity", set)).setFooter(setData.name + " was released " + setData.released_at));
                });
            } else {
                for (card of legalCards) {
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
                common = shuffleArray(common);
                uncommon = shuffleArray(uncommon);
                rare = shuffleArray(rare);
                mythic = shuffleArray(mythic);
                var booster = common.slice(0,10);
                booster = booster.concat(uncommon.slice(0,3));
                if (Math.floor(Math.random() * 7) == 0) {
                    booster = booster.concat(mythic.slice(0,1));
                } else {
                    booster = booster.concat(rare.slice(0,1));
                }
                var cardnames = [];
                for (card of booster) {
                    cardnames.push(card.name);
                }
                setActivity(cardnames);
                message.channel.send(new Discord.RichEmbed().setDescription(cardnames).setTitle(amount + " cards from " + setData.name).setURL(createScryfallLink(cardnames, "rarity", set)).setFooter(setData.name + " was released " + setData.released_at));
            }
        });
    });
}

client.on("message", (message) => {
    if (message.content.startsWith("!p1p1 paupercube")) {
        let booster = getCardsFromFile('./cardsets/paupercube.txt', 15);
            //Create scryfall link for images
        var scryfalllink = createScryfallLink(booster, "name");
        setActivity(booster);
        message.channel.send(new Discord.RichEmbed().setDescription(booster).setURL(scryfalllink).setTitle("15 cards from Thepaupercube.com"));
    }
    else if (message.content.startsWith("!p1p1 brewchallenge")) {
        request('https://api.scryfall.com/cards/random', {json: true}, function (error, response, body) {
            message.channel.send(new Discord.RichEmbed().setTitle(body.name).setDescription("This is your card now and your challenge is to brew a deck around it. \n Any format where it is legal is allowed.").setImage(body.image_uris.normal).setURL(body.scryfall_uri));
        });
    }
    else if (message.content.startsWith("!p1p1 m19")) {
        //Create the booster for this set
        //Boosters might be different for any particular set so create them separately
        let booster = getCardsFromFile('./cardsets/m19/common.txt', 10);
        booster = booster.concat(getCardsFromFile('./cardsets/m19/uncommon.txt', 3));
        //Only generate mythic for every 8 packs.
        //Random number between 0-8
        if (Math.floor(Math.random() * 7) == 0) {
            booster = booster.concat(getCardsFromFile('./cardsets/m19/mythic.txt', 1));
            //console.log(new Date() + " Mythic!");
        } else {
            booster = booster.concat(getCardsFromFile('./cardsets/m19/rare.txt', 1));
        }
        setActivity(booster);
        message.channel.send(new Discord.RichEmbed().setDescription(booster).setTitle("15 cards from Core Set 2019").setURL(createScryfallLink(booster, "rarity", "m19")));
    }
    else if (message.content.startsWith("!p1p1 ct")) {
        let ctID = message.content.replace("!p1p1 ct ", "")
        console.log(ctID);
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
                      var closer = /<\/body><\/html>/gi;
                      body2 = body.replace(a, '\n').replace(a2, '').replace(script, '').replace(p, '').replace(li, '').replace(div1, '').replace(div2, '').replace(head, '').replace(closer, '')
                      console.log('body:', body2); // Print the HTML for the Google homepage.
                      let booster = getCardsFromCT(body2, 15);
                      // console.log("request", response.req['_header']);
                      console.log(booster);
                      var scryfalllink = createScryfallLink(booster, "name");
                      setActivity(booster);
                      message.channel.send(new Discord.RichEmbed().setDescription(booster).setURL(scryfalllink).setTitle("Results from cube with id: " + ctID));
          });
        } else {
          message.channel.send(new Discord.RichEmbed().setDescription("The ID you entered is invalid").setTitle("Error"));
        }
    }
    else if (message.content.startsWith("!p1p1 about")) {
        message.channel.send("\
            This bot was made to generate booster packs and discuss what to pick first in packs. More sets will be available as i add them, feel free to come with feedback on what sets you would like to see supported. \n \n Author: Martin Ekström \n Discord username: Yunra \n Support development by donating: https://www.paypal.me/yunra");
    }
    else if (message.content.startsWith("!p1p1 help")) {
        message.channel.send("**Help section for Pack1Pick1-bot** \n \n \
All sets in magic can be generated using their 3 letter code like so:\n \
!p1p1 m19 \n \
(This gives you a Core Set 2019 booster) \n \
\n \
!p1p1 paupercube - Generate a 15 card booster pack for thepaupercube.com \n \
!p1p1 brewchallenge - You get 1 randomly picked card and have to build a deck around it. \n \
\n \
**!p1p1 about - Learn more about the bot.** \n \
!p1p1 help - Displays this info, its literally the command you just used. \n \
\n \
If you can not see the boosters, check your discord settings if you have disabled link previews. \n \
Disclaimer: Some sets are not represented properly, like Dominaria f.ex is missing its guaranteed legendary. This is being worked on as it pops up, feel free to report any set that is not working as it should."
        );
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

client.login("NDc4NjAzMTM4MjEyMDM2NjA5.DlNGYg.eTAdpyDVJDs0g3gTztnvJqSy5Mo");

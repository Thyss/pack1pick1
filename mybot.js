var fs = require("fs");
const Discord = require("discord.js");
var request = require('request');

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
    else if (message.content.startsWith("!p1p1 dom")) {
        var highest_collector_number = 269;
        var mythic = [];
        var rare = [];
        var uncommon = [];
        var common = [];
        request('https://api.scryfall.com/cards/search?q=e%3Adom+is%3Abooster+-t%3Abasic', {json: true}, function (error, response, body) {
            var set = JSON.parse(JSON.stringify(body));
            var next_page = "";
            let cards = set.data;
            if (set.has_more = "true") {
                next_page = set.next_page.replace("\u0026", "");
                request(next_page, {json: true}, function (error, response, body2) {
                    var moreinset = JSON.parse(JSON.stringify(body2));
                    cards = cards.concat(moreinset.data);
                    let legalCards = [];
                    for(card of cards) {
                        if (parseInt(card.collector_number) <= highest_collector_number) {
                            legalCards.push(card);
                        }
                    };
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
                    message.channel.send(new Discord.RichEmbed().setDescription(cardnames).setTitle("14 cards from Dominaria").setURL(createScryfallLink(cardnames, "rarity", "dom")));
                });
            } else {
                let legalCards = [];
                for(card of cards) {
                    if (parseInt(card.collector_number) <= highest_collector_number) {
                        legalCards.push(card);
                    }
                };
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
                    message.channel.send(new Discord.RichEmbed().setDescription(cardnames).setTitle("14 cards from Dominaria").setURL(createScryfallLink(cardnames, "rarity", "dom")));
            }
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
    else if (message.content.startsWith("!p1p1 about")) {
        message.channel.send("\
            This bot was made to generate booster packs and discuss what to pick first in packs. More sets will be available as i add them, feel free to come with feedback on what sets you would like to see supported. \n \n Author: Martin Ekström \n Discord username: Yunra \n Support development by donating: https://www.paypal.me/yunra");
    }
    else if (message.content.startsWith("!p1p1 help")) {
        message.channel.send("This bot supports the following commands \n \n \
!p1p1 m19 - Generate a 15 card booster pack for Core Set 2019. \n \
!p1p1 paupercube - Generate a 15 card booster pack for thepaupercube.com \n \
!p1p1 brewchallenge - You get 1 randomly picked card and have to build a deck around it. \n \
\n \
!p1p1 about - Learn more about the bot. \n \
!p1p1 help - Displays this info, its literally the command you just used. \n \
\n \
If you can not see the boosters, check your discord settings if you have disabled link previews."
        );
    }
    else if (message.content.startsWith("!p1p1")) {
        message.channel.send("Use !p1p1 help");
    }
});

client.login("NDc1Njc1MzM3MjM4NTExNjE5.DlDEvQ.YpaLumrJI_Hco2i-3HiUHV5nuzE");
/**
 * Utilities class for methods related to Magic: The Gathering 
 */
var utils = require('./utils.js');
var cache = require('memory-cache');
var request = require('request');
const Discord = require("discord.js");
const mainclass = require("./app.js");

//Global variables
var setTag;
var packvalue;
var foil;

function getOneRandomCard(setData) {
    var shuffled = utils.shuffleArray(setData);
    return shuffled[0];
}

 module.exports = {
     getPlanarCard: function(message) {
        var planarchaos = "mtg_planarchaos";
        if (cache.get(planarchaos)) {
            var setData = cache.get(planarchaos);
            var card = getOneRandomCard(setData);
            message.channel.send(new Discord.RichEmbed().setTitle(card.name).setDescription(card.oracle_text).setImage(card.image_uris['normal']).setURL(card.scryfall_uri));
        } else {
            request('https://api.scryfall.com/cards/search?unique=cards&q=e%3Apca+t%3Aplane', {json: true}, function (error, response, setData) {
                cache.put(planarchaos, setData.data);
                var card = getOneRandomCard(setData.data);
                message.channel.send(new Discord.RichEmbed().setTitle(card.name).setDescription(card.oracle_text).setImage(card.image_uris['normal']).setURL(card.scryfall_uri));
            });
        }
     },
     rollForPlanes: function(message) {
        if (Math.floor(Math.random() * 5) == 0) {
            message.channel.send("You rolled {CHAOS} and should do what the Planar card tells you.");
        } else if (Math.floor(Math.random() * 5) == 1) {
            message.channel.send("You rolled to change the planes!");
            this.getPlanarCard(message);
        } else {
            message.channel.send("You rolled a blank and nothing happens");
        }
    },
    //Create a booster with a set amount of mythics, rares, uncommons and commons
    createBooster: function(set, mythicrares = 1, uncommons = 3, commons = 10) {
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
        var booster = [];
        if (this.containsFoil(set[0].set)) {
            commons = commons -1;
            booster = common.slice(0,commons);
        } else {
            booster = common.slice(0,commons);
        }
        booster = booster.concat(uncommon.slice(0,uncommons));
        
        if (Math.floor(Math.random() * 7) == 0) {
            booster = booster.concat(mythic.slice(0,mythicrares));
        } else {
            booster = booster.concat(rare.slice(0,mythicrares));
        }
        var cardnames = [];
        packvalue = 0;
        for (card of booster) {
            cardnames.push(card.name);
            if (parseInt(card.usd) > packvalue) {
                packvalue = parseInt(card.usd);
            }
        }
        cardnames = this.addFoilToCardnames(cardnames, set);
        cardnames.push(module.exports.getBasicLand());
        return cardnames;
    },
    getFoilCard: function(set) {
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
        
        card = [];
        randomNumber = Math.floor(Math.random() * 14);
        if (randomNumber == 0) {
            if (Math.floor(Math.random() * 7) == 0) {
                card = card.concat(mythic.slice(0,1));
            } else {
                card = card.concat(rare.slice(0,1));
            }
        } else if (randomNumber <= 3 && randomNumber >= 1 ) {
            var card = uncommon.slice(0,1);
        } else {
            var card = common.slice(0,1);
        }

        console.log("FOIL: " + card[0].name + " Randnum = " + randomNumber);

        return card;
    },
    containsFoil: function(setCode) {
        if (setCode == "uma") {
            return true;
        } else {
            return false;
        }
    },    
    addFoilToCardnames: function(cardnames, set) {
        if (this.containsFoil(set[0].set)) {
            foil = [];
            foil = foil.concat(this.getFoilCard(set));
            cardnames.push(foil[0].name);
            foil = foil[0].name;
        }
        return cardnames;
    },
    //Get a basic land
    getBasicLand: function(amount = 1) {
        var lands = ["Plains", "Island", "Swamp", "Mountain", "Forest"];
        var ravnicaGuildGates = ["Boros Guildgate", "Dimir Guildgate", "Selesnya Guildgate", "Izzet Guildgate", "Golgari Guildgate"];
        if (setTag == "grn") {
            lands = ravnicaGuildGates;
        }
        var shuffledBasics = utils.shuffleArray(lands);
        return shuffledBasics.slice(0, amount);
    },
    //Takes a set (3 letters) and an amount of cards in the booster, default 14
    generateBoosterFromScryfall: function(client, message, set_code, amount = 14) {
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
                    var cardnames = module.exports.createBooster(cached_set);
                    var footer = "";
                    if (packvalue >= 10) {
                        footer = "A card in this pack is worth $" + packvalue + " - " + setData.name + " was released " + setData.released_at;
                    } else {
                        footer = setData.name + " was released " + setData.released_at;
                    }
                    message.channel.send(new Discord.RichEmbed().setDescription(cardnames).setTitle(setData.name).setURL(module.exports.createScryfallLink(cardnames, "rarity", setData.code)).setFooter(footer));
                } else {
                    var isBooster = "+is%3Abooster";
                    if(module.exports.isSetReleased(setData.released_at) == false) {
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
                                    var cardnames = module.exports.createBooster(cards);
                                    utils.setActivity(cardnames, client);
                                    if (module.exports.isSetReleased(setData.released_at) == true) {
                                        var footer = "";
                                        if (packvalue >= 10) {
                                                footer = "A card in this pack is worth $" + packvalue + " - " + setData.name + " was released " + setData.released_at;
                                        } else {
                                            footer = setData.name + " was released " + setData.released_at;
                                        }
                                        message.channel.send(new Discord.RichEmbed().setDescription(cardnames).setTitle(setData.name).setURL(module.exports.createScryfallLink(cardnames, "rarity", setData.code)).setFooter(footer));
                                    } else {
                                        message.channel.send(new Discord.RichEmbed().setDescription("This set has not been released yet and for spoiler reasons you have to use the scryfall link to see the generated booster. The pack can contain any currently spoiled card, including promos and planeswalker deck cards.").setTitle(setData.name).setURL(module.exports.createScryfallLink(cardnames, "rarity", setData.code)).setFooter(setData.name + " will be released " + setData.released_at));
                                    }
                                    utils.log(message.author.id + " generated a " + setData.name + "-booster");
                                });
                            } else {
                                var cardnames = module.exports.createBooster(cards);
                                utils.setActivity(cardnames, client);
                                if (module.exports.isSetReleased(setData.released_at) == true) {
                                    var footer = "";
                                    if (packvalue >= 10) {
                                        footer = "A card in this pack is worth $" + packvalue + " - " + setData.name + " was released " + setData.released_at;
                                    } else {
                                        footer = setData.name + " was released " + setData.released_at;
                                    }
                                    message.channel.send(new Discord.RichEmbed().setDescription(cardnames).setTitle(setData.name).setURL(module.exports.createScryfallLink(cardnames, "rarity", setData.code)).setFooter(footer));
                                } else {
                                    message.channel.send(new Discord.RichEmbed().setDescription("This set has not been released yet and for spoiler reasons you have to use the scryfall link to see the generated booster. The pack can contain any currently spoiled card, including promos and planeswalker deck cards.").setTitle(setData.name).setURL(module.exports.createScryfallLink(cardnames, "rarity", setData.code)).setFooter(setData.name + " will be released " + setData.released_at));
                                }
                                utils.log(message.author.id + " generated a " + setData.name + "-booster");
                            }
                            if (module.exports.isSetReleased(setData.released_at) == true) {
                                cache.put(set_code, cards);
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
    },
    //Check if a set is released by comparing the releasedate with todays date
    isSetReleased: function(releasedate) {
        var today = new Date();
        var released_at = new Date(releasedate);
        var released = false;
        if (today < released_at) {
            release = false;
        } else {
            released = true;
        }
        return released;
    },
    //Create the scryfall link so you can view the cards easily
    createScryfallLink: function(cardlist, order = "rarity", set) {
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
 }
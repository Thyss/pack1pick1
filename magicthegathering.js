/**
 * Utilities class for methods related to Magic: The Gathering 
 */
var utils = require('./utils.js');
var cache = require('memory-cache');
var request = require('request');
const Discord = require("discord.js");

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
    }
 }
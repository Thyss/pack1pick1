/**
 * https://swdestinydb.com/api/
 * 
 * Booster generation for Star Wars Destiny using the swdestinydb.com API
 */
var request = require('request');
const Discord = require("discord.js");
var utils = require('./utils.js');

 module.exports = {
     getSwdBooster: function getSwdBooster(setCode, message) {
        request('https://swdestinydb.com/api/public/cards/' + setCode.replace(/\s/g, ''), {json: true}, function (error, response, setData) {
            var mythic = [];
            var rare = [];
            var uncommon = [];
            var common = [];
            for (card of setData) {
                if (card.rarity_name == "Common") {
                    common.push(card);
                } else if(card.rarity_name == "Uncommon") {
                    uncommon.push(card);
                } else if (card.rarity_name == "Rare") {
                    rare.push(card);
                } else if (card.rarity_name == "Legendary") {
                    mythic.push(card);
                }
            }
            common = utils.shuffleArray(common);
            uncommon = utils.shuffleArray(uncommon);
            rare = utils.shuffleArray(rare);
            mythic = utils.shuffleArray(mythic);
            var booster = common.slice(0,3);
            booster = booster.concat(uncommon.slice(0,1));
            if (Math.floor(Math.random() * 7) == 0) {
                booster = booster.concat(mythic.slice(0,1));
            } else {
                booster = booster.concat(rare.slice(0,1));
            }
            var cardnames = [];
            var cardimage = "";
            for (card of booster) {
                cardnames.push(card.name);
                if(card.rarity_name == "Rare" || card.rarity_name == "Legendary") {
                    cardimage = card.imagesrc;
                }
            }
            message.channel.send(new Discord.RichEmbed().setDescription(cardnames).setTitle("Star Wars Destiny Booster").setFooter("Want visuals? http://swdestinydb.com").setImage(cardimage));
        });
     }
 };
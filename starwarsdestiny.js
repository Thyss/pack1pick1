/**
 * https://swdestinydb.com/api/
 * 
 * Booster generation for Star Wars Destiny using the swdestinydb.com API
 */
var request = require('request');
const Discord = require("discord.js");
var utils = require('./utils.js');
var cache = require('memory-cache');

const { EmbedBuilder } = require('discord.js');

function createBooster(setData) {
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
    return booster;
}

 module.exports = {
     getSwdBooster: async function getSwdBooster(setCode, interactionOrMessage, client) {
        const reply = async (payload) => {
          // Accept either interaction or old message object
          if (interactionOrMessage?.isChatInputCommand) {
            if (payload.embeds) {
              return interactionOrMessage.editReply({ embeds: payload.embeds });
            } else {
              return interactionOrMessage.editReply(payload);
            }
          } else {
            return interactionOrMessage.channel.send(payload);
          }
        };

        if (cache.get("swd_" + setCode)) {
            utils.log("swd_" + setCode + " was found in the cache");
            var booster = createBooster(cache.get("swd_" + setCode));
            var cardnames = [];
            var cardimage = "";
            for (card of booster) {
                cardnames.push(card.name);
                if(card.rarity_name == "Rare" || card.rarity_name == "Legendary") {
                    cardimage = card.imagesrc;
                    utils.setActivityCard(card.name, client);
                }
            }
            const embed = new EmbedBuilder().setDescription(cardnames.join('\n')).setTitle("Star Wars Destiny Booster").setFooter({ text: "Want visuals? http://swdestinydb.com" }).setImage(cardimage);
            await reply({ embeds: [embed] });
        } else {
            request('https://swdestinydb.com/api/public/cards/' + setCode.replace(/\s/g, ''), {json: true}, async function (error, response, setData) {
                cache.put("swd_" + setCode, setData);
                utils.log("Adding set to cache with key: swd_" + setCode);
                var booster = createBooster(setData);
                var cardnames = [];
                var cardimage = "";
                for (card of booster) {
                    cardnames.push(card.name);
                    if(card.rarity_name == "Rare" || card.rarity_name == "Legendary") {
                        cardimage = card.imagesrc;
                    }
                }
                const embed = new EmbedBuilder().setDescription(cardnames.join('\n')).setTitle("Star Wars Destiny Booster").setFooter({ text: "Want visuals? http://swdestinydb.com" }).setImage(cardimage);
                await reply({ embeds: [embed] });
            });
        }
     }
 };
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

//Get a booster with a certain number of cards from a cubetutor
function getCardsFromCT(response, amount) {
    var selected = [];
    selected = response.toString().split('\n');
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
            url:'http://www.cubetutor.com/viewcube.exportform.exportlistform', method:'POST',
            form: {"t:ac": ctID,
                  "t:formdata": "L+PVfUyWS7KfKAY1b/cATEoMx00=:H4sIAAAAAAAAAFvzloG1XI5BJiwztdy5NCnVKrWiIL+oJC2/KFcvLTMntaSyILW4iME0vyhdL7EgMTkjVa8kEShUUlRpqpecX5Sak5mkl5RYnKrnmAQUTEwucctMzUlRCU4tKS1QDT3M/VD0+B8mBkYfBu7k/LySovwcv8Tc1BIGIZ+sxLJE/ZzEvHT94JKizLx064qCEgYOkJ0hQDuJcJMjqW4KKMpPTi0uDi5Nys0sLs7Mzzu8LsUk7du8c0wMDBUF5TIMUthsLAYpLwHa54DXvuT83IL8vNS8kmI9sAUlmNbNDP4kuXVLizMTA5MPA0dyTiZQtWdKIUMdOHhSc1JzgQKg4AELgYMDYnm8EYJpAADQ2n82sgEAAA==",
                  fileType:'CUBE_TXT',
                  submit_0: "Export",
                  "t:submit:": '["submit_2","submit_0"]'
                },
                headers: {
                  'cookie': 'JSESSIONID=46160491092C9D57C43C94566C28C368;'
                }
          }
          request(options,
                   function (error, response, body) {
                      let booster = getCardsFromCT(body, 15);
                      console.log('body:', body); // Print the HTML for the Google homepage.
                      console.log("request", response.req['_header']);
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

client.login("NDc4NjAzMTM4MjEyMDM2NjA5.DlNGYg.eTAdpyDVJDs0g3gTztnvJqSy5Mo");

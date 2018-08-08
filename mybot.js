var fs = require("fs");
const Discord = require("discord.js");

const client = new Discord.Client();

client.on("ready", () => {
    console.log("I am ready!");
});

client.on("message", (message) => {
    if (message.content.startsWith("!p1p1 pauper")) {
        fs.readFile('./cardsets/paupercube.txt', 'utf8', function(err, text){
            var textByLine = text.split('\n');
            
            //Shuffle the cards so they aren't sorted and select 15 of them.
            const shuffled = textByLine.sort(() => .5 - Math.random());
            let selected = shuffled.slice(0,15);

            //Create scryfall link for images
            var scryfalllink = "https://scryfall.com/search?unique=cards&as=grid&order=name&q=";
            scryfalllink += selected.join('+or+!');
            scryfalllink = scryfalllink.replace(/ /g, '-');
            scryfalllink = scryfalllink.replace(/\s/g, '');  
           
            //Select a random card from the booster to set as the "playing" for the bot.
            var randcard = Math.floor(Math.random() * selected.length);
            client.user.setActivity(selected[randcard].toString(), { type: 'PLAYING'});

            message.channel.send(new Discord.RichEmbed().setDescription(selected).setURL(scryfalllink).setTitle("15 cards from Thepaupercube.com"));
        });
    }
    else if (message.content.startsWith("!p1p1 chaos")) {
        message.channel.send(new Discord.RichEmbed().setDescription("This feature is not implemented yet! \n Check back later!"));
    }
    else if (message.content.startsWith("!p1p1 m19")) {
        fs.readFile('./cardsets/m19/common.txt', 'utf8', function(err, text){
            var textByLine = text.split('\n');
            
            //Shuffle the cards so they aren't sorted and select 15 of them.
            const shuffled = textByLine.sort(() => .5 - Math.random());
            let selected = shuffled.slice(0,10);
            fs.readFile('./cardsets/m19/uncommon.txt', 'utf8', function(err, text){
                var textByLine = text.split('\n');
            
                const uncommons = textByLine.sort(() => .5 - Math.random());
                selectedUncommons = uncommons.slice(0,3);
                selected = selected.concat(selectedUncommons);

                fs.readFile('./cardsets/m19/rare.txt', 'utf8', function(err, text){
                    var textByLine = text.split('\n');
                
                    //Shuffle the cards so they aren't sorted and select 15 of them.
                    const rares = textByLine.sort(() => .5 - Math.random());
                    selectedrares = rares.slice(0,1);
                    selected = selected.concat(selectedrares);
            
                    //Create scryfall link for images
                    var scryfalllink = "https://scryfall.com/search?unique=cards&as=grid&order=rarity&set=m19&q=";
                    scryfalllink += selected.join('+or+!');
                    scryfalllink = scryfalllink.replace(/ /g, '-');
                    scryfalllink = scryfalllink.replace(/\s/g, ''); 
                    
                    //Select a random card from the booster to set as the "playing" for the bot.
                    var randcard = Math.floor(Math.random() * selected.length);
                    client.user.setActivity(selected[randcard].toString(), { type: 'PLAYING'});

                    message.channel.send(new Discord.RichEmbed().setDescription(selected).setURL(scryfalllink).setTitle("15 cards from Core Set 2019"));
                });
            });
        });
    }
    else if (message.content.startsWith("!p1p1 about")) {
        message.channel.send(new Discord.RichEmbed().setTitle("About Pack1Pick1 bot").setDescription("\
            This bot was made to generate booster packs and discuss what to pick first in certain packs. \n \
            Author: Martin Ekström \n \
            Discord username: Yunra \n \
            Support development by donating: https://www.paypal.me/yunra"));
    }
    else if (message.content.startsWith("!p1p1 help")) {
        message.channel.send(new Discord.RichEmbed().setTitle("Supported commands").setDescription("\
            !p1p1 m19 - Generate a 15 card booster pack for Core Set 2019 \n  \
            !p1p1 pauper - Generate a 15 card booster pack for thepaupercube.com \n  \
            !p1p1 chaos - Generate a 15 card booster pack from random cards through Magic's history! \n \
            - \n \
            !p1p1 about - Learn more about the bot \n \
            !p1p1 help - Displays this info, its literally the command you just used."
        ));
    }
    else if (message.content.startsWith("!p1p1")) {
        message.channel.send("Use !p1p1 help");
    }
});

client.login("NDc1Njc1MzM3MjM4NTExNjE5.Dkie1w.uuCe3W8QjXCwaF4Pln8LZd45By0");
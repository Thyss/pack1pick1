/**
 * Tools that all components might want to use
 */

//Shuffle an array of cards to not always get the same cards
module.exports = {
    shuffleArray: function shuffleArray(o) {
        for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
    },
    //Select a random card from the booster to set as the "playing" for the bot.
    setActivity: function setActivity(booster, client) {
        var randcard = Math.floor(Math.random() * booster.length);
        client.user.setActivity(booster[randcard].toString(), { type: 'PLAYING'});
    },
    log: function log(event) {
        console.log("[" + new Date() + "] " + event);
    },
    setActivityCard: function (cardname, client) {
        client.user.setActivity(cardname, { type: 'PLAYING'});
    },
    rollDice: function (max) {
        return Math.floor(Math.random() * max +1);
    },
    setPatreonText: function (text) {
        // 1 of every 6 should include patreon link
        if(Math.floor(Math.random() * 5) == 0) {
            return "patreon.com/yunra";
        } else {
            return text;
        }
    },
    removeCardtypeFromList: function (array, cardType) {
        return array.filter(function(element){
            return element.type_line !== cardType;
        });
    }
    
};

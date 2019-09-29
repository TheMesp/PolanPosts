//const {prefix,token,defaultTextChannels,defaultVoiceChannels,defaultRoles} = require('./config.json');
const config = require('./config.json');
const token = require('./token.json')
const Discord = require('discord.js');
const snekfetch = require('snekfetch');
const client = new Discord.Client();
const SENTINEL = 99649;
const VERSION = 'v1.4.2'
function getWeekday(num){
    var output;
    switch(num){
        case 0:
            output = "January";
            break;
        case 1:
            output = "February";
            break;
        case 2:
            output = "March";
            break;
        case 3:
            output = "April";
            break;
        case 4:
            output = "May";
            break;
        case 5:
            output = "June";
            break;
        case 6:
            output = "July";
            break;
        case 7:
            output = "August";
            break;
        case 8:
            output = "September";
            break;
        case 9:
            output = "October";
            break;
        case 10:
            output = "November";
            break;
        case 11:
            output = "December";
            break;
    }
    return output;
}
//puts the current daily into the text channel.
function getDaily(channel){
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    var formattedToday = mm + '/' + dd + '/' + yyyy;  
    var url = today.getDate() == 1 ? 'https://www.reddit.com/r/polandball/top/.json?sort=top&t=month' : 'https://www.reddit.com/r/polandball/top/.json?sort=top&t=day';
    var description = today.getDate() == 1 ? getWeekday((today.getMonth() + 11)%12) : formattedToday;   
    try{
        snekfetch
            .get(url)
            .query({limit: 10})
            .then(r => {
                const posts = r.body.data.children.filter(post => !post.data.is_self);
                try{
                    const embed = new Discord.RichEmbed()
                        .setColor(0xC0D890)
                        .setTitle(posts[0].data.title)
                        .setURL(posts[0].data.url)
                        .setAuthor("OP: " + posts[0].data.author, posts[0].data.author_flair_richtext[0].u, "https://www.reddit.com" + posts[0].data.permalink)
                        .setImage(posts[0].data.url)
                        .setFooter("Best post of " + description)
                    channel.send(embed)
                }catch(err){
                    console.log(err)
                    channel.send("*cough*")
                }
            })
            .catch();
    }catch(e){
        return console.log(e);
    }
}

client.on('error', console.error);//Basic catch-all error handling line

client.on('ready', () => {
    console.log("PolanPosts " + VERSION + ", by David \"Mesp\" Loewen.");
    console.log("Ready!");
    client.user.setActivity('"Spaceman"');
});
client.on('message', message =>{
    if(message.content.includes("cannot into space")){
        message.channel.send(":(")
    }
    //filter out the weak.
    if(!message.content.startsWith(config.prefix) || message.author.bot)
        return;

    const args = message.content.slice(config.prefix.length).split(' ');//Turns the textline into an array of args.
    const command = args.shift().toLowerCase();//returns the first argument (the command) and then removes it from the array.
    //prints the message to the console.
    console.log(message.author.username + " said: " + message.content);
    console.log("command: " + command);
    console.log("args: " + args);
    //Post grabs any of the top posts of the year.
    //Top grabs one of the top posts of all time.
    //Random grabs one of the most controversial posts.
    if(command === "post" || command === "top" || command === "random" || command === "new"){
        try{
            var url, colourHex, min, max;
            if(command === "post"){
                url = 'https://www.reddit.com/r/polandball/top/.json?sort=top&t=year';
                colourHex = 0x00A2E8;
                min = 25;
                max = 100;
            }else if(command === "top"){
                url = 'https://www.reddit.com/r/polandball/top/.json?sort=top&t=all';
                colourHex = 0x32CD32;
                min = 0;
                max = 100;
            }else if(command === "random"){
                message.channel.send("Let's dig out some śmieci");
                url = 'https://www.reddit.com/r/polandball/controversial/.json?sort=controversial&t=all';
                colourHex = 0xF08080;
                min = 0;
                max = 100;
            }else{//command === "new"
                message.channel.send("FRESH OFF THE PRESS");
                url = 'https://www.reddit.com/r/polandball/new/.json';
                colourHex = 0x89cff0;
                min = 0;
                max = 5;
            }
            if(args.length != 0){
                //User wants a certain range
                var formattedArgs = args[0].split("-");
                if(formattedArgs[0] === args[0]){
                    //No dash - set max to sentinel, to signify specific fetch
                    if(args[0].charAt(0) == '#'){
                        max = SENTINEL;
                        min = parseInt(args[0].substring(1,args[0].length), 10) - 1;
                    }else{
                        max = parseInt(args[0], 10);
                    }
                }else{
                    //There be a dash
                    min = parseInt(formattedArgs[0], 10) - 1;
                    max = parseInt(formattedArgs[1], 10);
                }
            }
            if(min == NaN || max == NaN || min < 0 || max <= 0 || min >= max){
                //Damn end users!
                message.channel.send("Kurwa! Incorrect range formatting.");
                message.channel.send("Use `!![command] [num]` to set a custom maximum bound.");
                message.channel.send("Use `!![command] [num]-[higherNum]` to set a custom minimum and maximum bound.");
                message.channel.send("Use `!![command] #[num]` to fetch a specific post number.");
                return;
            }else if(max > 100 && max != SENTINEL){
                message.channel.send("Kurwa! Those posts are too far in space. Poor polan can only into 100 posts at a time.");
                return;
            }
            snekfetch
                .get(url)
                .query({limit: max})
                .then(r => {
                    const posts = r.body.data.children.filter(post => !post.data.is_self);
                    if(posts.length > 0){
                        const rando = max == SENTINEL ? min : Math.floor(Math.random() * (posts.length - min) + min);
                        try{
                            const embed = new Discord.RichEmbed()
                                .setColor(colourHex)
                                .setTitle(posts[rando].data.title)
                                .setURL(posts[rando].data.url)
                                .setAuthor("OP: " + posts[rando].data.author, posts[rando].data.author_flair_richtext[0].u, "https://www.reddit.com" + posts[rando].data.permalink)
                                .setImage(posts[rando].data.url)
                            if(command === "top"){
                                embed.setFooter(`#${rando + 1} highest ranked post of all time with ${posts[rando].data.ups} upvotes`)
                            }
                            message.channel.send(embed)
                        }catch(err){
                            message.channel.send("`Post is improperly formatted or does not exist`")
                        }
                    }else{
                        message.channel.send("Kurwa! No comics found! Try a broader range.")
                    }
                })
                .catch();
        }catch(e){
            return console.log(e);
        }
    }
    
    if(command === "daily"){
        getDaily(message.channel)
    }
    
    
})
var today = new Date();
var day = today.getDate();
client.login(token.token);
setInterval(function() {
    today = new Date();
    if(day == today.getDate()){
        console.log("Polled for new day - it's not tomorrow yet");
    }else{
        console.log("Polled for new day - it is now tomorrow!");
        day = today.getDate();
        getDaily(client.guilds.get("116673400499470339").channels.get(config.dailyChannelID))
    }
    //Now lets set a new activity
    switch(Math.floor(Math.random() * 10)){
        case 0:
            client.user.setActivity('"Spaceman"');
            break;
        case 1:
            client.user.setActivity('on Sputnik');
            break;
        case 2:
            client.user.setActivity('with Lithuania');
            break;
        case 3:
            client.user.setActivity('"Poland is Not Yet Lost"');
            break;
        case 4:
            client.user.setActivity('The Witcher 3: Wild Hunt');
            break;
        case 5:
            client.user.setActivity('Football');
            break;
        case 6:
            client.user.setActivity('on a Trampoline');
            break;
        case 7:
            client.user.setActivity('in a Pool');
            break;
        case 8:
            client.user.setActivity('a Koza');
            break;
        case 9:
            client.user.setActivity(VERSION);
            break;
    }
}, 3600000);//3600000 milliseconds = 1 hour
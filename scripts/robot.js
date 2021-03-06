
"use strict";

var cheerio = require('cheerio')
var request = require('request')
var querystring = require('querystring')
var iconvlite = require('iconv-lite')
var fs = require('fs')
var util = require('util')

// var LineMessaging = require('../index.coffee')
var LineMessaging = require('hubot-line-messaging')
var SendSticker = LineMessaging.SendSticker
var SendLocation = LineMessaging.SendLocation
var SendImage = LineMessaging.SendImage
var SendVideo = LineMessaging.SendVideo
var SendText = LineMessaging.SendText
var SendAudio = LineMessaging.SendAudio
var StickerMessage = LineMessaging.StickerMessage
const BuildTemplateMessage = LineMessaging.BuildTemplateMessage;

const LINE_TOKEN = process.env.HUBOT_LINE_TOKEN;

module.exports = function(robot){

    robot.respond(/hello/i, function(res){
        const sourceType = res.message.sourceType;
        // if USER_PROFILE is SET and sourceType === user
        // then there will be user profile under res.message.user
        if (sourceType === 'user') {
          console.log(res.message.user.displayName);
        }
        res.reply('world');
    });

    // Echo a Sticker msg
    var matcher = function(message){
        // Not implement listenrt, so should CatchAllMessage.message
        var stickerMsg = message.message;
        if (stickerMsg && stickerMsg.type && stickerMsg.type === 'sticker'){
            if(stickerMsg.stickerId === '1'){
                robot.logger.debug(stickerMsg);
                return true
            }
        }
        return false;
    }
    robot.listen(matcher, function(res){
        var stickerMessage = res.message.message;
        res.envelope.message = stickerMessage;
        var sticker = new SendSticker(stickerMessage.stickerId, stickerMessage.packageId);
        res.reply(sticker);
    });

    robot.respond(/google (.*)/i, function(res){
        let keyword = res.match[1];
        keyword = querystring.escape(keyword);
        cheerioTest(res, keyword);
    });

    robot.respond(/tina/i, function(res){
        res.reply('Happy Birthday~');
    });

    robot.respond(/sj/i, function(res){
        res.reply('Happy Birthday +1');
    });

    robot.respond(/sticker (.*)/i, function(res){
        let keyword = res.match[1];
        const customize = ['34', '34', '34', '8027272', '8121073', '9381511', '2637', '2634', '8109573'];
        if(keyword === '520'){
            keyword = res.random(customize);
        }
        let sticker = new SendSticker(keyword, '1');
        // robot.logger.debug (sticker instanceof SendSticker)
        res.emote(sticker);
    });

    robot.respond(/location/i, function(res){
        // ＬＩＮＥ株式会社
        let location =
            new SendLocation(
                'ＬＩＮＥ',
                '〒150-0002 東京都渋谷区渋谷２丁目２１−１',
                35.65910807942215,
                139.70372892916203
            );
        res.emote(location);
    });

    robot.respond(/text/i, function(res){
        let text = new SendText('This is a text')
        let text2 = new SendText('Second Line')
        let text3 = new SendText('Third Line')
        res.reply(text, text2, text3);
    });

    robot.respond(/text2/i, function(res){
        let text = 'This is a text'
        let text2 = 'Second Line'
        let text3 = 'Third Line'
        res.reply(text, text2, text3);
    });

    robot.respond(/testimage (.*)/i, function(res){
        let originalContentUrl = res.match[1];
        let previewImageUrl = 'https://placeholdit.imgix.net/~text?txtsize=23&txt=240%C3%97240&w=240&h=240';
        res.reply(new SendImage(originalContentUrl, previewImageUrl));
    });

    robot.respond(/video (.*) (.*)/i, function(res){
        let originalContentUrl = res.match[1];
        let previewImageUrl = res.match[2];
        res.reply(new SendVideo(originalContentUrl, previewImageUrl));
    });

    robot.respond(/audio (.*) (.*)/i, function(res){
        let originalContentUrl = res.match[1];
        let duration = res.match[2];
        res.reply(new SendAudio(originalContentUrl, previewImageUrl));
    });

    robot.respond(/test2/i, function(res){

        let sticker1 = new SendSticker('1', '1');
        let sticker2 = new SendSticker('2', '1');
        let sticker3 = new SendSticker('3', '1');
        // Test Multi
        res.emote(sticker1, sticker2, sticker3);
        // res.reply(sendSticker1, sendSticker2);
    });

    // Template Message
    robot.respond(/template/i, (res) => {
        let msg = BuildTemplateMessage
            .init('this is a template msg')
            .buttons({
                thumbnailImageUrl: 'https://github.com/puresmash/chatting-robot/blob/develope/docs/template.jpg?raw=true',
                title: 'Template Message',
                text: 'Let me google for you'
            })
            .action('uri', {
                label: 'Open Google',
                uri: 'https://www.google.com.tw/'
            })
            .action('uri', {
                label: 'Adapter Link',
                uri: 'https://github.com/puresmash/hubot-line-messaging'
            })
            .build();
        res.reply(msg);
    });

    // Template Message
    robot.respond(/carousel/i, (res) => {
        let msg = BuildTemplateMessage
            .init('this is a carousel msg')
            .carousel({
                thumbnailImageUrl: 'https://github.com/puresmash/chatting-robot/blob/develope/docs/template.jpg?raw=true',
                title: 'Carousel Message 1',
                text: 'Let me google for you'
            })
            .action('uri', {
                label: 'Google it',
                uri: 'https://www.google.com.tw/'
            })
            .action('uri', {
                label: 'Adapter Link',
                uri: 'https://github.com/puresmash/hubot-line-messaging'
            })
            .carousel({
                thumbnailImageUrl: 'https://github.com/puresmash/chatting-robot/blob/develope/docs/carousel.jpg?raw=true',
                title: 'Carousel Message 2',
                text: 'Let me google for you'
            })
            .action('uri', {
                label: 'Google it',
                uri: 'https://www.google.com.tw/'
            })
            .action('uri', {
                label: 'Adapter Link',
                uri: 'https://github.com/puresmash/hubot-line-messaging'
            })
            .build();
        res.reply(msg);
    });

    // Template Message
    robot.respond(/confirm (.*)/i, (res) => {
        let keyword = res.match[1];

        let msg = BuildTemplateMessage
            .init('this is a confirm msg')
            .confirm({
                text: `確定要${keyword}的舉手?`
            })
            .action('message', {
                label: 'OK',
                text: `我要${keyword}`
            })
            .action('message', {
                label: 'Cancel',
                text: `我不要${keyword}`
            })
            .build();
        res.reply(msg);
    });

    // Test on web
    // robot.router.get('/', function(req, res){
    //     // robot.logger.debug('GET LINE MSG');
    //     // res.send('GET MSG');
    // });
    // console.log(robot.listeners[0]);
    // robot.router.post('/', function(req, res){
    //     robot.logger.debug('GET LINE MSG');
    //     robot.logger.debug(req.body);
    //     // console.log(util.inspect(LineAdapter, false, null))
    //     // let msgObj = getLineMsg(req.body);
    //     // const replyToken = msgObj.replyToken;
    //     // const msg = msgObj.msg;
    //     // const reply = formatReplyMsg(replyToken, `Get msg: ${msg}`);
    //     // replyLineMsg(res, reply, robot.logger);
    //     // res.send('GET MSG');
    // });
}
// Line Message API
function getLineMsg(body){
    const msg = body.events[0].message.text;
    const replyToken = body.events[0].replyToken;
    return {msg: msg, replyToken: replyToken};
}
function formatReplyMsg(replyToken, text){
    const reply = {
        "replyToken": replyToken,
        "messages":[
            {
                "type": "text",
                "text": text
            }
        ]
    }
    return reply;
}
function replyLineMsg(user, replyObj, logger){
    const MsgType = {
        Text: 'text',
        Image: 'image',
        Video: 'video',
        Audio: 'audio',
        Location: 'location',
        Sticker: 'sticker'
    }
    const options = {
        url: 'https://api.line.me/v2/bot/message/reply',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LINE_TOKEN}`
        },
        method: 'POST',
        body: JSON.stringify(replyObj)
    }
    request(options, function(error, response, body){
        logger.debug(options.header);
        logger.debug(response.statusCode);
        logger.debug(body);
        // user.send(`GET YOUR MSG: ${data}`);
    });

}
// Google Search
function cheerioTest(user, keyword){
    const options = {
        url: `https://www.google.com/search?gws_rd=ssl&num=3&q=${keyword}`,
        headers: {
            'User-Agnet': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36'
        },
        encoding: null,
        method: 'GET'
    }
    request(options, function(error, response, body){
        if (!error && response.statusCode == 200) {
            const content = iconvlite.decode(body, 'big5');
            const $ = cheerio.load(content);
            // debug
            // console.log($('div.g').length);
            const ele = $('div.g').first();

            const result = existYoutubeView(ele)? getYoutubeView(ele) : getNormalView(ele);
            user.reply(result);

        }
    });
    // .pipe(fs.createWriteStream('debug.html'));
}
// Youtube, Image, Normal
function existYoutubeView(ele){
    return ele.find('h3._X8d a').length != 0
}
function getNormalView(ele){
    let linkEle = ele.find('h3.r a');
    let temp = linkEle.attr('href');
    let link = querystring.parse(temp)['/url?q'];
    // Skip Image Result
    if(!link){
        ele = ele.next();
        linkEle = ele.find('h3.r a');
        temp = linkEle.attr('href');
        link = querystring.parse(temp)['/url?q'];
    }
    const linkText = linkEle.first().text();
    const desc = ele.find('span.st').text();
    return `${linkText}\n${link}\n${desc}`;
}
function getYoutubeView(ele){
    const linkEle = ele.find('h3._X8d a');
    const linkText = linkEle.first().text();
    let temp = linkEle.attr('href');
    const link = querystring.parse(temp)['/url?q'];
    return `${linkText}\n${link}`;
}

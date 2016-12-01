try
  {Robot,Adapter,TextMessage,User} = require 'hubot'
catch
  prequire = require('parent-require')
  {Robot,Adapter,TextMessage,User} = prequire 'hubot'

{SendObject, SendSticker} = require './response'
{EventEmitter} = require 'events'
util = require 'util'
crypto = require 'crypto'

class LineAdapter extends Adapter
    constructor: (@robot) ->
        super @robot

        @REPLY_URL = 'https://api.line.me/v2/bot/message/reply'
        @LINE_TOKEN = process.env.HUBOT_LINE_TOKEN

    reply: (envelope, strings...) ->
        replyToken = envelope.message.replyToken
        replyAry = []
        replyAry.push @_formatTextObj replyToken, msg for msg in strings
        @_sendReply replyObj for replyObj in replyAry

    emote: (envelope, msgObjs...) ->
        replyToken = envelope.message.replyToken
        replyObj =  @_formatReplyObj replyToken, msgObjs
        @_sendReply replyObj

    _sendReply: (replyObj) ->
        logger = @robot.logger
        logger.debug JSON.stringify(replyObj)
        @robot.http(@REPLY_URL)
            .header('Content-Type', 'application/json')
            .header('Authorization', "Bearer #{@LINE_TOKEN}")
            .post(JSON.stringify(replyObj)) (err, res, body) ->
                if err
                    logger.error "Error sending msg: #{err}"
                    return
                if res.statusCode is 200
                    logger.debug "Success, response body: #{body}"
                else
                    logger.debug "Error with statusCode: #{res.statusCode}"
                    logger.debug "Body: #{body}"

    _formatReplyObj: (token, msgAry) ->
        reply =  {
            "replyToken": token,
            "messages":[]
        }
        reply.messages.push @_formatMsgObj msgObj for msgObj in msgAry
        return reply

    _formatMsgObj: (msgObj) ->
        @robot.logger.debug 'msgObj'
        @robot.logger.debug util.inspect msgObj, true, null
        @robot.logger.debug 'msgObj type 2'
        @robot.logger.debug msgObj
        @robot.logger.debug 'SendObject'
        @robot.logger.debug util.inspect SendObject, true, null
        @robot.logger.debug 'SendSticker'
        @robot.logger.debug util.inspect SendSticker, true, null
        # @robot.logger.debug typeof msgObj
        @robot.logger.debug 'msgObj instanceof SendObject'
        @robot.logger.debug msgObj instanceof SendObject
        @robot.logger.debug 'msgObj instanceof SendSticker'
        @robot.logger.debug msgObj instanceof SendSticker
        # @robot.logger.debug SendObject instanceof SendObjectΩ
        if msgObj instanceof SendObject
            return {
                "type": msgObj.type,
                "packageId": msgObj.packageId if msgObj.packageId?,
                "stickerId": msgObj.stickerId if msgObj.stickerId?,
                "title": msgObj.title if msgObj.title?,
                "address": msgObj.address if msgObj.address?,
                "latitude": msgObj.latitude if msgObj.latitude?,
                "longitude": msgObj.longitude if msgObj.longitude?,
            }
        else if typeof msgObj is 'string'
            return {
                "type": "text",
                "text": msgObj
            }


    _formatTextObj: (token, msg) ->
        return {
            "replyToken": token,
            "messages":[
                {
                    "type": "text",
                    "text": msg
                }
            ]
        }

    run: ->
        self = @
        robot = @robot
        options =
            path: '/'

        bot = new LineStreaming(options, @robot)

        bot.on 'message',
            (sourceId, replyToken, text, id) ->
                user = @robot.brain.userForId sourceId
                # console.log util.inspect replyToken, false, null
                message = new TextMessage(user, text, id)
                message.replyToken = replyToken
                self.receive message
        bot.listen()
        self.emit "connected"

class LineStreaming extends EventEmitter
    constructor: (options, @robot) ->
        # router listen path: '/'
        @PATH = options.path
        @CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET

    listen: ->
        # @robot.router.get @PATH, (req, res) =>
        #     console.log 'LISTEN'
        #     replyToken = 'testing token'
        #     eventType = 'message'
        #     text = 'Hubot:hello 中文'
        #     id = 'testing id'
        #     userId = 'testing uid';
        #     # Can't handle other event now, discards them
        #     if eventType is 'message'
        #         @emit 'message', userId, replyToken, text, id
        #     res.send 'OK'

        @robot.router.post @PATH, (req, res) =>
            @robot.logger.debug 'GET LINE MSG'

            # Event
            event = req.body.events[0];
            replyToken = event.replyToken;
            eventType = event.type;

            # Message
            message = @getMessage event
            text = message.text
            id = message.id
            @robot.logger.debug "text: #{text}"

            # Source
            source = @getSource event
            sourceId = source.userId or source.roomId or source.groupId

            # Validate signature
            headerSignature = req.headers['x-line-signature'];
            isValid = @validateSignature req.body, headerSignature
            unless isValid
                @robot.logger.debug "Failed validate, result: #{isValid}"
                @robot.logger.debug "headerSignature: #{headerSignature}"
                res.send 'Auth Failed'
                return;

            # Pass Validate
            # Can't handle other event now, discards them
            if eventType is 'message'
                @emit 'message', sourceId, replyToken, text, id

            res.send 'OK'

    # Message_Type = ['text']
    getMessage: (event)->
        message =
            text: event.message.text;
            id: event.message.id;
        return message

    # Source_Type = ['group', 'room', 'user']
    getSource: (event)->
        source =
            sourceType: event.source.type
            roomId: event.source.userId
            userId: event.source.roomId
            groupId: event.source.groupId
        return source

    validateSignature: (content, headerSignature)->
        genSign = @generateSignature content
        return genSign is headerSignature

    generateSignature: (content)->
        return crypto.createHmac('SHA256', @CHANNEL_SECRET)
            .update(JSON.stringify(content), 'utf8')
            .digest('base64')

exports.use = (robot) ->
    new LineAdapter robot

//var User = require('../models/user.js');
var Room = require('../models/room.js');

var colors = ['red', 'green', 'blue', 'brown', 'orange', 'gray' ]; //currently not used
var onlineUsers = {};

module.exports = function(app, passport, io) {

    app.get('/', function(req, res) {
        if(req.session.nickname)
            res.render('index.ejs');
        else
            res.render('initialize.ejs');
    });

    app.post('/', function(req, res) {
        req.session.nickname = req.body.nickname;
        req.session.color    = req.body.color;
        res.end();
    });

    app.get('/destroySession',    destroySession);

    app.get('/rooms', ensureHasNickname, function(req, res) {       
        res.render('rooms.ejs');
    });
    
    app.post('/rooms', ensureHasNickname, function(req, res) { //the problem that if you reload 'the page uses info you entered'        
        Room.find({name : req.body.newRoomNameField}, function(err, result) {
            if(err)
                return HandleError(err);
            
            if(result.length) {
                res.redirect('/rooms'); //add explanation that a room with that name already exists
                return;
            }

            //if not, add such a room to db 
            var newRoom = new Room({
                name       : req.body.newRoomNameField,
                password   : req.body.newRoomPasswordField,
                maxMembers : req.body.newRoomMaxMembersField
            });

            console.log(req.body.newRoomMaxMembersField + "   " + parseInt(req.body.newRoomMaxMembersField));
           
            newRoom.save(function(err) {
                if(err)
                    console.log(err);
                
                Room.find({}, function(err, roomsList) {
                    if(err)
                        return handleError(err);
                                    
                    io.of('/rooms').emit('roomsList change', roomsList);
                });
                
                res.redirect('/rooms/' + req.body.newRoomNameField);
             });
        });
    });

    app.get('/rooms/:roomName', ensureHasNickname, function(req, res) { //check for password
        var roomName = req.params.roomName;
        Room.findOne({name : roomName}, function(err, room) {
            if(err)
                return handleError(err);
            
            if(!room) {
                res.redirect('/rooms');
                return;
            }

            res.render('room.ejs', {
                room : room
            });

            //io.emit('room');
        });

    });
    
    io.sockets.on('connection', function(socket) { //global namespace
        var nickname = socket.client.request.session.nickname;
        var color    = socket.client.request.session.color;

        console.log(nickname + ' has connected to the / namespace');

        socket.on('room join', function(roomName) {
            console.log(nickname + ' has joined room ' + roomName + '.');
        });

        onlineUsers[nickname] = color;
        io.emit('onlineUsers change', onlineUsers);

        io.emit('chat message', {
            msg      : '*<span style="color:' + color + ';"><b>' + nickname + '</b></span> joined',
            nickname : '',
            color    : 'black'
        });

        socket.on('chat message', function(msg) {
            io.emit('chat message', {
                msg      : msg,
                nickname : nickname,
                color    : color
            });
        });

        socket.on('disconnect', function() {
            console.log(nickname + ' has disconnected from the / namespace');

            delete onlineUsers[nickname];
            io.emit('onlineUsers change', onlineUsers);
            io.emit('chat message', {
                msg      : '*<span style="color:' + color + ';"><b>' + nickname + '</b></span> left',
                nickname : '',
                color    : 'black'
            });
        });
    });

    io.of('/roomsList').on('connection', function(socket) { //when connected to this namespace, socket is also connected to the global one
        var nickname = socket.client.request.session.nickname;
        var color    = socket.client.request.session.color;
        console.log(nickname + ' has connected to the /roomsList namespace');

        socket.on('roomsList change', function(message) {
            Room.find({}, function(err, roomsList) {
                if(err)
                    return handleError(err);
                                
                io.of('/roomsList').emit('roomsList change', roomsList);
            });
        });

        socket.on('disconnect', function () {
            console.log(nickname + ' has disconnected from the /roomsList namespace');
        });
    });
};

function ensureHasNickname(req, res, next) {
    if (req.session.nickname)
        return next();       
    else
        res.redirect('/');
}

function destroySession(req, res) {
    req.session.destroy();
    res.redirect('/');
}

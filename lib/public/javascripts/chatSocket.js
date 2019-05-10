'use strict';

// display story as colored bubbles
// when user enters a room where they still need to say something, get button input
// make this page prettier


$(document).ready(function() {

    $("[data-toggle='tooltip']").tooltip();
    $("input[id=chatMessageField]").focus();

    var getNickname = function() {
        return $('#nickname').text();
    }

    var getUserColor = function(nickname) {
        return $('#' + nickname)[0].style.color;
    }

    var numMembers = function () {
        return $('.roomMember').size();
    }

    var addStoryEntry = function(entry) {
        var textBubble = $('<div class="textBubble label label-default" style="background:' + getUserColor(entry.nickname) + '">' + entry.text + '</div>');
        $('#story').append(textBubble);
    }

    const showNextWords = function(nextWords) {
        $('#wordChoices').empty();
        nextWords.forEach(function(word) {
            var button = $('<button class="inputBubble">' + word + '</button>');

            button.on('click', function() {
                console.log('button: ' + word + ' was clicked');
                socket.emit('chat message', word);
                $('.container').removeClass('waiting-for-input');
                $('.container').addClass('waiting-for-next-word');
            })
            $('#wordChoices').append(button);
        });
    }

    if (room.creator == getNickname() && room.numMessages == 0) {
        // allow text entry
        $('.container').addClass('waiting-for-start-input')
        console.log('start story;')
    } else if (room.lastWriter != getNickname() && room.numMessages > 0) {
        // we need to show some buttons / ask for input
        $('.container').addClass('waiting-for-input');
        showNextWords(nextWords);
        console.log('input next word')
    } else {
        $('.container').addClass('waiting-for-next-word');
        console.log('wait')
    }

    room.text.forEach(addStoryEntry);

    // var socket = io('chatroom-ozhi.rhcloud.com:8000'); //again. websocket namespace, not server endpoint ???
    // var socket = io('localhost:3000');
    var socket = io();

    var roomName = $('#roomName').text();
    socket.emit('room join', roomName);

    socket.on('start chat', function(obj) {
        console.log('start chat');
    })

    socket.on('chat message', function(obj) {
        // $('#chat').append("<tr> <td style='color:" + obj.color + ";'><b>" + obj.nickname + "</b> </td><td>" + obj.msg + "</td></tr>");
        // $('#chatWrap').scrollTop($('#chatWrap')[0].scrollHeight);

        addStoryEntry(obj);

        $('.container').removeClass('waiting-for-start-input');

        if (obj.nickname == getNickname()) {
            console.log('this message came from me');
            $('.container').addClass('waiting-for-next-word');
        } else {
            $('.container').addClass('waiting-for-input');
            $('.container').removeClass('waiting-for-next-word');
            showNextWords(obj.nextWords);
        }
    });

    socket.on('system message', function(obj) {
        if(obj.type == 'join')
            $('#chat').append("<tr> <td style='color:" + obj.color + ";'><b>" + obj.nickname + "</b> </td><td class='alert alert-success'> joined </td></tr>");
        if(obj.type == 'leave')
            $('#chat').append("<tr> <td style='color:" + obj.color + ";'><b>" + obj.nickname + "</b> </td><td class='alert alert-danger'> left </td></tr>");

        $('#chatWrap').scrollTop($('#chatWrap')[0].scrollHeight);
    });

    socket.on('room leave', function(nickname) {
        if(nickname == getNickname()) {
            window.location.href = "/rooms";
        }
    });

    socket.on('add member', function(user) {
        $("#membersBox [id='" + user.nickname + "']").remove();
        $('#membersBox').append("<span id='" + user.nickname + "' class='roomMember' style='color:" + user.color + "'> " + user.nickname + " </span>");
    });

    socket.on('remove member', function(nickname) {
        $("#membersBox [id='" + nickname + "']").remove();
    });


    $('#chatMessageForm').submit(function() {
        if($('#chatMessageField').val() && $('#chatMessageField').val().length<=300)
            socket.emit('chat message', escapeHtml($('#chatMessageField').val()));

        $('#chatMessageField').val('');
        return false;
    });

    $('#btnLeaveRoom').click(function() {
        socket.emit('room leave');
    });
});

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

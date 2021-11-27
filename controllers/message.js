var path = require('path'),
    _ = require("lodash"),
    UnauthorizedAccessError = require(path.join(__dirname, "..", "errors", "unauthAccess.js"));

var Message = require(path.join(__dirname, "..", "models", "message.js"));
var Notification = require(path.join(__dirname, "..", "models", "notification.js"));
var User = require(path.join(__dirname, "..", "models", "user.js"));

exports.send = function(req, res, next) {

    var subject = req.body.subject,
        message = req.body.message,
        email   = req.body.sender_email;

    console.log("Inside message.js : " + JSON.stringify(req.body) );

    if (_.isEmpty(subject) || _.isEmpty(message) || _.isEmpty(email)) {
      return next(new UnauthorizedAccessError("401", {
        message: 'Empty email, subject, or message'+email+subject+message
      }));
    }

    var message_details  = {
        email: email,
        subject: subject,
        message: message
    };

    if (!(_.isEmpty(req.body.recipient_id)) && !(_.isEmpty(req.body.sender_id))) {

        console.log("Sending message with /id: " + req.body.sender_id);
        message_details.recipient_id  = req.body.recipient_id;
        message_details.listing_id  = req.body.listing_id;
        message_details.sender_id  = req.body.sender_id;
        message_details.status  = req.body.status;
        var message = new Message(message_details);

        message.save(function(err) {

            if (err) { return next(err); }

            // get admin users
            User.findById(message_details.recipient_id, function(err, user) {
                if (err) { return next(err); }

                var notification = new Notification({
                    user_id: message_details.recipient_id,
                    type: 'message',
                    content: 'You received a new message from ' + email,
                    is_opened: false,
                    is_read: false
                });

                notification.save(function(err) {
                    if (err) { return next(err); }
                });
                
            });

            res.json({ message: message });

        });

    } else {

        console.log("Sending message without /id: " + req.body.sender_id);

        var message = new Message(message_details);

        message.save(function(err) {
            if (err) { return next(err); }

            // get admin users
            User.find({ userType: 'admin' }, function(err, admins) {
                if (err) { return next(err); }
                admins.forEach(function(user) {
                    var notification = new Notification({
                        user_id: user._id,
                        type: 'message',
                        content: 'You received a new message from ' + email,
                        is_opened: false,
                        is_read: false
                    });

                    notification.save(function(err) {
                        if (err) { return next(err); }
                    });

                });
            });

            res.json({ message: message });
        });

    }
}

exports.update = function(req, res, next) {

    var subject = req.body.subject,
        message = req.body.message,
        email   = req.body.sender_email;

    console.log("Inside message.js : " + JSON.stringify(req.body) );

    if (_.isEmpty(subject) || _.isEmpty(message) || _.isEmpty(email)) {
      return next(new UnauthorizedAccessError("401", {
        message: 'Empty email, subject, or message'+email+subject+message
      }));
    }

    var message_details  = {
        email: email,
        subject: subject,
        message: message
    };

    if (!(_.isEmpty(req.body.recipient_id)) && !(_.isEmpty(req.body.sender_id))) {

        console.log("Sending message with /id: " + req.body.sender_id);
        message_details.recipient_id  = req.body.recipient_id;
        message_details.listing_id  = req.body.listing_id;
        message_details.sender_id  = req.body.sender_id;
        message_details.status  = req.body.status;
        message_details.message_id  = req.body.message_id;

        var message = new Message(message_details);

        Message.findOneAndUpdate({'_id': message_details.message_id}, {$set: {
            'subject': message_details.subject,
            'message': message_details.message,
            'status': 'sent' 
            }},
            function (err, doc) {
                return err;
            });

       /* message.save(function(err) {

            if (err) { return next(err); }

            // get admin users
            Message.findById(message_details.message_id, function(err, user) {
                if (err) { return next(err); }

                var notification = new Notification({
                    user_id: message_details.recipient_id,
                    type: 'message',
                    content: 'You received a new message from ' + email,
                    is_opened: false,
                    is_read: false
                });

                notification.save(function(err) {
                    if (err) { return next(err); }
                });
                
            });

            res.json({ message: message });

        });*/

    } else {

        /*console.log("Sending message without /id: " + req.body.sender_id);

        var message = new Message(message_details);

        message.save(function(err) {
            if (err) { return next(err); }

            // get admin users
            User.find({ userType: 'admin' }, function(err, admins) {
                if (err) { return next(err); }
                admins.forEach(function(user) {
                    var notification = new Notification({
                        user_id: user._id,
                        type: 'message',
                        content: 'You received a new message from ' + email,
                        is_opened: false,
                        is_read: false
                    });

                    notification.save(function(err) {
                        if (err) { return next(err); }
                    });

                });
            });

            res.json({ message: message });
        });*/

    }
}
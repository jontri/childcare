"use strict";

var debug = require('debug')('app:routes:services' + process.pid),
    _ = require("lodash"),
    util = require('util'),
    path = require('path'),
    bcrypt = require('bcryptjs'),
    UnauthorizedAccessError = require(path.join(__dirname, "..", "errors", "unauthAccess.js")),
    SystemExceptionError = require(path.join(__dirname, "..", "errors", "systemException.js")),
    jwt = require("jwt-simple"),
    jfs = require('jsonfile'),
    fs = require('fs'),
    mustache = require('mustache'),
    winston = require('winston'),
    utils = require("../utils.js"),
    passportService = require('./passport'),
    config = require(path.join(__dirname, "..", "config.json")),
    passport = require('passport'),
    mongoose = require('mongoose'),
    nodemailer = require('nodemailer'),
    transporter = nodemailer.createTransport('smtps://ratingsville%40gmail.com:R4tingsvill3@smtp.gmail.com', {debug: true}),
    extend = require('extend'),
    request = require('request'),
    async = require('async'),
    moment = require('moment');
//var stripe = require('stripe')(config.stripe.test_api_key);

var multiparty = require('connect-multiparty'),
    pathToUploads =  path.join(__dirname, "../web/assets/uploads"),
    multipartyMiddleware = multiparty({
        uploadDir: pathToUploads
    });

// Mongo Objects
var User = require(path.join(__dirname, "..", "models", "user.js")),
    Listing = require(path.join(__dirname, "..", "models", "listing.js")),
    PasswordReset = require(path.join(__dirname, "..", "models", "password_reset.js")),
    LoginAttempt = require(path.join(__dirname, "..", "models", "login_attempt.js")),
    Review = require(path.join(__dirname, "..", "models", "review.js")),
    ReviewVote = require(path.join(__dirname, "..", "models", "review_vote.js")),
    AuditLog = require(path.join(__dirname, "..", "models", "audit_log.js")),
    OwnerRequest = require(path.join(__dirname, "..", "models", "owner_request.js")),
    Searches = require(path.join(__dirname, "..", "models", "searches.js")),
    UserMessage = require(path.join(__dirname, "..", "models", "message.js")),
    Appointment = require(path.join(__dirname, "..", "models", "appointment.js")),
    Articles = require(path.join(__dirname, "..", "models", "articles.js")),
    Feedback = require(path.join(__dirname, "..", "models", "feedback.js")),
    Session = require(path.join(__dirname, "..", "models", "session.js")),
    Client = require(path.join(__dirname, "..", "models", "client.js")),
    Student = require(path.join(__dirname, "..", "models", "student.js")),
    Guardian = require(path.join(__dirname, "..", "models", "guardian.js")),
    Staff = require(path.join(__dirname, "..", "models", "staff.js")),
    Class = require(path.join(__dirname, "..", "models", "class.js")),
    Accreditation = require(path.join(__dirname, "..", "models", "accreditation.js")),
    Curriculum = require(path.join(__dirname, "..", "models", "curriculum.js")),
    Document = require(path.join(__dirname, "..", "models", "document.js")),
    Broadcast = require(path.join(__dirname, "..", "models", "broadcast.js")),
    DocumentHst = require(path.join(__dirname, "..", "models", "document_hst.js")),
    Invite = require(path.join(__dirname, "..", "models", "invite.js"));

var pdfGenerator = require(path.join(__dirname, "..", "controllers", "html2pdf.js"));
var Message = require(path.join(__dirname, "..", "controllers", "message.js"));
var ListingController = require(path.join(__dirname, "..", "controllers", "listing.js"));
var AuthenticationController = require(path.join(__dirname, "..", "controllers", "authentication.js"));
var SessionControl = require(path.join(__dirname, "..", "controllers", "sessionControl.js"));


var HOST_SERVER = 'https://www.ratingsville.com';

// var accountSid = 'AC4bd99fa5bb9d257137ce3a9ab9422d98'; // test twilio account
// var authToken = '19ef473993ea6f11ac0997e53a674545'; // test twilio account

var accountSid = 'AC419e3d1566c04df57da18db84b568dba'; // live twilio account
var authToken = '4975f940793201adeddd156ac4a30818'; // live twilio account


var tropoSmsToken = '4e617641736c51516e576573576e506e47414e4b7948555155505a4f695464714d535a746e6d7557464e6372';

// TWILIO

//var twilio = require('twilio');
//var client = new twilio.RestClient(accountSid, authToken);

var Router = require("express").Router;

var rootDir = path.join(path.dirname(fs.realpathSync(__filename)), '..');
var pdfRootDir = path.join(__dirname, "..", "documents", "pdf");

var basedir = "baseline";
var simfile;
var defaultfile;

var logger = new (winston.Logger)({
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: '/tmp/services.log'
        })
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: '/tmp/services-exceptions.log'
        })
    ]
});

// CONSTANT
var searchSaveLimit = 10;

var signup = function (req, res, next) {
    var username = req.body.username;
    var password = req.body.password;
    var email = req.body.email;

    if (!username || !password || !email) {
        return res.status(422).send({
            error: 'You must provide an username, email and password'
        });
    }

    process.nextTick(function () {
        // check if user with the given email exists
        User.findOne({
            username: username
        }, function (err, existingUser) {
            if (err) {
                return next(err);
            }

            // if  a user with email does exist, return an error
            if (existingUser) {
                // 422 unprocessable entity
                return res.status(422).send({
                    error: 'Username is in use'
                });
            }

            // if not exist, create and save user record
            var user = new User({
                username: username,
                password: password,
                email: email
            });

            user.save(function (err) {
                if (err) {
                    return next(err);
                }

                debug("User saved, generating token");
                sendWelcomeEmail(user);

                res.token = tokenForUser(user);
                next();
            });

        });
    });
}; 

function sendWelcomeEmail(user) {
    // create template based sender function
    var sendWelcomeEmail = transporter.templateSender({
        subject: 'Welcome to Ratingsville',
        text: 'Hello {{username}}, Please use the credentials below upon logging in to Ratingsville.',
        html: '<p>Hello <strong>{{username}}</strong>,  Please use the credentials below upon logging in to Ratingsville.</p>'
    }, {
        from: 'Ratingsville <ratingsville@gmail.com>',
    });

    // use template based sender to send a message
    sendWelcomeEmail({
        to: user.email
    }, {
        username: user.username
    }, function (err, info) {
        if (err) {
            logger.info('Error');
        } else {
            logger.info('Welcome email sent');
        }
    });
}

var sendRevApprovalEmail = function (req, res, next) {
    var receiver = req.body.user;
    var daycare = req.body.daycare;
    var review = req.body.review;
    var msgType = req.body.msgType;

    // console.log("### SENDING EMAIL ### TO:" + JSON.stringify(receiver)+" DAYCARE:"+JSON.stringify(daycare)+" REVIEW:"+JSON.stringify(review)+" MSGTYPE:"+msgType);
    
    var myEmail = "ratingsville@gmail.com";

    var linebreak = "\n\n";

    var rejection_1 = "we have not been able to sufficiently verify that either your child attends "+ daycare.name +
    " or that you interacted with the administration and/or staff at "+daycare.name+
    " in an effort to vet it for your child.  If your child attends "+daycare.name+
    ", please email us documentation showing the last two payments from you to "+daycare.name+" at " + myEmail + 
    "  If your review is based on a one-time interation with "+daycare.name+
    ", please provide details on the date and approximate time of your visit as well as the individuals you met with by emailing us at "+myEmail + linebreak +
     "We thank you for your time and effort in submitting a review.";
    var rejection_2 = "your review has been deemed to contain derogatory, offensive or foul language.  You have the option to edit your review by logging in and going to the My Reviews section on your dashboard. "+linebreak+
    " Your review can then be found under Pending Reviews.  Upon submitting your edited review, our team will reconsider and publish it if deemed appropriate. "+linebreak+
    "Given the high volume of reviews we vet, this process could take up to 14 business days.  We thank you for your patience and taking the time to submit your feedback on "+daycare.name+".  We appreciate your input tremendously and have no doubt that other customers do the same." ;

    var reason=[rejection_1,rejection_2];
    var subj = "Review on Ratingsville.com for "+daycare.name+" not approved";
    var body = "Dear " + receiver.firstName + "," + linebreak +
    "On behalf of the Ratingsville team, we regret to inform you that we are unable to publish your review on "+daycare.name+
    " dated "+ new Date(review.dateSaved).toLocaleString() + " because " + reason[msgType] + linebreak+
    "Thank you. "+linebreak+linebreak+"Regards,"+linebreak+
    "The Ratingsville Reviews Team";
    // create template based sender function
    var sendRevApprovalEmail = transporter.templateSender({
        subject: subj,
        text: body,
    }, {
        from: 'Ratingsville <ratingsville@gmail.com>',
    });

    // use template based sender to send a message
    sendRevApprovalEmail({
        to: receiver.email
    }, {
        username: receiver.username
    }, function (err, info) {
        if (err) {
            logger.info('Error');
        } else {
            logger.info('Review Approval Email Sent');
            var msg = {subject:subj,body:body};
            res.send({msg:msg});
        }
    });
}

function sendOwnershipApprovalEmail(ownerId,listingId, isApproved) {
    logger.info("### sendOwnershipApprovalEmail ###");

    User.find({_id:ownerId},{},{}).exec(function(err,res){
        if(!err && res){
            Listing.find({_id:listingId},{},{}).exec(function(_err,_res){
                if(!_err && _res){

                    var receiver = res[0];
                    var daycare = _res[0];
                    send(receiver,daycare);

                }else{
                    logger.info("sendOwnershipApprovalEmailFailedToLoadListing");
                }

            });
        }else{
            logger.info("sendOwnershipApprovalEmailFailedToLoadUser");
        }  
    });

    function send(receiver,daycare){
        //console.log("### SENDING EMAIL ### TO:" + receiver.firstName+" "+receiver.lastName +" DAYCARE:"+daycare.name);
    
        var myEmail = "ratingsville@gmail.com";

        var linebreak = "\n\n";

        var subj = "Ownership Request Notification for "+daycare.name;

        // TODO: Create message content for approve and reject
        var approve = " we are pleased to inform you that your request for ownership of "+daycare.name+" has been approved.";

        var reject = " we regret to inform you that your request for ownership of "+daycare.name+" has been rejected.";

        // TODO: Create a template body/message header
        var body = "Dear "+receiver.firstName+","+linebreak+
        "On behalf of the Ratingsville team, ";

        var footer = "The Ratingsville Team";

        if(isApproved=="approved"){
            body+=approve;
        }else{
            body+=reject;
        }

        body+= (linebreak + linebreak + footer);

        // create template based sender function
        var sendOwnershipApprovalEmail = transporter.templateSender({
            subject: subj,
            text: body,
        }, {
            from: 'Ratingsville <ratingsville@gmail.com>',
        });

        sendOwnershipApprovalEmail({
            to: receiver.email
        }, {
            username: receiver.username
        }, function (err, info) {
            if (err) {
                logger.info('Ownership Approval Error');
            } else {
                logger.info('Ownership Approval Email Sent');
            }
        });
    }
}

function sendReviewUnavailable(user, listing) {
    var mailOptions = {
        from: 'Ratingsville <ratingsville@gmail.com>',
        to: user.email,
        subject: 'Ratingsville | Review for '+listing.name+' Unavailable'
    };

    transporter.sendMail(mailOptions, function (error, response) {
        if (error) {
            console.log(error);
        } else {
            console.log("Review unavailable email sent: " + JSON.stringify(response));
        }
        transporter.close(); // shut down the connection pool, no more messages
    });
}

function sendConfirmationLink(user, type) {

    // initialize email template library
    var EmailTemplate = require('email-templates').EmailTemplate;

    // initialize the root template directory
    var emailTemplatesDir = path.resolve(__dirname, '..', 'emails', 'confirmation');

    // initialize the actual email template
    var forgotUserEmail = new EmailTemplate(emailTemplatesDir);

    var jsonData = {
        name: user.firstName,
        conf_link: HOST_SERVER + '/#/register/confirmation?token=' + user._id + '&email=' + encodeURIComponent(user.email),
        type: type
    };

    forgotUserEmail.render(jsonData, function (err, results) {

        var mailOptions = {
            from: 'Ratingsville <ratingsville@gmail.com>',
            to: user.email,
            subject: 'Ratingsville | ' + ((type===utils.EMAIL_CONFIRMATION_TYPES.RESEND) ? 'Resending Email Verification Link' : ((type===utils.EMAIL_CONFIRMATION_TYPES.REGISTER) ? 'Link to Activate Account' : 'Email Verification Link')),
            html: results.html,
            text: results.text
        }

        transporter.sendMail(mailOptions, function (error, response) {
            if (error) {
                console.log(error);
            } else {
                console.log("Welcome email sent: " + JSON.stringify(response));
            }
            transporter.close(); // shut down the connection pool, no more messages
        });
    });
}

function sendAppointmentEmail(user, schedule, daycareName, daycareId, appointmentId, status) {

    // initialize email template library
    var EmailTemplate = require('email-templates').EmailTemplate;

    // initialize the root template directory
    var emailTemplatesDir = path.resolve(__dirname, '..', 'emails', 'appointment');

    // initialize the actual email template
    var appointmentEmail = new EmailTemplate(emailTemplatesDir);

    var jsonData = {
        name: user.firstName,
        email: user.email,
        schedule: schedule,
        daycareName: daycareName,
        daycareId: daycareId,
        appointmentId: appointmentId,
        status: status,
        uid: new Date().valueOf()
    };

    var title = 'cancelled';
    if(status === 'pending')
    {
        title = 'requested';
    }
    else if(status === 'approved')
    {
        title = 'confirmed';
    }

    logger.info("Rendering data");

    appointmentEmail.render(jsonData, function (err, results) {

        var mailOptions = {
            from: 'Ratingsville <ratingsville@gmail.com>',
            to: user.email,
            bcc: 'system@ratingsville.com',
            subject: 'Ratingsville | Appointment with '+ daycareName + ' ' + title,
            html: results.html,
            text: results.text
        }

        transporter.sendMail(mailOptions, function (error, response) {
            if (error) {
                console.log(error);
            } else {
                console.log("Appointment email sent: " + JSON.stringify(response));
            }
            transporter.close(); // shut down the connection pool, no more messages
        });
    });

    logger.info("Rendered Appointment email data");
}

function notifyAdmin(subj,text) {
    // create template based sender function
    var sendEmailToAdmin = transporter.templateSender({
        subject: subj,
        text: text,
    }, {
        from: 'Ratingsville <ratingsville@gmail.com>',
    });

    // use template based sender to send a message
    sendEmailToAdmin({
        to: 'admin@ratingsville.com'
    }, {},
    function (err, info) {
        if (err) {
            logger.info('Error');
        } else {
            logger.info('admin@ratingsville.com Notified!');
        }
    });
}

function notifyUserFeedback(name, email) {

    var jsonData = {
        "register_link" : HOST_SERVER + '/#/register',
        "name": name
    }

    // initialize email template library
    var EmailTemplate = require('email-templates').EmailTemplate;

    // initialize the root template directory
    var emailTemplatesDir = path.resolve(__dirname, '..', 'emails', 'feedback');

    // initialize the actual email template
    var feedbackEmail = new EmailTemplate(emailTemplatesDir);

    feedbackEmail.render(jsonData, function (err, results) {
        var mailOptions = {
            from: 'Ratingsville <ratingsville@gmail.com>',
            to: email,
            subject: 'Thank you for your recent feedback',
            html: results.html,
            text: results.text
        };

        transporter.sendMail(mailOptions, function (error, response) {
            if (error) {
                console.log(error);
            } else {
                console.log("Feedback email sent: " + JSON.stringify(response));
            }
            transporter.close(); // shut down the connection pool, no more messages
        });
    });
}

function notifySender(emailData) {
    // initialize email template library
    var EmailTemplate = require('email-templates').EmailTemplate;

    // initialize the root template directory
    var emailTemplatesDir = path.resolve(__dirname, '..', 'emails', 'contact-us-sent');

    // initialize the actual email template
    var contactUsEmail = new EmailTemplate(emailTemplatesDir);

    contactUsEmail.render(emailData, function (err, results) {
        var mailOptions = {
            from: 'Ratingsville <ratingsville@gmail.com>',
            to: emailData.sender_email,
            subject: 'Message to Ratingsville Customer Service Team successfully submitted',
            html: results.html,
            text: results.text
        };

        transporter.sendMail(mailOptions, function (error, response) {
            if (error) {
                console.log(error);
            } else {
                console.log("Sender's copy of contact us email sent: " + JSON.stringify(response));
            }
            transporter.close(); // shut down the connection pool, no more messages
        });
    });
}

function sendChildCareCopy(emailData) {
    // initialize email template library
    var EmailTemplate = require('email-templates').EmailTemplate;

    // initialize the root template directory
    var emailTemplatesDir = path.resolve(__dirname, '..', 'emails', 'owner-copy-child-contact-center');

    // initialize the actual email template
    var childCareCopyEmail = new EmailTemplate(emailTemplatesDir);

    childCareCopyEmail.render(emailData, function (err, results) {
        var mailOptions = {
            from: 'Ratingsville <ratingsville@gmail.com>',
            to: emailData.sender_email,
            subject: 'This Is A Copy Of The Message User Sent To ' + emailData.child_care_name,
            html: results.html,
            text: results.text
        };

        transporter.sendMail(mailOptions, function (error, response) {
            if (error) {
                console.log(error);
            } else {
                console.log("Sender's copy of contact us email sent: " + JSON.stringify(response));
            }
            transporter.close(); // shut down the connection pool, no more messages
        });
    });
}

function notifyInvite(emailData) {
    console.log("Sending invite email: " + JSON.stringify(emailData))

    var jsonData = {
        "first_name":  emailData.first_name,
        "last_name":  emailData.last_name,
        "email": emailData.email,
        "message": emailData.message,
        "date": moment(emailData.date).format('dddd, MMMM D, YYYY').toString()
    }
    // initialize email template library
    var EmailTemplate = require('email-templates').EmailTemplate;

    // initialize the root template directory
    var emailTemplatesDir = path.resolve(__dirname, '..', 'emails', 'invite');

    // initialize the actual email template
    var inviteEmail = new EmailTemplate(emailTemplatesDir);

    inviteEmail.render(jsonData, function (err, results) {
        var mailOptions = {
            from: 'Ratingsville <ratingsville@gmail.com>',
            bcc: emailData.recipient,
            subject:  `Invitation from ${emailData.first_name} ${emailData.last_name} to join Ratingsville.com`,
            html: results.html,
            text: results.text
        };

        transporter.sendMail(mailOptions, function (error, response) {
            if (error) {
                console.log(error);
            } else {
                console.log("Invitation email sent: " + JSON.stringify(response));
            }
            transporter.close(); // shut down the connection pool, no more messages
        });
    });
}

function ownershipRequestEmail(request, type) {
    // initialize email template library
    var EmailTemplate = require('email-templates').EmailTemplate;

    // initialize the root template directory
    var emailTemplatesDir = path.resolve(__dirname, '..', 'emails', 'owner-request');

    // initialize the actual email template
    var ownerReqEmail = new EmailTemplate(emailTemplatesDir);

    var dueDate = new Date(request.date_requested).getTime() + 14 * 86400000; // due date in milliseconds

    var proof_owner_status = "";
    var power_attorney_status = "";
    var id_card_status = "";


    if(request.proof_owner_doc){
        if(request.proof_owner_doc_sufficient) {
            proof_owner_status = "Sufficient";
        } else {
            proof_owner_status = "Insufficient Information";
        }
    } else {
        proof_owner_status = "Not provided";
    }

    if(request.id_doc){
        if(request.id_doc_sufficient) {
            id_card_status = "Sufficient";
        } else {
            id_card_status = "Insufficient Information";
        }
    } else {
        id_card_status = "Not provided";
    }

    if(request.power_attorney_doc){
        if(request.power_attorney_doc_sufficient) {
            power_attorney_status = "Sufficient";
        } else {
            power_attorney_status = "Insufficient Information";
        }
    } else {
        power_attorney_status = "Not provided";
    }

    var jsonData = {
        owner_request: request,
        upload_link: HOST_SERVER + '/#/ownership/'+ request._id + '/uploads?email=' + encodeURIComponent(request.owner.email) + '&listing=' + request.listing._id,
        contact_link: HOST_SERVER + '/#/contactus?email=' + encodeURIComponent(request.owner.email),
        due_date: new Date(dueDate).toLocaleDateString(),
        type: type,
        proof_owner_status: proof_owner_status,
        power_attorney_status: power_attorney_status,
        id_card_status: id_card_status

    };

    ownerReqEmail.render(jsonData, function (err, results) {
        var subjectTxt = 'Ratingsville | ';
        switch (type) {
            case 'received':
                subjectTxt += 'Ownership Request for '+request.listing.name+' Received';
                break;
            case 'canceled':
                subjectTxt += 'Ownership Cancellation Request for '+request.listing.name+' Received';
                break;
            case 'declined':
                subjectTxt += 'Ownership Request for '+request.listing.name+' Declined';
                break;
            case 'approved':
                subjectTxt += 'Ownership Request for '+request.listing.name+' Approved';
                break;
            default:
                subjectTxt += 'Reminder to Upload Documents for '+request.listing.name;
                break;
        }

        var mailOptions = {
            from: 'Ratingsville <ratingsville@gmail.com>',
            to: request.owner.email,
            subject: subjectTxt,
            html: results.html,
            text: results.text
        };

        transporter.sendMail(mailOptions, function (error, response) {
            if (error) {
                console.log(error);
            } else {
                console.log("Ownership request email sent: " + JSON.stringify(response));
            }
            transporter.close(); // shut down the connection pool, no more messages
        });
    });
}


function flaggedReviewEmail(request) {

    // initialize email template library
    var EmailTemplate = require('email-templates').EmailTemplate;

    // initialize the root template directory
    var emailTemplatesDir = path.resolve(__dirname, '..', 'emails', 'flagged-review');

    // initialize the actual email template
    var flaggedReviewEmail = new EmailTemplate(emailTemplatesDir);

    var jsonData = {
        user_flagger: request.user_flagger,
        review_id: request.review_id,
        flag_date: request.flag_date
    };

    logger.info("Rendering data");

    flaggedReviewEmail.render(jsonData, function (err, results) {

        var mailOptions = {
            from: 'Ratingsville <ratingsville@gmail.com>',
            to: 'admin@ratingsville.com',
            subject: 'Ratingsville | Flagged Review for '+ jsonData.review_id ,
            html: results.html,
            text: results.text
        }

        transporter.sendMail(mailOptions, function (error, response) {
            if (error) {
                console.log(error);
            } else {
                console.log("Flagged Review email sent: " + JSON.stringify(response));
            }
            transporter.close(); // shut down the connection pool, no more messages
        });
    });

    logger.info("Rendered Flagged Review email data");
}

function flaggedReviewUserEmail(request) {

    // initialize email template library
    var EmailTemplate = require('email-templates').EmailTemplate;

    // initialize the root template directory
    var emailTemplatesDir = path.resolve(__dirname, '..', 'emails', 'flagged-review-user');

    // initialize the actual email template
    var flaggedReviewEmail = new EmailTemplate(emailTemplatesDir);

    var jsonData = {
        aliasName: request.aliasName,
        userEmail: request.userEmail,
        daycareName: request.daycareName
    };

    logger.info("Rendering data");

    flaggedReviewEmail.render(jsonData, function (err, results) {

        var mailOptions = {
            from: 'Ratingsville <ratingsville@gmail.com>',
            to: jsonData.userEmail,
            subject: 'Ratingsville | Review for ' + jsonData.daycareName + ' flagged',
            html: results.html,
            text: results.text,
            aliasName: jsonData.aliasName,
            dayCareName: jsonData.daycareName
        }

        transporter.sendMail(mailOptions, function (error, response) {
            if (error) {
                console.log(error);
            } else {
                console.log("Flagged Review email sent: " + JSON.stringify(response));
            }
            transporter.close(); // shut down the connection pool, no more messages
        });
    });

    logger.info("Rendered Flagged Review email data");
}

function unFlaggedReviewUserEmail(request) {

    // initialize email template library
    var EmailTemplate = require('email-templates').EmailTemplate;

    // initialize the root template directory
    var emailTemplatesDir = path.resolve(__dirname, '..', 'emails', 'unflagged-review-user');

    // initialize the actual email template
    var flaggedReviewEmail = new EmailTemplate(emailTemplatesDir);

    var jsonData = {
        aliasName: request.aliasName,
        userEmail: request.userEmail,
        daycareName: request.daycareName
    };

    logger.info("Rendering data");

    flaggedReviewEmail.render(jsonData, function (err, results) {

        var mailOptions = {
            from: 'Ratingsville <ratingsville@gmail.com>',
            to: jsonData.userEmail,
            subject: 'Ratingsville | Review for [' + jsonData.daycareName + '] unflagged',
            html: results.html,
            text: results.text,
            aliasName: jsonData.aliasName,
            dayCareName: jsonData.daycareName
        }

        transporter.sendMail(mailOptions, function (error, response) {
            if (error) {
                console.log(error);
            } else {
                console.log("unFlagged Review email sent: " + JSON.stringify(response));
            }
            transporter.close(); // shut down the connection pool, no more messages
        });
    });

    logger.info("Rendered unFlagged Review email data");


}

function tokenForUser(user) {
    // sub is a jwt property for subject (i.e subject is this user)
    // iat is issued at time
    var timestamp = new Date().getTime();
    return jwt.encode({
        sub: user.id,
        iat: timestamp
    }, config.secretKey);
}

function generateCode() {
    var characters = "1234567890";
    var code = "";

    for (var i = 0; i < 4; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return code;
}

function sendSmsVerification(mobileNumber, code) {
    console.log('sendSmsVerification: ', mobileNumber + ' ' + code);

    // The message you want to send.
    var msg = 'Your Ratingsville verification code: ' + code;

    mobileNumber = '+1' + mobileNumber;    

    var twilioSmspath = 'https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/Messages.json';
    console.log('twilioSmspath:' + twilioSmspath);

    // SOURCE: https://www.twilio.com/docs/glossary/what-e164
    var postData = { 'To': mobileNumber, // user's mobile number in E.164 format
                     'From': '+14073260550', //
                     'Body': msg };
    
    var headers = {
        'Content-Type': 'application/json'
    };
    request({ auth: {
                    user: accountSid,
                    password: authToken,
                    sendImmediately: true
            },        
            method:'POST',
            url: twilioSmspath, 
            form: postData, 
            headers: headers,
            json: true,
        }, function (error, response, body) {  
            if (!error) {
                console.log('response', response);
                console.log('Successful: %j', body);
            } else {
                console.log('Failed Sms: ', error);
            } 
    }); 

    /*var tropoSmspath = 'https://api.tropo.com/1.0/sessions?action=create&token=' + tropoSmsToken + '&msg=' + msg + '&number=' + mobileNumber;

    console.log("Tropo Request: " + tropoSmspath);

    request({
        uri: tropoSmspath,
        method: "GET",
        timeout: 10000,
        followRedirect: true,
        maxRedirects: 10
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("Successful: " + body)
        } else {
            console.log("Failed Sms");
        }
    });*/
}


// function getLatLng(fullAddress) {
//
//     var googleMapUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + fullAddress;
//
//     request({
//         uri: googleMapUrl,
//         method: "GET",
//         timeout: 10000,
//         followRedirect: true,
//         maxRedirects: 3
//     }, function (error, response, body) {
//         if (!error && response.statusCode == 200) {
//             console.log("Successful getLatLng " )
//             return body;
//         } else {
//             console.log("Failed getLatLng");
//         }
//     });
//
//
//
// }

var requireAuth = function (req, res, next) {
    passport.authenticate('jwt', {
        session: false
    }, function (err, user) {
        if (err) {
            return next(err);
        }
        if (user) {
            next();
        } else {
            return next(new UnauthorizedAccessError("401", {
                message: 'Unauthorized'
            }));
        }
    })(req, res, next);
}

var requireUserType = function (userType) {

    return function(req, res, next) {
        console.log("cookieSessionID "+req.cookies['connect.sid']);
        console.log("sessionID "+req.sessionID);

        /*if(req.session.user && req.session.user.role === role)
            next();
        else
            res.send(403);*/

        if(req.sessionID){
            console.log("REQ: req.method,req.path ");
            console.log(req.method + " , " + req.path);

            getSession(req, res, next, userType, req.sessionID);

            // function getSession(sid, prevSid) {
            //     SessionControl.getSessionType(sid,
            //     function(sessionType){
            //         console.log("sessionType: "+sessionType);
            //         console.log("userType: "+userType);
            //         console.log("userType_isArray: "+Array.isArray(userType));
            //
            //         var bool = false;
            //
            //         if(typeof(sessionType)!='undefined'){
            //
            //             var isAdmin = (sessionType=="admin");
            //             var isUser = (sessionType=="user");
            //             var isVisitor = (sessionType==null);
            //
            //             if(sessionType==null && SessionControl.isPathPublic(req.method,req.path)){
            //                 next();
            //                 return;
            //             }
            //
            //             if(Array.isArray(userType)){
            //                 for (var i = userType.length - 1; i >= 0; i--) {
            //                     console.log("userType[i] == sessionType : " + userType[i] +"=="+ sessionType);
            //                     if(userType[i] == sessionType){
            //                         bool = true;
            //                         break;
            //                     }
            //                 }
            //             }else{
            //                 bool = (userType == sessionType);
            //             }
            //             console.log("userType==sessionType : "+bool);
            //             if(bool){
            //                 next();
            //                 if (prevSid) {
            //                     Session.update({sessionId: sid}, {sessionId: prevSid}).exec();
            //                 }
            //             }else if(!prevSid){
            //                 getSession(getCookieSid(), sid);
            //             }else{
            //                 res.status(401).end();
            //                 return;
            //             }
            //
            //         }else if (!prevSid){
            //             getSession(getCookieSid(), sid);
            //         } else {
            //             res.status(401).end();
            //             return;
            //         }
            //     });
            // }
            //
            // function getCookieSid() {
            //     var cookieSid;
            //     if (cookieSid = req.cookies['connect.sid']) {
            //         var start = cookieSid.search(/\:/);
            //         var end = cookieSid.search(/\./);
            //         if (start != -1 && end != -1 && start < end) {
            //             cookieSid = cookieSid.substring(start+1, end);
            //         }
            //     }
            //     return cookieSid;
            // }

        }else{
            console.log("NoSession")
            res.status(401).end(); // respond: Forbidden
            return;
        }
    }

}

function getSession(req, res, next, userType, sid, prevSid) {
    SessionControl.getSessionType(sid,
        function(sessionType){
            console.log("sessionType: "+sessionType);
            console.log("userType: "+userType);
            console.log("userType_isArray: "+Array.isArray(userType));

            var bool = false;

            if(typeof(sessionType)!='undefined'){

                var isAdmin = (sessionType=="admin");
                var isUser = (sessionType=="user");
                var isVisitor = (sessionType==null);

                if(sessionType==null && SessionControl.isPathPublic(req.method,req.path)){
                    next();
                    return;
                }

                if(Array.isArray(userType)){
                    for (var i = userType.length - 1; i >= 0; i--) {
                        console.log("userType[i] == sessionType : " + userType[i] +"=="+ sessionType);
                        if(userType[i] == sessionType){
                            bool = true;
                            break;
                        }
                    }
                }else{
                    bool = (userType == sessionType);
                }
                console.log("userType==sessionType : "+bool);
                if(bool){
                    next();
                    if (prevSid) {
                        Session.update({sessionId: sid}, {sessionId: prevSid}).exec();
                    }
                }else if(!prevSid){
                    getSession(req, res, next, userType, getCookieSid(req), sid);
                }else{
                    res.status(401).end();
                    return;
                }

            }else if (!prevSid){
                getSession(req, res, next, userType, getCookieSid(req), sid);
            } else {
                res.status(401).end();
                return;
            }
        });
}

function getCookieSid(req) {
    var cookieSid;
    if (cookieSid = req.cookies['connect.sid']) {
        var start = cookieSid.search(/\:/);
        var end = cookieSid.search(/\./);
        if (start != -1 && end != -1 && start < end) {
            cookieSid = cookieSid.substring(start+1, end);
        }
    }
    return cookieSid;
}

function reminder(day, request) {
    var unset = {};
    unset[day] = '';
    OwnerRequest.findById(request._id).populate('owner listing').exec(function(err, ownerReq) {
        if (!err && ownerReq) {
            ownerReq.update({$unset: unset}).exec();
            if (ownerReq.status !== 'approved') {
                ownershipRequestEmail(ownerReq, (day==='day14'?'declined':'remind'));
                if (day === 'day14') {
                    deleteOwnerReqFiles(ownerReq);
                    ownerReq.remove();
                }
            }
        }
    });
    delete global[request._id+'_'+day];
}

function startReminders(request, timers) {
    logger.info('START REMINDER for '+request._id);
    var currTime = new Date().getTime();
    timers = (timers ? timers: {
        day7: currTime+420000, // 7 minutes
        day12: currTime+720000, // 12 minutes
        day13: currTime+780000, // 13 minutes
        day14: currTime+840000 // 14 minutes
    });
    Object.keys(timers).forEach(function(val) {
        if (!global[request._id+'_'+val] && timers[val]) {
            global[request._id+'_'+val] = setTimeout(reminder, timers[val]-currTime, val, request);
        }
    });
    return timers;
}

function startReminder(request, timer, day) {
    var currTime = new Date().getTime();
    if (timer) {
        if (timer < currTime) {
            var unset = {};
            unset[day] = '';
            request.update({$unset: unset}).exec();
        }
        if (!global[request._id+'_'+day]) {
            global[request._id+'_'+day] = setTimeout(reminder, timer-currTime, day, request);
        }
    }
}

function stopReminders(request, dontUpdate) {
    logger.info('STOPPING REMINDERS for '+request._id);
    var days = ['day7', 'day12', 'day13', 'day14'];
    days.forEach(function(val) {
        if (!dontUpdate) {
            var unset = {};
            unset[val] = '';
            request.update({$unset: unset}).exec();
        }
        clearTimeout(global[request._id+'_'+val]);
        delete global[request._id+'_'+val];
    });
}

function deleteOwnerReqFiles(request) {
    var docs = ['id_doc', 'proof_owner_doc', 'power_attorney_doc'];
    docs.forEach(function(val) {
        if (request[val]) {
            fs.unlink(path.join(pathToUploads, request[val]));
        }
    });
}

function eachReminderDay(func) {
    var days = ['day7', 'day12', 'day13', 'day14'];
    days.forEach(function(day) {
        func(day);
    });
}

// Restart reminders when server boots
setImmediate(function() {
    eachReminderDay(function(day) {
        var query = {};
        query[day] = {$exists: true};
        OwnerRequest.find(query)
            .populate('owner listing')
            .exec(function(err, requests) {
                if (!err) {
                    requests.forEach(function(req) {
                        if (!req.id_doc || !req.proof_owner_doc || (!req.proof_owner && !req.power_attorney_doc)) {
                            startReminder(req, req[day], day);
                        }
                    });
                }
            });
    });
});

module.exports = function () {

    var router = new Router();

    router.use(function (req, res, next) {
        // stop IE from caching api calls
        res.header('Cache-Control', 'no-cache');
        next();
    });

    router.route("/verify").get(requireAuth, function (req, res, next) {
        res.send({
            hi: 'there'
        });
    });

    router.route("/logout").get(function (req, res, next) {
        if (utils.expire(req.headers)) {
            
            delete req.user;
            return res.status(200).json({
                "message": "User has been successfully logged out"
            });
        } else {
            return next(new UnauthorizedAccessError("401"));
        }
    });

    /*router.route("/logout").get(function (req, res, next) {
        if (utils.expire(req.headers)) {
            delete req.user;
            return res.status(200).json({
                "message": "User has been successfully logged out"
            });
        } else {
            return next(new UnauthorizedAccessError("401"));
        }
    });*/

    router.route("/login").post(AuthenticationController.authenticate, function (req, res, next) {
        

        if (req.user.status === 'pending') {
            sendConfirmationLink(req.user, utils.EMAIL_CONFIRMATION_TYPES.RESEND);
        }
        return res.status(200).json(req.user);
    });

    router.route("/signup").post(signup, function (req, res, next) {
        res.json({
            token: res.token
        });
    });

    router.route("/check-email").get(function(req, res, next) {
        User.count({ email: req.query.email }, function(err, count) {
            if (err) return next(err);
            logger.info("Email: "+req.query.email+" | count: "+count);
            res.send(count != 0);
        });
    });

    router.route("/sendRevApprovalEmail").post(sendRevApprovalEmail);

    //router.unless = require("express-unless");

    // middleware to use for all requests
    router.use(function (req, res, next) {
        // do logging

        if (req.cookies.simulator !== null && req.cookies.simulator !== undefined) {
            basedir = req.cookies.simulator;
        }

        defaultfile = "baseline" + req.url + ".json";
        simfile = basedir + req.url + ".json";

        next(); // make sure we go to the next routes and don't stop here
    });

    router.route("/listing").post(multipartyMiddleware, function (req, res, next) {
        logger.info("Calling POST listing " + req.body);

        var listing = new Listing(req.body);

        console.log(listing);

        if (req.body._id) {
            console.log("Updating existing Listing");
            Listing.findById(listing._id, function (err, lastData) {
                if (err) {
                    return next(err);
                }
                if (lastData) {
                    console.log("THIS IS lastData");
                    console.log(lastData);
                }
            });

            Listing.findById(listing._id, function (err, existingListing) {
                if (err) {
                    return next(err);
                }
                if (existingListing) {
                    logger.info(util.inspect(req.files));
                    if (req.files.logo) {
                        listing.logo = utils.processReqFile(req.files.logo, listing._id+'logo');
                    }
                    var lastListedName = existingListing.name;
                    console.log(lastListedName);
                    // convert to mutable object
                    listing = listing.toObject();
                    // validate coordinates
                    if (listing.location && (!listing.location.coordinates || !listing.location.coordinates.length)) {
                        delete listing.location;
                    }

                    var findOneTasks = [];
                    if (listing.curriculum) {
                        listing.curriculum.forEach(function(curriculum) {
                            delete curriculum.$hashKey;
                            findOneTasks.push(function(cb) {
                                Curriculum.findOne({description: curriculum.description}, cb);
                            });
                        });
                    }
                    if (listing.accreditations) {
                        listing.accreditations.forEach(function(accreditation) {
                            delete accreditation.$hashKey;
                            findOneTasks.push(function(cb) {
                                Accreditation.findOne({name: accreditation.name}, cb);
                            });
                        });
                    }

                    if (findOneTasks.length) {
                        async.parallel(findOneTasks, function(err, findOnes) {
                            if (err) return next(err);

                            var arr = [];
                            // combine curriculums and accreditations into one array, will use for lookup in findOnes foreach
                            if (listing.curriculum) {
                                arr = arr.concat(listing.curriculum);
                            }
                            if (listing.accreditations) {
                                arr = arr.concat(listing.accreditations);
                            }

                            findOnes.forEach(function(found, index) {
                                // label as coming from ui to prevent from being captured by the script
                                if (!found) arr[index].origin = 'ui';
                            });

                            update();
                        });
                    } else {
                        update();
                    }

                    function update() {
                        Listing.update({
                            _id: listing._id
                        }, listing, {
                            upsert: true
                        }, function (err, numberAffected) {
                            if (err) {
                                return next(err);
                            }
                            res.send({
                                listing: existingListing
                            });
                        });
                    }

                        // TODO: karun wants scraper to stop modifying listing, once provider updates it
                        // Listing.findByIdAndUpdate(
                        //     listing._id,
                        //     {
                        //         $push: {"history": {name: existingListing.name}}
                        //     },
                        //     {safe: true, upsert: true, new : true},
                        //     function(err, model) {
                        //         console.log(err);
                        //     }
                        // );
                }
            });
        } else {
            console.log("Creating New Listing");
            listing.save(function (err) {
                if (err) {
                    logger.info("Failed saving listing to MongoDB");
                    res.status(500).json(err)
                } else {
                    logger.info("Successful saving listing to MongoDB");
                    res.json(listing);
                }
            });
        }
    });

    router.route("/listing").get(function (req, res, next) {
        logger.info("Calling GET listings ");

        Listing.count({}, {}, {})
            .exec(function (err, count) {
                if (!err) {
                    res.json({
                        searchResult: count
                    });
                } else {
                    return next(err);
                }
            });
    });

    router.route("/message/:id/:type").get(function (req, res, next) {

        if (req.params.type == "inbox") {
            UserMessage.find({recipient_id: req.params.id}, {}, {})
                .exec(function (err, message) {
                    if (!err) {
                        res.json({
                            searchResult: message
                        });
                    } else {
                        return next(err);
                    }
                });
        }
        if (req.params.type == "sent") {
            UserMessage.find({sender_id: req.params.id, status: "sent"}, {}, {})
                .exec(function (err, message) {
                    if (!err) {
                        res.json({
                            searchResult: message
                        });
                    } else {
                        return next(err);
                    }
                });
        }
        if (req.params.type == "draft") {
            UserMessage.find({sender_id: req.params.id, status: "draft"}, {}, {})
                .exec(function (err, message) {
                    if (!err) {
                        res.json({
                            searchResult: message
                        });
                    } else {
                        return next(err);
                    }
                });
        }

    });


    router.route("/listing/:listingId").get(function (req, res, next) {
        logger.info("Calling GET listing detail" + req.params);
        console.log(req.params);
        Listing.findOne({
            _id: req.params.listingId
        }, function (err, listing) {
            if (err) {
                return next(err);
            }
            res.send({
                listing: listing
            });
        })

    });

    router.route("/listingByEmail").post(function (req, res, next) {
        logger.info("Calling GET listing detail by Email");

        var listing = req.body;

        Listing.findOne({
            email: listing.email
        }, function (err, listing) {
            if (err) {
                return next(err);
            }
            res.send({
                listing: listing
            });
        })

    });

    router.route("/listing/approve").post(requireUserType('admin'),function (req, res, next) {

        logger.info("Approving user!");

        var listing = req.body;

        Listing.update({
            _id: listing._id
        }, {
            status: listing.status
        }, {
            upsert: true
        }, function (err, response) {
            if (err) {
                return next(err);
            }
            res.send(response);
        });

    });

    router.route("/listing/addRoleByListingId").post(function (req, res, next) {
        logger.info("Update listing, add role!");

        // var listing = req.body;

        // Listing.update({
        // _id: listing._id
        // }, {
        // status: listing.status
        // }, {
        // upsert: true
        // }, function (err, response) {
        // if (err) {
        // return next(err);
        // }
        // res.send(response);
        // });

    });

    router.route("/search").post(requireUserType(['admin','user']),function (req, res, next) {


        var params = req.body;

        logger.info("X1234 Search Request Body/Params: " + JSON.stringify(params));

        var limit = parseInt(params.limit);
        var skip = parseInt(params.skip);
        var sortBy = params.sortBy;
        var sortKey = params.sortKey;
        var sortOrder = parseInt(params.sortOrder);
        var sort = {};
        sort[sortKey] = sortOrder;

        var fullAddress = params.fullAddress;

        if (isNaN(limit)){
            logger.info("isNan Limit");
            limit = 10;
        }
        if (isNaN(skip) || skip < 0) {
            logger.info("isNan Skip");
            skip = 0;
        }

        if (!sortKey) {
            logger.info("isNan sortKey");

            if(fullAddress) {

                sortKey = 'distance';
                sortOrder = 1;
                sort = {};
                sort['distance'] = sortOrder;
                sortBy = 'distance';

            } else {
                sortKey = 's_name';
                sortOrder = 1;
                sort = {};
                sort['s_name'] = sortOrder;
                sortBy = 'name_az';
            }
        }

        if (fullAddress && !sort['distance']) {
            sort['distance'] = 1;
        } else if(!fullAddress && !sort['s_name']){
          sort['s_name'] = 1;
        }


        var keyword = params.keyword;
        var lat = params.lat;
        var lng = params.lng;
        var within = params.within;
        var city = params.city;
        var zip = params.zip;
        var state = params.state;
        var fullAddress = params.fullAddress;
        var userId = params.userId;
        var county = params.county;
        var location = params.location;

        var searchFilter = {
            _id: ((params._id != null) ? params._id : null),
            userId: userId,
            is_saved: false,
            limit: params.limit,
            skip: params.skip,
            sortBy: params.sortKey,
            sortOrder: params.sortOrder,
            keyword: ((keyword != null) ? keyword : ""),
            city: ((city != null) ? city : ""),
            zip: ((zip != null) ? zip : ""),
            state: ((state != null) ? state : ""),
            fullAddress: ((fullAddress != null) ? fullAddress : ""),
            county: ((county != null) ? county : ""),
            age: [],
            rating: [],
            cost: [],
            faithbased: "",
            accredited: "",
            headstart: "",
            dropins: "",
            beforeschool: "",
            afterschool: "",
            meals: "",
            transportation: "",
            schoolyearonly: "",
            weekend: "",
            goldSeal: "",
            vpk: "",
            schoolReadiness: "",
            nightcare: "",
            halfday: "",
            fullday: "",
            parttime: "",
            location: location
        };

        if (within && isNumeric(parseInt(within))) {
            within = within * 1609.34; //convert miles to meter
        } else {
            within = 20 * 1609.34; // default proximity
        }

        var options = {
            limit: 20
        };

        var query = Listing.find();
        var queryAdvns = null;
        var queryCount = null;

        query.where('name').equals(new RegExp(keyword, 'i'));
        query.where('status').equals("active");

        if (params.cost !== undefined && params.cost.length > 0) {
            console.log("Cost Length: " + params.cost.length);
            query.where('cost').in(params.cost);
            searchFilter.cost = params.cost;
        }

        if (params.rating !== undefined && params.rating.length > 0) {
            console.log("Rating Length: " + params.rating.length);

            var smallest = Math.min.apply(Math, params.rating);
            var largest = Math.max.apply(Math, params.rating);

            query.where('avgOverAllRatings').gte(smallest).lte(largest);
            searchFilter.rating.push(smallest);
            searchFilter.rating.push(largest);

        }

        if (params.age !== undefined && params.age.length > 0) {
            console.log("Age Length: " + params.age.length);

            var orCondition = [];

            for (var i = 0; i < params.age.length; i++) {

                var andCondition = {};

                if (params.age[i] < 1) {


                    console.log(" Age Infants " + params.age[i]);

                    andCondition = {$and: [{'ageLimit.minAge': {$lte: .99}}, {'ageLimit.maxAge': {$gte: .99}}]}


                    // query.where('ageLimit.minAge').lte(.99);
                    // query.where('ageLimit.maxAge').gte(params.age[i]);
                } else {

                    console.log(" Age Toddler " + params.age[i]);

                    andCondition = {$and: [{'ageLimit.minAge': {$lte: params.age[i]}}, {'ageLimit.maxAge': {$gte: params.age[i]}}]}

                    // query.where('ageLimit.minAge').lte(params.age[i]);
                    // query.where('ageLimit.maxAge').gte(params.age[i]);
                }

                orCondition.push(andCondition);
            }

            console.log("Age Condition: " + JSON.stringify(orCondition));

            query.or(orCondition);

            // var smallest = Math.min.apply(Math, params.age);
            // var largest = Math.max.apply(Math, params.age);
            //
            //
            // query.where('ageLimit.minAge').gte(smallest);
            // query.where('ageLimit.maxAge').lte(20);

            searchFilter.age.push(params.age);

        }


        if (params.schoolyearonly !== undefined && params.schoolyearonly == 'Y') {
            console.log("School year only");
            query.where('schoolyearonly').equals("Y");
            searchFilter.schoolyearonly = params.schoolyearonly;
        }

        if (params.infantcare !== undefined && params.infantcare == 'Y') {
            console.log("Infant Care");
            query.where('infantcare').equals("Y");
            searchFilter.infantcare = params.infantcare;
        }

        if (params.weekend !== undefined && params.weekend == 'Y') {
            query.where('weekend').equals("Y");
            searchFilter.weekend = params.weekend;
        }

        if (params.nightcare !== undefined && params.nightcare == 'Y') {
            query.where('nightcare').equals("Y");
            searchFilter.nightcare = params.nightcare;
        }

        if (params.halfday !== undefined && params.halfday == 'Y') {
            query.where('halfday').equals("Y");
            searchFilter.halfday = params.halfday;
        }

        if (params.fullday !== undefined && params.fullday == 'Y') {
            query.where('fullday').equals("Y");
            searchFilter.fullday = params.fullday;
        }

        if (params.parttime !== undefined && params.parttime == 'Y') {
            query.where('parttime').equals("Y");
            searchFilter.parttime = params.parttime;
        }

        if (params.faithbased !== undefined && params.faithbased == 'Y') {
            query.where('faithbased').equals("Y");
            searchFilter.faithbased = params.faithbased;
        }

        if (params.accredited !== undefined && params.accredited == 'Y') {
            query.where('accredited').equals("Y");
            searchFilter.accredited = params.accredited;
        }

        if (params.headstart !== undefined && params.headstart == 'Y') {
            query.where('headstart').equals("Y");
            searchFilter.headstart = params.headstart;
        }

        if (params.dropins !== undefined && params.dropins == 'Y') {
            query.where('dropins').equals("Y");
            searchFilter.dropins = params.dropins;
        }

        if (params.beforeschool !== undefined && params.beforeschool == 'Y') {
            query.where('beforeschool').equals("Y");
            searchFilter.beforeschool = params.beforeschool;
        }

        if (params.afterschool !== undefined && params.afterschool == 'Y') {
            query.where('afterschool').equals("Y");
            searchFilter.afterschool = params.afterschool;
        }

        if (params.meals !== undefined && params.meals == 'Y') {
            query.where('meals').equals("Y");
            searchFilter.meals = params.meals;
        }

        if (params.transportation !== undefined && params.transportation == 'Y') {
            query.where('transportation').equals("Y");
            searchFilter.transportation = params.transportation;
        }

        if (params.goldSeal !== undefined && params.goldSeal == 'Y') {
            query.where('goldSeal').equals("Y");
            searchFilter.goldSeal = params.goldSeal;
        }

        if (params.vpk !== undefined && params.vpk == 'Y') {
            query.where('vpk').equals("Y");
            searchFilter.vpk = params.vpk;
        }

        if (params.schoolReadiness !== undefined && params.schoolReadiness == 'Y') {
            query.where('schoolReadiness').equals("Y");
            searchFilter.schoolReadiness = params.schoolReadiness;
        }

        if (fullAddress) {

            queryAdvns = Listing.aggregate().near(
                {
                    near: {type: 'Point', coordinates: [lng, lat]},
                    distanceField: 'distance',
                    maxDistance: within,
                    query: query._conditions,
                    spherical: true,
                    distanceMultiplier: 0.00062137,
                    num: 1000,
                    limit: 1000
                });

            queryCount = Listing.aggregate().near(
                {
                    near: {type: 'Point', coordinates: [lng, lat]},
                    distanceField: 'distance',
                    maxDistance: within,
                    query: query._conditions,
                    spherical: true,
                    distanceMultiplier: 0.00062137,
                    num: 1000,
                    limit: 1000
                });
        }

        if (fullAddress) {

            logger.info("Searching by Distance");
            queryCount
                .limit(1000)
                .exec(function (err, list) {

                    logger.info("Counting Advance Search Result");
                    if (!err) {

                        var newLimit = limit + skip;

                        queryAdvns
                            .sort(sort)
                            .limit(newLimit)
                            .skip(skip)
                            .exec(function (err, result) {
                                res.json({
                                    searchResult: result,
                                    count: list.length
                                });
                            });

                    } else {
                        return next(err);
                    }

                });


        } else {

            var orCondition = [];

            orCondition.push({'address.city': city});
            orCondition.push({'address.city': location});

            if (city)
                query.where('address.city').equals(new RegExp('^'+city+'$', 'i'));


            if(zip)
                query.where('address.zip').equals(zip);
            if(state)
                query.where('address.state').equals(new RegExp(state, 'i'));

            if (county && county.length > 0) {
                query.where('address.county').equals(new RegExp(county, 'i'));
            }

            logger.info("Searching by Basic " + JSON.stringify(sort));

            query
                .sort(sort)
                .limit(limit)
                .skip(skip)
                .exec(function (err, list) {
                    if (!err) {
                        logger.info("Counting Basic Search Result");
                        query.limit(10000)
                            .count(function (countErr, count) {
                                logger.info("Basic Search Result: Count - " + count  );
                                res.json({
                                    searchResult: list,
                                    count: count
                                });
                            });
                    } else {
                        logger.info("Error: " + err);
                        return next(err);
                    }

                });
        }
        if(params.saveSearch == true)
            saveSearchQuery(params);

    });

    router.route("/user/update").post(function (req, res, next) {

        logger.info("Calling POST user update security info " + req.body);

        logger.info(req.body);

        var user = req.body;

        User.findById(user._id, function (err, existingUser) {
            if (err) {
                return next(err);
            }
            if (existingUser) {
                logger.info('existing_user');
                existingUser.comparePassword(user.old_password, function (err, isMatch) {
                    if (err) {
                        return next(new UnauthorizedAccessError("401", {
                            message: 'Invalid password or username'
                        }));
                    }

                    if (!err && !isMatch) {
                        logger.info("Password mismatch.  Auditing failed login.");
                        return res.status(422).send({
                            error: 'Current password is incorrect'
                        });
                    }

                    logger.info("Password match. Saving new password");

                    existingUser.isUsedPassword(user.new_password, function (err, isMatch) {
                        if (err) {
                            return next(new UnauthorizedAccessError("401", {
                                message: 'Invalid password or username'
                            }));
                        }

                        if (!err && isMatch) {
                            return res.status(422).send({
                                error: 'Your new password must be different from your last three passwords.'
                            });
                        }

                        PasswordReset.update({
                            email: existingUser.email,
                            has_expired: false
                        }, {
                            has_expired: true,
                            modify_date: Date.now()
                        }, {
                            multi: true
                        }).exec();

                        existingUser.addUsedPassword();
                        existingUser.password = user.new_password;
                        existingUser.save();
                        passwordResetSuccess(existingUser);
                        return res.send({
                            password_changed: true
                        });
                    });
                });
            }
        });


    });

    router.route("/user/register").post(function (req, res, next) {

        logger.info("Calling POST user " + req.body);

        var user = new User(req.body);

        // convert from (xxx) xxx-xxxx to xxxxxxxxxx
        user.mobileNum = user.mobileNum.replace(/[\(\)\s\-]/g, '');

        if (!(_.isEmpty(req.body._id))) {
            User.findById(user._id, function (err, existingUser) {
                if (err) {
                    return next(err);
                }
                if (existingUser) {
                    if (!(_.isEmpty(user.children))) {
                        ListingController.saveDaycaresFromUserRegistration(user.children);
                    }
                    User.update({
                        _id: user._id
                    }, user, {
                        multi: true
                    }, function (err, numberAffected) {
                        if (err) {
                            return next(err);
                        }
                        res.send({
                            user: existingUser
                        });
                    });
                }
            });
        } else {
            User.findOne({
                mobileNum: user.mobileNum
            }, function (err, existingUser) {
                if (err) {
                    return next(err);
                }

                if (existingUser) {
                    res.status(508).json({
                        message: 'Cell Number already in use! Try a different one.'
                    });
                } else {

                    User.findOne({
                        email: user.email
                    }, function (err, existingUser) {
                        if (err) {
                            return next(err);
                        }

                        if (existingUser) {
                            res.status(503).json({
                                message: 'Email already in used! Try a different one.'

                            });
                        } else {
                        
                            if((typeof(user.aliasName)!='undefined'||user.aliasName!=null)&&user.aliasName!=''){
                                User.findOne({
                                    aliasName: user.aliasName
                                }, function (err, existingAlias) {
                                    if (err) {
                                        return next(err);
                                    }

                                    if (existingAlias) {
                                        res.status(501).json({
                                            message: 'Alias already in used! Try a different one.'

                                        });
                                    } else {
                                        user.verification_code = generateCode();
                                        user.save(function (err) {
                                            if (err) {
                                                logger.info("Failed saving user to MongoDB");
                                                res.status(500).json(err)
                                            } else {
                                                logger.info("Successful saving user to MongoDB");

                                                clearLock(user.username);
                                                // sendWelcomeEmail(user);
                                                sendConfirmationLink(user, utils.EMAIL_CONFIRMATION_TYPES.REGISTER);

                                                res.send({
                                                    user: user
                                                });

                                            }
                                        });
                                    }
                                });
                            }else{
                                user.verification_code = generateCode();
                                user.save(function (err) {
                                    if (err) {
                                        logger.info("Failed saving user to MongoDB");
                                        res.status(500).json(err)
                                    } else {
                                        logger.info("Successful saving user to MongoDB");

                                        clearLock(user.username);
                                        // sendWelcomeEmail(user);
                                        sendConfirmationLink(user, utils.EMAIL_CONFIRMATION_TYPES.REGISTER);

                                        res.send({
                                            user: user
                                        });

                                    }
                                });
                            }
                            
                        }
                    });

                }
            });
        }

    });

    router.route("/sendInvite").post(function (req, res, next) {

        console.log('Calling POST sendInvite %j', req.body);
        let {
            user_id, 
            first_name, 
            last_name, 
            email, 
            message, 
            recipient
        } = req.body;
        
        let dataFormat = {
            user_id, 
            name: `${first_name} ${last_name}`, 
            email, 
            message, 
            recipient
        };
        
        var inviteObject = new Invite(dataFormat);
        
        inviteObject.save(function( err, response) {
            if (err) {
                return next(err);
            }else{
                // notifyInvite(inviteObject, function( err, response) {
                //     if (err) {
                //         return next(err);
                //     } else {
                //         res.send(response);
                //     }
                // });
                notifyInvite(req.body);
                res.send(response);
                return res.status(200).json({
                    "message": "Invitation(s) sent!",
                    "data" : req.body
                });
            }
        });

    });

    router.route("/user/all").post(function (req, res, next) {

        logger.info("Calling POST user " + req.body);

        var user = new User(req.body);

        User.find({
            contactNum: new RegExp(user.contactNum),
            zip: user.zip
        }, function (err, users) {
            if (err) {
                return next(err);
            }

            res.send({
                users: users
            });
        });

    });

    router.route("/sendSmsToken").post(function (req, res, next) {

        logger.info("Sending SMS verification ");

        logger.info("Calling POST user " + req.body);

        var user = new User(req.body);

        User.findOne({
            email: user.email
        }, function (err, existingUser) {

            if (err) {
                return next(err);
            }

            if (existingUser) {
                existingUser.verification_code = generateCode();
                existingUser.save(function (err) {
                    if (err) {
                        logger.info("Failed saving user to MongoDB");
                        res.status(500).json(err)
                    } else {
                        logger.info("Successful saving user to MongoDB");

                        var response = sendSmsVerification(existingUser.mobileNum, existingUser.verification_code);

                        logger.info("Response: " + response);

                        res.send({
                            user: existingUser
                        });

                    }
                });
            }
        });

    });

    router.route("/verifySmsToken").post(function (req, res, next) {

        // var sms = req.number;

        logger.info("Calling verify SMS token" + req.body);

        var token = req.body.token;
        var email = req.body.email;

        if (!token || !email) {
            return res.status(422).send({
                error: 'You must provide the reset token and account email'
            });
        }

        User.findOne({
            email: email,
            verification_code: token
        }, function (err, existingUser) {

            if (err) {
                return next(err);
            }

            if (!existingUser) {
                return res.status(422).send({
                    error: 'Verification Token is Invalid.'
                });
            } else {


                existingUser.phone_number_verified = true;
                existingUser.save();
                res.send({
                    user: existingUser
                });


            }

        });

    });

    router.route("/activateUser").post(requireUserType('admin'),function (req, res, next) {
        logger.info("Activating user!");

        var user = req.body;

        User.update({
            _id: user._id
        }, {
            status: user.status
        }, {
            upsert: true
        }, function (err, response) {
            if (err) {
                return next(err);
            }
            res.send({
                status: response
            });
        });


    });

    router.route("/getLatLng").get(function (req, res, next) {

        // console.log("Get Lat Lng Address: " + req.query.address);
        // res.send( getLatLng(req.query.address) );


        var googleMapUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + req.query.address + "&key=AIzaSyA79wYyhqmixdy0zALuLb7e6otTHw6oau8";

        logger.info("Google map URL: " + googleMapUrl);


        request({
            uri: googleMapUrl,
            method: "GET",
            timeout: 10000,
            followRedirect: true,
            maxRedirects: 3
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log("Successful getLatLng " )
                res.send(body);
            } else {
                console.log("Failed getLatLng");
            }
        });

    });

    router.route("/all_providers").get(function (req, res, next) {

        User.find({
            $or: [{userType: 'provider'}, {userType: {$in: ['provider']}}]
        }, function (err, users) {
            if (err) {
                return next(err);
            }

            res.send({
                users: users
            });
        });

    });

    router.route("/all_parents").get(function (req, res, next) {

        User.find({
            $or: [{userType: 'parent'}, {userType: {$in: ['parent']}}]

        }, function (err, users) {
            if (err) {
                return next(err);
            }

            res.send({
                users: users
            });
        });

    });

    router.route("/all_users").get(function (req, res, next) {

        User.find({}, function (err, users) {
            if (err) {
                return next(err);
            }

            res.send({
                users: users
            });
        });

    });

    router.route('/upload-with-photo').post(multipartyMiddleware, function (req, res, next) {

        logger.info(util.inspect(req.body, false, null));

        User.findById(req.body._id, function (err, existingUser) {
            var oldPhoto;

            if (req.files && req.files.photo) {
                var file = req.files.photo;
                var split = file.path.split(path.sep);
                var file_name = split[split.length - 1];
                if (existingUser.photo) {
                    oldPhoto = existingUser.photo;
                }
                existingUser.photo = req.body.photo = file_name;
            }

            if (err) {
                return next(err);
            }
            if (existingUser) {
                User.findOne({
                    mobileNum: req.body.mobileNum
                }, function (err, data) {
                    if (err) {
                        return next(err);
                    }

                    function updateUser() {
                        User.update({
                            _id: existingUser._id,
                        }, req.body, {
                            multi: true
                        }, function (err, numberAffected) {
                            if (err) {
                                return next(err);
                            }
                            res.send({
                                user: existingUser
                            });
                        });
                    }

                    if (data == null || data.id == existingUser.id) {
                        if (data == null) {
                            if (existingUser.mobileNum != "") {
                                req.body.phone_number_verified = "false";
                            } else {
                                req.body.phone_number_verified = "unverified";
                            }
                        }

                        User.findOne({
                            $or: [ 
                                { mobileNum: req.body.workNum }, 
                                { mobileNum: req.body.contactNum } 
                            ]
                        }, function (err, data) {
                            console.log(err, data);
                            if (err) {    
                                return next(err);
                            }

                            else if(data == null){
                                User.findOne({
                                    email: req.body.email
                                }, function(err, userData) {
                                    if (err) {
                                        return next(err);
                                    }

                                    if (userData == null || userData.id == existingUser.id) {
                                        User.findOne({
                                            aliasName: req.body.aliasName
                                        }, function(err, aliasData) {
                                            if (err) {
                                                return next(err);
                                            }

                                            if (aliasData == null || aliasData.id == existingUser.id || req.body.aliasName == '') {
                                                if (userData == null) {
                                                    req.body.status = 'pending';
                                                    sendConfirmationLink(req.body, utils.EMAIL_CONFIRMATION_TYPES.CHANGED);
                                                }
                                                delete req.body._id;
                                                if (oldPhoto) {
                                                    fs.unlink(path.join(pathToUploads,oldPhoto), function(err) {
                                                        if (err) {
                                                            return next(err);
                                                        }
                                                        updateUser();
                                                    });
                                                } else {
                                                    updateUser();
                                                }
                                            }
                                            else if (aliasData) {
                                                res.status(501).json({
                                                    message: 'Alias already in used! Try a different one.'
                                                });
                                            }
                                        });
                                    }
                                    else if (userData) {
                                        res.status(503).json({
                                            message: 'Email already in used! Try a different one.'
                                        });
                                    }
                                });
                                
                            }
                            else if(data){
                                res.status(509).json({
                                    message: 'Home/Work Number belongs to another user! Please enter another number.'
                                });
                            }
                        })
                    }
                    else if (data) {
                        res.status(508).json({
                            message: 'Cell Number already in use! Try a different one.'
                        });
                    }
                });
            }
        });
    });

    router.route("/user/:userId").get(function (req, res, next) {
        logger.info("Calling GET user detail" + req.params);
        logger.info(req.params);

        User.findById(req.params.userId, function (err, user) {
            if (err) {
                return next(err);
            }
            res.json(user);
        });
    }).put(function (req, res, next) {
        logger.info("Calling PUT user detail" + req.params);
        logger.info(req.params);
        logger.info(util.inspect(req.body, false, null));

        delete req.body._id;

        User.update({
            _id: req.params.userId,
        }, req.body, {
            multi: true
        }, function (err, user) {
            if (err) {
                return next(err);
            }
            res.json(user);
        });
    });

    router.route("/user/delete").post(requireUserType('admin'),function (req, res, next) {
        logger.info("Deleting User ");

        var id = req.body._id;

        User.findOneAndRemove({"_id": id}, function (err, response) {
            if (err) {
                return next(err);
            }

            return res.status(200).json({
                "message": "User has been successfully deleted"
            });
        });
    });


    router.route("/password-reset").post(function (req, res, next) {

        var email = req.body.email;

        if (!email) {
            return res.status(422).send({
                error: 'You must provide an email'
            });
        }

        User.findOne({
            email: email
        }, function (err, existingUser) {
            //logger.info(existingUser);
            if (err) {
                return next(err);
            }

            if (!existingUser) {
                return res.status(422).send({
                    error: 'No user found'
                });
            }

            var token = (new Date().getTime()).toString(16);
            var firstName = existingUser.firstName;

            PasswordReset.findOne({
                email: email,
                has_expired: false
            }, function (err, existingReset) {
                if (err) {
                    return next(err);
                }

                if (!existingReset) {
                    console.log("Generating  new Password Reset request");
                    var reset_request = new PasswordReset({
                        email: email,
                        token: token,
                        has_expired: false
                    });
                    reset_request.save(function (err) {
                        if (err) {
                            return next(err);
                        }
                    });
                } else {
                    var expiryThreshold = (60 * 60 * 1000) * 24;
                    var tokenAge = ((new Date()) - existingReset.modify_date);
                    var tokenValid = tokenAge < expiryThreshold;

                    console.log("expiryThreshold: " + expiryThreshold + " tokenAge:" + tokenAge + " tokenValid: " + tokenValid);

                    if (tokenValid) {
                        token = existingReset.token;
                    }

                    existingReset.token = token;
                    existingReset.modify_date = Date.now();
                    existingReset.has_expired = false;
                    existingReset.save();
                }

                sendForgotPasswordEmail(firstName, email, token);

                res.send({
                    email: email
                });

            });

        });

    });

    router.route("/account-lock").post(function (req, res, next) {

        logger.info("Calling POST account locked " + req.body);

        var email = req.body.email;
        if (!email) {
            return res.status(422).send({
                error: 'You must provide an email'
            });
        }

        User.findOne({
            email: email
        }, function (err, existingUser) {
            logger.info(existingUser);
            if (err) {
                return next(err);
            }

            if (!existingUser) {
                return res.status(422).send({
                    error: 'No user found'
                });
            }

            var token = (new Date().getTime()).toString(16);

            PasswordReset.findOne({
                email: email,
                has_expired: false
            }, function (err, existingReset) {
                if (err) {
                    return next(err);
                }

                if (!existingReset) {
                    var reset_request = new PasswordReset({
                        email: email,
                        token: token,
                        has_expired: false
                    });
                    reset_request.save(function (err) {
                        if (err) {
                            return next(err);
                        }
                    });
                } else {

                    var expiryThreshold = (60 * 60 * 1000) * 24;
                    var tokenAge = ((new Date()) - existingReset.modify_date);
                    var tokenValid = tokenAge < expiryThreshold;

                    if (tokenValid) {
                        token = existingReset.token;
                    }

                    existingReset.token = token;
                    existingReset.modify_date = Date.now();
                    existingReset.has_expired = false;
                    existingReset.save();
                }

                sendAccountLockEmail(email, token, existingUser.firstName);

                res.send({
                    email: email
                });

            });

        });

    });

    router.route("/verify-reset-link").post(function (req, res, next) {

        logger.info("Calling POST verify reset link" + req.body);

        var token = req.body.token;
        var email = req.body.email;

        if (!token || !email) {
            return res.status(422).send({
                error: 'You must provide the reset token and account email'
            });
        }

        PasswordReset.findOne({
            email: email,
            has_expired: false,
            token: token
        }, function (err, existingReset) {

            if (err) {
                return next(err);
            }

            if (!existingReset) {
                return res.status(422).send({
                    error: 'No password requests found using this token {Request Existence}'
                });
            } else {

                // check if modify_date is within 24 hours

                var expiryThreshold = (60 * 60 * 1000) * 24;
                var tokenAge = ((new Date()) - existingReset.modify_date);
                var tokenValid = tokenAge < expiryThreshold;

                if (tokenValid) {
                    res.send({
                        reset_request: existingReset
                    });
                } else {
                    return res.status(422).send({
                        error: 'Expired token used.'
                    });
                }
            }

        });

    });

    router.route("/account/activation").post(function (req, res, next) {


        var email = req.body.email;
        var token = req.body.token;

        logger.info("Calling GET user activation " + token + " for email: " + email);

        User.findOneAndUpdate({'_id': token, 'email': email}, {$set: {'status': 'active'}},
            function (err, doc) {

                if (err) {
                    logger.info("Error finding ID: " + token + " for email: " + email);
                    return next(err);
                }

                if (doc) {
                    return res.status(200).send({message: "Account was successfully activated!"});
                } else {
                    return res.status(422).send({
                        error: 'Invalid token'
                    });
                }
            });


    });

    router.route("/sendFeedback").post(function (req, res, next) {
        var feedbackObjects = new Feedback(req.body);
        // console.log(feedbackObjects);
        feedbackObjects.save();
        var subject = "Ratingsville Daycare Feedback Notification";
        var feedback = req.body;
        var txt = "UserID: "+feedback.user_id+"\n"+
                "Name: "+feedback.name+"\n"+
                "Email: "+feedback.email+"\n"+
                "Feedback: "+feedback.feedback;
        notifyAdmin(subject,txt)
        notifyUserFeedback(feedback.name, feedback.email);
        /*Feedback.save(function (err, feedbackObjects) {
          if (err) return console.error(err);
        });*/

        res.send("Success");
    });

    router.route("/getAllFeedback").get(requireUserType('admin'),function (req, res, next) {
        logger.info("Getting all Feedback");
        Feedback.find({},function(err,fb){
            if(!err&&fb){
                logger.info("Sending all Feedback");
                return res.send(fb);
            }else{
                logger.info("ERROR Getting all Feedback");
                return res.next(err);
            }
        });
    });

    router.route("/markFeedback").post(requireUserType('admin'),function (req, res, next) {
        logger.info("Marking Feedback");
        Feedback.update({
            _id:req.body._id
        },
        {
            status : req.body.status
        },
        function(err,upd){
            if(!err&&upd){
                logger.info("Sending all Feedback");
                return res.json(upd);
            }else{
                logger.info("ERROR Getting all Feedback");
                return res.next(err);
            }
        });
    });

    router.route("/save-new-password").post(function (req, res, next) {

        logger.info("Calling POST save new password");

        var user = req.body.user;

        if (_.isEmpty(user)) {
            return res.status(422).send({
                error: 'You must provide the email, new password and reset token'
            });
        }
        var email = user.email;
        var password = user.password;
        var token = user.token;

        if (_.isEmpty(email) || _.isEmpty(password) || _.isEmpty(token)) {
            return res.status(422).send({
                error: 'You must provide the email, new password and reset token'
            });
        }

        PasswordReset.findOne({
            email: email,
            has_expired: false
        }, function (err, existingReset) {
            if (err) {
                //return next(err);
            }

            logger.info("Finding existing user match");

            User.findOne({
                email: email
            }, function (err, existingUser) {

                if (err) {
                    return next(err);
                }

                if (!existingUser) {
                    return res.status(422).send({
                        error: 'No user found'
                    });
                }


                LoginAttempt.findOne({
                    email: email,
                    is_resolved: false
                }, function (err, existingAttempt) {

                    if (err) {
                        //
                    }

                    if (!existingAttempt) {
                        console.info('No locked attempts found for this email: ' + email);
                    } else {
                        existingAttempt.is_resolved = true;
                        existingAttempt.save();
                    }

                    existingUser.isUsedPassword(password, function (err, isMatch) {
                        if (err) {
                            return next(new UnauthorizedAccessError("401", {
                                message: 'Invalid password or username'
                            }));
                        }

                        if (!err && isMatch) {
                            logger.info("Returning an error due to used passwords");

                            return res.status(422).send({
                                error: 'Your new password must be different from your last three passwords.'
                            });
                        } else {

                            existingUser.addUsedPassword();
                            logger.info("Shift used passwords");
                            existingUser.password = password;


                            existingUser.save(function (error, data) {
                                if (error) {
                                    console.log("Failed saving user info")
                                }
                                else {

                                    if (existingReset) {
                                        existingReset.has_expired = true;
                                        existingReset.save(function (error, data) {
                                            if (error) {
                                                console.log("Failed saving reset info");
                                            } else {
                                                passwordResetSuccess(existingUser);
                                                return res.send({
                                                    password_changed: true
                                                });
                                            }
                                        });

                                    } else {
                                        passwordResetSuccess(existingUser);
                                        return res.send({
                                            password_changed: true
                                        });
                                    }
                                }
                            });

                        }
                    });
                });

            });
        });

    });

    router.route("/unlockip").get(requireUserType('admin'),function (req, res, next) {

        var ip = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;

        logger.info("Calling Unlock IP Address: " + ip);

        LoginAttempt.findOne({
            ip: ip,
            is_resolved: false
        }, function (err, existingAttempt) {
            if (err) {
                return next(err);
            }

            if (!existingAttempt) {
                console.info('No locked attempts found for this ip: ' + ip);
            } else {
                existingAttempt.is_resolved = true;
                existingAttempt.save();
            }
        });

    });

    router.route("/send-username").post(function (req, res, next) {

        logger.info("Calling POST send username" + req.body);

        var firstName = req.body.user.firstName;
        var lastName = req.body.user.lastName;
        var zip = req.body.user.zip;
        var contactNum = req.body.user.contactNum;

        var month = "";
        var day = "";
        var year = "";

        if (req.body.user.birth) {
            month = req.body.user.birth.month;
            day = req.body.user.birth.day;
            year = req.body.user.birth.year;
        }

        //'address.zip': new RegExp("^"+zip+"$","i"),

        if (!firstName || !lastName || !contactNum) {
            return res.status(422).send({
                error: 'You must provide your first name, last name, zip and the last digits of your contact number to verify your identity.'
            });
        }

        if (month && day && year) {
            User.find({

                firstName: {
                    $regex: new RegExp("^" + firstName + "$", "i")
                },
                lastName: {
                    $regex: new RegExp("^" + lastName + "$", "i")
                },
                mobileNum: {
                    $regex: new RegExp(contactNum + "$", "i")
                },
                'birth.month': month,
                'birth.day': day,
                'birth.year': year
            }, function (err, existingUser) {

                if (err) {
                    return next(err);
                }

                if (!existingUser || existingUser.length === 0) {
                    return res.status(422).send({
                        error: 'No user found',
                        error_code: 'email_not_found'
                    });
                }

                logger.info("Found username matches: " + existingUser.length);

                if (existingUser.length > 1) {

                    return res.status(422).send({
                        error: 'Multiple user match the criteria',
                        error_code: 'multiple_match_bday'
                    });
                }

                sendForgotUsernameEmail(existingUser[0].email, existingUser[0].firstName);

                var emailClue = existingUser[0].email.substr(0, 1);
                var emailParts = existingUser[0].email.split('@');
                var asterisk = emailParts[0].substr(1, emailParts[0].length - 2);
                emailClue += asterisk.replace(/./gi, '*') + emailParts[0].substr(-1) + '@' + emailParts[1];

                res.send({
                    emailClue: emailClue
                });

            });
        } else {
            //'address.zip': new RegExp("^"+zip+"$","i")
            User.find({
                firstName: {
                    $regex: new RegExp("^" + firstName + "$", "i")
                },
                lastName: {
                    $regex: new RegExp("^" + lastName + "$", "i")
                },
                mobileNum: {
                    $regex: new RegExp(contactNum + "$", "i")
                }
            }, function (err, existingUser) {

                if (err) {
                    return next(err);
                }

                if (!existingUser || existingUser.length === 0) {
                    return res.status(422).send({
                        error: 'No user found',
                        error_code: 'email_not_found'
                    });
                }

                logger.info("Found username matches: " + existingUser.length);

                if (existingUser.length > 1) {

                    return res.status(422).send({
                        error: 'Multiple user match the criteria',
                        error_code: 'multiple_match_bday'
                        //error_code: 'multiple_match_zip'
                    });
                }

                sendForgotUsernameEmail(existingUser[0].email, existingUser[0].firstName);

                var emailClue = existingUser[0].email.substr(0, 1);
                var emailParts = existingUser[0].email.split('@');
                var asterisk = emailParts[0].substr(1, emailParts[0].length - 2);
                emailClue += asterisk.replace(/./gi, '*') + emailParts[0].substr(-1) + '@' + emailParts[1];

                res.send({
                    emailClue: emailClue
                });

            });
        }


    });

    router.route("/states").get(function (req, res, next) {

        jfs.readFile(rootDir + '/resp/list/' + basedir + '/states.json', 'utf8', function (err, data) {
            if (err) {
                logger.info(err);
                res.status(422).send({
                    error: "Error reading response file"
                });
            } else {
                res.send(data);
            }
        });

    });

    router.route("/questions").get(function (req, res, next) {

        logger.info("Calling GET questions list");

        jfs.readFile(rootDir + '/resp/list/' + basedir + '/security_questions.json', 'utf8', function (err, data) {
            if (err) {
                logger.info(err);
                res.status(422).send({
                    error: "Error reading response file"
                });
            } else {
                res.send(data);
            }
        });

    });

    /* Audit Log Routes */

    router.route('/addAuditLog').post(function (req, res, next) {
        logger.info("Add Audit Log");
        var newAuditLog = new AuditLog({
            ip_address: req.body.ip_address,
            email: req.body.email,
            url_visited: req.body.url_visited,
            visit_counter: req.body.visit_counter,
            create_date: new Date()
        });
        newAuditLog.save(function (err, doc) {
            if (err) {
                next(err);
            } else {
                res.send(doc);
            }
        });
    });

    router.route('/getAuditLog').post(function (req, res, next) {
        logger.info("Get Audit Log");
        if (req.body.email == "") {
            AuditLog.find({
                ip_address: req.body.ip_address
            }, function (err, auditlog) {
                logger.info("data by IP:----->");
                if (err) {
                    return next(err);
                } else {
                    res.send(auditlog);
                }
            });
        } else {
            AuditLog.find(
                {
                    $and: [{ip_address: req.body.ip_address}, {email: req.body.email}]
                }, function (err, auditlog) {
                    logger.info("data:----->");
                    if (err) {
                        return next(err);
                    } else {
                        res.send(auditlog);
                    }

                });
        }
    });

    router.route('/updateAuditLog').post(function (req, res, next) {
        logger.info("Update Audit Log");
        AuditLog.update({
            _id: req.body.id
        }, {
            $set: {
                visit_counter: req.body.visit_counter,
                visit_date: new Date()
            }
        }, function (err, response) {
            if (err) {
                return next(err);
            } else {
                res.send({audit: response});
            }
        });

    });

    router.route('/incrementOverallAuditLog').post(function (req, res, next) {
        logger.info("Increment Total Visits Audit Log");

        AuditLog.findOne({
            url_visited: "overall"
        }, function (err, auditlog) {


            if (err) {
                logger.error("Error retrieving Overall Visitor Counter");
                return next(err);

            } else {

                if (auditlog) {

                    auditlog.visit_counter = auditlog.visit_counter + 1;
                    auditlog.save();
                    res.send(auditlog);
                    logger.info("Incrementing Overall Visit counter :  " + auditlog.visit_counter);

                } else {

                    var newAuditLog = new AuditLog({
                        ip_address: "0.0.0.0",
                        email: "",
                        url_visited: "overall",
                        visit_counter: 1,
                        create_date: new Date()
                    });
                    newAuditLog.save(function (err, doc) {
                        if (err) {
                            next(err);
                        } else {
                            res.send(doc);
                        }
                    });

                    logger.info("Inserting Overall Visit counter :  " + newAuditLog.visit_counter);
                }


            }
            logger.info("Exiting Overall Visit counter :  ");
        });
    });

    router.route('/owner-request').post(requireUserType(['admin','user']), function (req, res, next) {
        var ownerRequest = new OwnerRequest(req.body);
        ownerRequest.save(function (err) {
            if (err) {
                if (err.errmsg.indexOf('duplicate key') != -1) {
                    OwnerRequest.findOne({owner: ownerRequest.owner, listing: ownerRequest.listing}, function (findErr, findRes) {
                        // restart rejected ownership request
                        if (findRes.status === 'rejected') {
                            findRes.populate('owner listing', function (popErr, popRes) {
                                if (popErr) return next(popErr);

                                var payload = startReminders(popRes);
                                payload.status = popRes.status = 'pending';
                                findRes.update({$set: payload}, function (updateErr) {
                                    if (updateErr) return next(updateErr);

                                    res.json({owner_requested: popRes});
                                    ownershipRequestEmail(popRes, 'received');
                                });
                            });
                        } else {
                            // send 'duplicate key' error
                            res.status(400).json(err);
                        }
                    });
                } else {
                    next(err);
                }
            } else {
                ownerRequest.populate('owner listing', function (err, result) {
                    if (err) {
                        next(err);
                    } else {
                        ownerRequest.update({ $set: startReminders(result) }, function (err, response) {
                            if (err) {
                                next(err);
                            } else {
                                res.json({
                                    owner_requested: result
                                });
                                ownershipRequestEmail(result, 'received');
                            }
                        });
                    }
                });
            }
        });
    }).get(requireUserType(['admin','user']), function (req, res, next) {
        var params = {};
        var noPopulate;

        if (req.query.userId) {
            params.owner = req.query.userId;
        }
        if (req.query.noPopulate) {
            noPopulate = parseInt(req.query.noPopulate);
        }
        if (req.query.status) {
            if (req.query.not && parseInt(req.query.not)) {
                params.status = {$ne: req.query.status};    
            } else {
                params.status = req.query.status;
            }
        }

        var query = OwnerRequest.find(params);
        if (!noPopulate) {
            query.populate('owner', '-password -used_password')
            .populate({
                path: 'listing',
                select: '_id name owner_id',
                model: 'Listing',
                populate: {
                    path: 'owner_id',
                    select: '-password -used_password',
                    model: 'User'
                }
            });
        }
        query.exec(function (err, ownerRequests) {
            if (err) {
                next(err);
            }

            res.json({searchResult: ownerRequests});
        });
    });

    router.route('/owner-request/:ownerRequestId').get(function(req, res, next) {
        OwnerRequest.findById(req.params.ownerRequestId)
            .populate('listing owner')
            .exec(function(err, ownerRequest) {
                if (err) {
                    return next(err);
                }

                res.json({searchResult: ownerRequest});
            });
    }).put(requireUserType(['admin','user']),function (req, res, next) {
        if (req.body.status && req.body.status == 'approved' && (req.body.owner && req.body.owner._id) && (req.body.listing && req.body.listing._id)) {

            Listing.findByIdAndUpdate(req.body.listing._id, {owner_id: req.body.owner._id, managed: 'Y'}, function(err, result) {
                if (err) {
                    return next(err);
                }

                OwnerRequest.findById(req.params.ownerRequestId).populate('owner listing').exec(function(err, ownerReq) {
                    if (err) {
                        return next(err);
                    }
                    ownerReq.status = req.body.status;
                    ownerReq.save(function(err) {
                        if (err) {
                            return next(err);
                        }

                        Review.remove({user_id: ownerReq.owner._id, daycare_id: req.body.listing._id}, function(err, result) {
                            if (err) {
                                return next(err);
                            }
                            if (result.result.ok && result.result.n) {
                                computeAverageRatings(req.body.listing._id);
                                // sendReviewUnavailable(ownerReq.owner, ownerReq.listing);
                            }
                        });

                        ownershipRequestEmail(ownerReq,'approved'); // SEND EMAIL TO USER
                        res.json(ownerReq);
                        stopReminders(ownerReq);
                        OwnerRequest.find({listing: ownerReq.listing._id, owner: {$ne: ownerReq.owner._id}}).populate('owner listing').exec(function(err, ownerReqs) {
                            if (!err) {
                                ownerReqs.forEach(function(val) {
                                    stopReminders(val, true);
                                    val.remove();
                                    ownershipRequestEmail(val, 'declined');
                                });
                            }
                        });
                    });
                });
            });
        } else if (req.body.status && req.body.status != 'approved') {
            OwnerRequest.findByIdAndUpdate(req.params.ownerRequestId, {status: req.body.status}, function(err, resp) {
                if (err) {
                    return next(err);
                }
                resp.populate('owner listing', function(err, result) {
                    if (!err) {
                        if (req.body.status == 'rejected') {
                            stopReminders(result);
                            ownershipRequestEmail(result,'declined'); // SEND EMAIL TO USER
                        } else if (req.body.status == 'pending' && req.body.from && req.body.from == 'provider') {
                            resp.update({$set: startReminders(result)}, function(err) {
                                if (!err) {
                                    ownershipRequestEmail(result, 'received');
                                }
                            });
                        }
                    }
                });
                res.json(resp);
            });
        } else if (Object.keys(req.body).length) {
            OwnerRequest.update({_id:req.params.ownerRequestId}, req.body, function(err, resp) {
                if (err) return next(err);
                res.json(resp);
            });
        } else {
            res.status(400).json({message: 'Request body missing'});
        }
    }).delete(requireUserType(['admin','user']), function (req, res, next) {

        OwnerRequest.findOneAndRemove({_id: req.params.ownerRequestId}, function (err, ownerRequest) {
            if (err) {
                return next(err);
            }

            deleteOwnerReqFiles(ownerRequest);
            stopReminders(ownerRequest, true);

            ownerRequest.populate('owner listing', function(err, result) {
                if (err) return next(err);

                if (req.query.from && req.query.from == 'provider') {
                    ownershipRequestEmail(result, 'canceled');
                }

                var updateData = {owner_id: (result.listing.owner_id === result.owner._id.toString()) ? null : result.listing.owner_id};
                updateData.managed = (updateData.owner_id) ? 'Y' : 'N';
                Listing.update({
                    _id: result.listing._id
                }, updateData, function (err, resp) {
                    if (err) {
                        return next(err);
                    }
    
                    return res.status(200).json({
                        "message": "Ownership request has been successfully deleted"
                    });
                });
            });
        });
    });

    router.route('/owner-request/user/:userId/listing/:listingId').get(function (req, res, next) {
        OwnerRequest.findOne({owner: req.params.userId, listing: req.params.listingId}, function (err, ownerRequest) {
            if (err) {
                next(err);
            } else {
                res.json(ownerRequest);
            }
        });
    });

    router.route('/owner-request/uploads').post(requireUserType('user'), multipartyMiddleware, function(req, res, next) {
        logger.info(util.inspect(req.files));
        OwnerRequest.findById(req.body._id)
            .populate('owner')
            .exec(function(err, ownerRequest) {
                if (err) {
                    next(err);
                } else {
                    var docsToUpload = {
                        id_doc: 'photo_id',
                        proof_owner_doc: 'proof_owner',
                        power_attorney_doc: 'authorized_representative'
                    };
                    var needUpload;

                    if (typeof req.body.proof_owner != 'undefined') {
                        ownerRequest.proof_owner = req.body.proof_owner;
                    }
                    Object.keys(docsToUpload).forEach(function(val) {
                        if (req.files[val]) {
                            if (ownerRequest[val]) {
                                fs.unlink(path.join(pathToUploads, ownerRequest[val]));
                                ownerRequest[val+'_sufficient'] = false;
                            }
                            ownerRequest[val] = utils.processReqFile(
                                req.files[val], 
                                ownerRequest.owner.lastName+'_'+ownerRequest.owner.firstName+'_'+docsToUpload[val]+'_'+ownerRequest.owner._id
                            );
                        }
                        if (!ownerRequest[val] && (val != 'power_attorney_doc' || (val == 'power_attorney_doc' && req.body.proof_owner == 'false'))) {
                            needUpload = true;
                        }
                        if (val == 'power_attorney_doc') {
                            if (ownerRequest[val] && req.body.proof_owner == 'true') {
                                fs.unlink(path.join(pathToUploads, ownerRequest[val]));
                                ownerRequest[val] = null;
                                ownerRequest[val+'_sufficient'] = false;
                            }
                        }
                    });

                    ownerRequest.save(function(err) {
                        if (err) {
                            next(err);
                        } else {
                            res.json(ownerRequest);
                            if (!needUpload) {
                                stopReminders(ownerRequest, true);
                            } else {
                                eachReminderDay(function(day) {
                                    startReminder(ownerRequest, ownerRequest[day], day);
                                });
                            }
                        }
                    });
                }
            });
    });

    /* Review Routes */
    router.route('/review').post(function (req, res, next) {
        delete req.body._id;
        var newReview = new Review(req.body);

        logger.info("POST /review " + JSON.stringify(newReview));

        console.log("Saving a new review for daycare: " + newReview.daycare_id);
        newReview.save(function (err, doc) {
            if (err) {
                next(err);
            } else {
                doc.populate('user_id', function(err, reviewDoc) {
                    Listing.findById(reviewDoc.daycare_id, function(err, listing) {
                        reviewDoc.daycare = listing;
                        sendReviewSubmitted(reviewDoc);
                    });
                });
                res.send(doc);
            }
        });
    });

    router.route('/updateReview').post(function (req, res, next) {
        logger.info("Updating Review ");

        var review = req.body;

        var data = {
            approved: review.approved,
            $currentDate: {dateSaved: true}
        };

        if (review.reviewInfo) data.reviewInfo = review.reviewInfo;

        Review.update({
            _id: review._id
        }, data, {
            upsert: true
        }, function (err, response) {
            if (err) {
                return next(err);
            }
            computeAverageRatings(review.daycare_id);
            res.send(response);
        });
    });

    router.route('/review/:listingId').get(function (req, res, next) {
        logger.info(">> Getting Approved Daycare Reviews: " + req.params.listingId);
        var reviewsTasks = [];
        Review.aggregate([
            {$match: {
                daycare_id: req.params.listingId,
                approved: 'true'
            }},
            {$group: {
                _id: '$user_id',
                count: {$sum: 1}
            }}
        ]).cursor({}).exec().toArray(function(err, users) {
            if (err) return next(err);

            users.forEach(function(user) {
                reviewsTasks.push(
                    function(callback) {
                        Review.find({
                            daycare_id: req.params.listingId,
                            user_id: user._id,
                            approved: true
                        }).sort({dateSaved: -1}).limit(2)
                        .populate('user_id', '_id photo firstName lastName aliasName')
                        .exec(callback)
                    }
                );
            });

            console.log(JSON.stringify(reviewsTasks));

            async.parallel(reviewsTasks, function(err, latestReviews) {
                if (err) {
                    next(err);
                } else {
                    console.log("Retrieved all approved : " + JSON.stringify(latestReviews));
                    var uId = (req.query.uId == 'null') ? null : req.query.uId,
                        votesTasks = [];

                    // count votes
                    latestReviews.forEach(function(reviews) {
                        reviews.forEach(function(review) {
                            votesTasks.push(function(callback) {
                                async.parallel([
                                    function(callback) {
                                        ReviewVote.count({review:review._id, vote:'helpful'}, callback);
                                    },
                                    function(callback) {
                                        ReviewVote.count({review:review._id, vote:'unhelpful'}, callback);
                                    },
                                    function(callback) {
                                        ReviewVote.findOne({review:review._id, user:uId}, callback);
                                    },
                                    function(callback) {
                                        ReviewVote.count({review:review._id, vote:'flagged', user:uId}, callback);
                                    },
                                ], callback);
                            });
                        });
                    });

                    async.parallel(votesTasks, function(err, votes) {
                        if (err) return next(err);

                        var result = [],
                            voteIdx = 0;
                        latestReviews.forEach(function(reviews) {
                            var latestRevWithVotes;
                            reviews.forEach(function(review, idx) {
                                var vote = votes[voteIdx++],
                                    revWithVotes = review.toObject();
                                if (idx === 0) {
                                    latestRevWithVotes = revWithVotes;
                                } else if (idx === 1) {
                                    latestRevWithVotes.oldReview = revWithVotes
                                }
                                revWithVotes.helpfulVotes = vote[0];
                                revWithVotes.unHelpfulVotes = vote[1];
                                revWithVotes.userVote = vote[2];
                                revWithVotes.userFlagged = vote[3];
                            });
                            result.push(latestRevWithVotes);
                        });

                        console.log(">> Everything OK till here" );
                        res.send(result);
                    });
                }
            });
        });
    });

    router.route('/review-vote').post(function(req, res, next) {

        var reviewVote = new ReviewVote(req.body);

        console.log(">>>>> VOTING:  " + JSON.stringify(reviewVote));

        ReviewVote.findOne({review:reviewVote.review, user:reviewVote.user}, function(err, result){

            console.log(">>>>> Result or ReviewVote: " + JSON.stringify(result))

            if(result){
                console.log(">>>>>> Existing review - will update it. " + reviewVote.vote);
                var newVote = reviewVote.vote;
                reviewVote = result;
                reviewVote.vote = newVote;
            }

            if(reviewVote.vote == "flagged"){

                reviewVote.save(function(err) {

                    if (err) return next(err);

                    flaggedReviewEmail({"user_flagger":reviewVote.user,
                        "review_id": reviewVote.review,
                        "flag_date": new Date().getTime()});



                    // User.findOne({_id: reviewVote.user}, function (err, user) {
                    //     if (!err) {
                    //         //send email here
                    //         flaggedReviewUserEmail({
                    //             "aliasName": user.firstName,
                    //             "userEmail": user.email,
                    //             "daycareName": "Test Daycare"
                    //         });
                    //     }
                    // });

                    res.json(reviewVote);


                });

                Review.findOne({ _id : reviewVote.review}, function(err, review) {
                    if (!err) {
                        console.log('>>>>>> REVIEW: ' + JSON.stringify(review));
                        Listing.findById({ _id : review.daycare_id}, function (err, dayCare) {
                            if (!err) {
                                //console.log('listing: ' + JSON.stringify(dayCare));
                                User.findOne({ _id : reviewVote.user}, function(err, user) {
                                    if (!err) {
                                        //send email here
                                        console.log('>>>>> USER: ' + JSON.stringify(user));

                                        var aliasName;

                                        if(user.firstName){
                                            aliasName = user.firstName;
                                        } else {
                                            aliasName = user.aliasName;
                                        }

                                        flaggedReviewUserEmail({"aliasName": aliasName,  "userEmail": user.email, "daycareName": dayCare.name });
                                    }
                                });
                            }
                        });
                    }
                });

            } else {

                reviewVote.save(function(err) {
                    if (err) return next(err);

                    res.json(reviewVote);
                });
            }
        });

    }).delete(function(req, res, next) {

        ReviewVote.remove({review: req.query.review, user: req.query.uId}, function(err, result) {
            if (err) return next(err);

            if( req.query.tag == "flagged"){

                Listing.findById({ _id : result.daycare_id}, function (err, dayCare) {
                    if (!err) {
                        //console.log('listing: ' + JSON.stringify(dayCare));
                        User.findOne({ _id : req.query.uId}, function(err, user) {
                            if (!err) {
                                //send email here
                                console.log('user: ' + JSON.stringify(user));
                                //unFlaggedReviewUserEmail({"aliasName": user.aliasName, "userEmail": user.email, "daycareName": dayCare.name });
                            }
                        });
                    }
                });

            } else {

            }

            res.send(result);
        });


    });

    router.route('/review/:reviewId/reply').post(requireUserType('user'), function(req, res, next) {
        var message = new UserMessage(req.body);
        message.save(function(err) {
            if (err) {
                next(err);
            } else {
                message.populate('sender_id recipient_id', '_id photo email aliasName firstName lastName', function(err, result) {
                    if (err) {
                        next(err);
                    } else {
                        res.json(result);
                    }
                });
            }
        });
    }).get(function(req, res, next) {
        var query = UserMessage.find({
            review_id: req.params.reviewId
        }).populate('sender_id recipient_id', '_id photo email aliasName firstName lastName');

        if(req.query.skip) {
            query.skip(parseInt(req.query.skip));
        }

        if (req.query.limit) {
            query.limit(parseInt(req.query.limit));
        }

        if (req.query.sortBy) {
            var sort = {};
            if (req.query.sortOrder) {
                sort[req.query.sortBy] = req.query.sortOrder;
            } else {
                sort[req.query.sortBy] = 1;
            }
            query.sort(sort);
        }

        // if (req.query.startDate) {
        //     query.where('date').gt(req.query.startDate);
        // }

        query.exec(function(err, replies) {
            if (err) {
                next(err);
            } else {
                res.json(replies);
            }
        });
    });

    router.route('/reply/:replyId').put(requireUserType('user'), function(req, res, next) {
        UserMessage.findById(req.params.replyId, function(err, reply) {
            if (err) {
                next(err);
            } else {
                reply.message = req.body.message;
                reply.save(function(err) {
                    if (err) {
                        next(err);
                    } else {
                        reply.populate('sender_id recipient_id', '_id photo email aliasName firstName lastName', function(err, result) {
                            if (err) {
                                next(err);
                            } else {
                                res.json(result);
                            }
                        });
                    }
                });
            }
        });
    });

    router.route('/delete_review/:reviewId').post(function (req, res, next) {

        Review.findOne({
            _id: req.params.reviewId
        }, function (err, result) {
            if (err) {
                next(err);
            } else {
                var listingId = result.daycare_id;
                console.log("Updating average rating for : " + listingId);

                Review.remove({ _id: req.params.reviewId }, function(err,result) {
                    if (err) {
                        next(err);
                    } else {
                        res.send(result);

                        computeAverageRatings(listingId);

                    }
                });
            }
        });

    });

    router.route('/approved_reviews/:listingId').get(function (req, res, next) {
        logger.info("Getting Daycare Approved Reviews: " + req.params.listingId);

        Review.find({
            daycare_id: req.params.listingId,
            approved: "true"
        }, function (err, result) {
            if (err) {
                next(err);
            } else {
                res.send(result);
            }
        });

    });

    router.route('/updateRatingAverage/:listingId').get(function (req, res, next) {
        logger.info("Updating Daycare Rating: " + req.params.listingId);

        var listingId = req.params.listingId;

        Review.aggregate([
                {  $match: {
                    daycare_id: listingId,
                    approved: "true"
                }},
                { "$group": {
                    "_id": null,
                    "totalSafetyRate": { "$sum": "$reviewInfo.safetyRate" },
                    "totalFacilitiesRate": { "$sum": "$reviewInfo.facilitiesRate" },
                    "totalStaffRate": { "$sum": "$reviewInfo.staffRate" },
                    "totalEducationRate": { "$sum": "$reviewInfo.educationRate" },
                    "totalOverAllRate": { "$sum": "$reviewInfo.overAllRate" },
                    "totalAvgRating": { "$sum": "$reviewInfo.avgRating" },
                    "totalReviews": {"$sum": 1}
                }}
            ],
            function(err, reviewSummary) {

                console.log("Review Summary:  " + JSON.stringify(reviewSummary));

                if(reviewSummary && reviewSummary.length > 0) {
                    var ratingSummary = reviewSummary[0];

                    if (err) {
                        throw(err);
                    } else {

                        var avgSafetyRatings = parseFloat(ratingSummary.totalSafetyRate) / parseInt(ratingSummary.totalReviews);
                        var avgFacilitiesRatings = parseFloat(ratingSummary.totalFacilitiesRate) / parseInt(ratingSummary.totalReviews);
                        var avgStaffRatings = parseFloat(ratingSummary.totalStaffRate) / parseInt(ratingSummary.totalReviews);
                        var avgEducationRatings = parseFloat(ratingSummary.totalEducationRate) / parseInt(ratingSummary.totalReviews);
                        var avgOverAllRatings = parseFloat(ratingSummary.totalOverAllRate) / parseInt(ratingSummary.totalReviews);
                        var totalReviews = parseInt(ratingSummary.totalReviews);

                        avgSafetyRatings = avgSafetyRatings.toFixed(2);
                        avgFacilitiesRatings = avgFacilitiesRatings.toFixed(2);
                        avgStaffRatings = avgStaffRatings.toFixed(2);
                        avgEducationRatings = avgEducationRatings.toFixed(2);
                        avgOverAllRatings = avgOverAllRatings.toFixed(2);

                        console.log("Safety: " + avgSafetyRatings);

                        Listing.update({
                            _id: listingId
                        }, {
                            avgSafetyRatings: avgSafetyRatings,
                            avgFacilitiesRatings: avgFacilitiesRatings,
                            avgStaffRatings: avgStaffRatings,
                            avgEducationRatings: avgEducationRatings,
                            avgOverAllRatings: avgOverAllRatings,
                            totalReviews: totalReviews
                        }, {
                            upsert: true
                        }, function (err, response) {
                            if (err) {
                                return next(err);
                            } else
                                res.send({
                                    avgSafetyRatings: avgSafetyRatings,
                                    avgFacilitiesRatings: avgFacilitiesRatings,
                                    avgStaffRatings: avgStaffRatings,
                                    avgEducationRatings: avgEducationRatings,
                                    avgOverAllRatings: avgOverAllRatings,
                                    totalReviews: totalReviews
                                });
                        });
                    }
                } else {
                    res.send({err: "No Approved Reviews"});
                }
            });

    });

    router.route('/pending_review/:reviewId').get(function (req, res, next) {
        logger.info("Getting Pending Review: " + req.params.reviewId);
        Review.find({
            _id: req.params.reviewId,
            $or: [{approved: "false"}, {approved: {$exists: false}}]
        }, function (err, result) {
            if (err) {
                //logger.info("### RES.STATUS : "+res.status+" ###");
                next(err);
            } else {
                //logger.info("### RES.STATUS : "+res.status+" ###");
                res.send(result);
            }
        });
    });

    router.route('/get_review/:reviewId').get(function (req, res, next) {

        Review.find({
            _id: req.params.reviewId
        }).populate('user_id', '_id photo firstName lastName aliasName')
            .exec(function (err, result) {
                if (err) {
                    next(err);
                } else {
                    res.send(result);
                }
            });
    });


    router.route('/my_reviews/:userId').get(function (req, res, next) {
        logger.info("Getting My Daycare Reviews");

        Review.find({
            user_id: req.params.userId
        }).populate('user_id', '_id photo aliasName firstName lastName')
            .exec(function (err, result) {
                if (err) {
                    next(err);
                } else {
                    //logger.info("response: "+JSON.stringify(result));
                    res.json(result);
                }
            });

    });

    router.route('/user_review_daycare/:userId/:listingId').get(function (req, res, next) {
        logger.info("### Reviews User:"+req.params.userId+" Daycare:"+req.params.listingId+" ###");

        Review.find({
            user_id: req.params.userId,
            daycare_id : req.params.listingId
        }, function (err, result) {
            if (err) {
                next(err);
            } else {
                //logger.info("response: "+JSON.stringify(result));
                res.json(result);
            }
        });

    });

    router.route('/my_reviewsOwned/:userId/:listingId').get(function (req, res, next) {
        logger.info("Getting Reviews Owned Daycare Reviews");
        Listing.find({
            _id: req.params.listingId,
            owner_id: req.params.userId
        }, function (err, result) {
            if (err) {
                next(err);
            } else {

                //var loopCount = 0;
                var reviews = [];
                var ids = [];
                for (var i = 0; i < result.length; i++) {
                    console.log("Reviews Owned: " + result[i].id);
                    ids.push(result[i].id);
                }

                Review.find({
                    $or: [{daycare_id: {$in: ids}}],
                    approved: true
                }).populate('user_id','_id photo aliasName firstName lastName').lean()
                    .exec(function (err, ret) {

                        if (err) {
                            next(err);
                        } else {
                            res.json(ret);
                        }
                    });

            }
        });


    });

    router.route('/my_daycares/:userId').get(function (req, res, next) {
        logger.info("Getting My Daycare " + req.params.userId);

        Listing.find({
            owner_id: req.params.userId
        }, function (err, result) {

            if (err) {
                next(err);
            } else {
                res.send(result);
            }
        });

    });

    router.route('/daycare/:daycareId').get(function (req, res, next) {


        Listing.findOne({
            _id: req.params.daycareId
        }, function (err, result) {
            if (err) {
                next(err);
            } else {
                res.send(result);
            }
        });
    });

    router.route('/all_reviews').get(function (req, res, next) {

        Review.find({
            $or: [{approved: "false"}, {approved: {$exists: false}}]
        }).populate('user_id', '_id photo email')
            .exec(function (err, result) {
                if (err) {
                    next(err);
                } else {
                    res.send(result);
                }
            });
    });

    router.route('/every_reviews').get(function (req, res, next) {
        logger.info("Getting All Daycare Reviews");
        Review.find({
            approved: {$exists: true}
        }, function (err, result) {
            if (err) {
                next(err);
            } else {
                res.send(result);
            }
        });
    });

    router.route('/saveSearch').post(function (req, res, next) {
        logger.info("Saving search : save Search ");
        var searchObj = req.body;
        var id = searchObj._id;
        searchObj.searchDate = Date.now();
        delete searchObj._id;
        Searches.update({
            _id: id
        }, searchObj, function (_err, _res) {
            if (_err) {
                next(_err);
            } else {
                res.send(_res);
            }
        });
    });

    router.route('/saveSearch/:filterId').delete(function (req, res, next) {

        logger.info("Deleting Search : saveSearc/filterId " + req.params.filterId );

        var id = req.params.filterId;

        Searches.findOneAndRemove({_id: id},
            function (__err, doc) {
                if (__err) throw __err;
                res.send();
            });
    });

    router.route('/saveSearch').put(function (req, res, next) {

        logger.info("Saving Search: put");
        var searchFilter = req.body;
        saveFilters(searchFilter);

    });

    router.route('/saveSearch/:userId/:searchTag').get(function (req, res, next) {

        logger.info("Getting Search: searchTag " +req.params.searchTag );
        if (req.params.searchTag === null || req.params.searchTag === 'null') {
            Searches.find({
                    userId: req.params.userId,
                    '$and': [
                        {searchTag: {'$exists': true}},
                        {searchTag: {'$ne': null}},
                        {searchTag: {'$ne': ""}}]
                }, null,
                {sort: {searchDate: -1}}, function (_err, _res) {
                    if (_err) {
                        next(_err);
                    } else {
                        res.send(_res);
                    }
                });
        } else {

            logger.info("Get user " + req.params.userId + " recent searches by Tag: " + paramTag);
            Searches.find({
                    userId: req.params.userId,
                    searchTag: req.params.searchTag
                }, null,
                {sort: {searchDate: -1}}, function (_err, _res) {
                    if (_err) {
                        next(_err);
                    } else {
                        res.send(_res);
                    }
                });
        }


    });

    router.route('/saveSearch/:userId').get(function (req, res, next) {
        Searches.count({userId: req.params.userId}, function (_err, _count) {
            if (_err) {
                throw _err;
            }
            logger.info("User: " + req.params.userId + " Recent#: " + _count);
            Searches.find({
                    userId: req.params.userId
                }, null,
                {sort: {searchDate: -1}}, function (_err, _res) {
                    if (_err) {
                        next(_err);
                    } else {
                        res.send(_res);
                    }
                });
        })
    });

    router.route('/saveSearch/:userId').post(function (req, res, next) {
        logger.info("POST saveSearch User: saveSearch/userId " + req.params.userId);
        Searches.find({
            userId: req.params.userId
        }, {queryJson:1},
        {sort: {searchDate: -1}}, function (_err, _res) {
            if (_err) {
                next(_err);
            } else {
                res.send(_res);
            }
        });
    });

    router.route("/favorites").post(function (req, res, next) {
        logger.info("Add Favorites!");

        var userId = req.body.userId;
        var favorites = req.body.favorites;

        User.update({
            _id: userId
        }, {
            $addToSet: {
                favorites: {listingId: favorites.listingId, name: favorites.name}
            }
        }, null, function (err, response) {
            if (err) {
                return next(err);
            }
            res.send(response);
        });


    });

    router.route("/favorites/:userId").get(function (req, res, next) {
        logger.info("Get Favorites!");

        var userId = req.params.userId;

        User.find({
            _id: userId
        }, 'favorites', function (err, response) {
            if (err) {
                return next(err);
            }
            res.json(response);
        });


    });

    router.route("/favorites/remove").post(function (req, res, next) {
        logger.info("Remove Favorite! " + JSON.stringify( req.body.favorites));
		
        var listingId = null;
		
		if(req.body.favorites.hasOwnProperty('_id'))
		{
			listingId = req.body.favorites._id;
		}else if(req.body.favorites.hasOwnProperty('listingId'))
		{
			listingId = req.body.favorites.listingId;
		}
		
        var userId = req.body.userId;       
        logger.info("listingId=>"+listingId);
        logger.info("userId=>"+userId);
        User.findByIdAndUpdate(
            userId,
            {
                $pull: {"favorites": {listingId: listingId}}
            },
            {safe: true, upsert: true, new : true},
            function(err, model) {
                if(err)console.log(err);
                res.send();
            }
        );
    });

    router.route("/clients/:providerId").get(function (req, res, next) {
        var providerId = req.params.providerId;

        logger.info("Get Clients of " + providerId + "!");

        Client.find({providerId:providerId},function(err,response){
            if(!err){               
                res.send(response);
            }else{
                logger.info("failed to get client: "+ providerId);
            }
        });
       
    });

    router.route("/client/student/:studentId").get(function(req,res,next){
        var studentId = req.params.studentId;

        logger.info("getStudent" + studentId + "!");

        Student.findOne({
            _id: studentId
        },function(err,student){
            if(err) res.send(500, { error: err });
            if(student){
                res.send(student);
            }
        });
    });

    router.route("/client/:clientId").get(function (req, res, next) {
        var clientId = req.params.clientId;

        logger.info("Get Client" + clientId + "!");

        Client.find({_id:clientId},
        function(err,response){

            if(!err){
                //logger.info("Client: "+JSON.stringify(response));
                var getStudent = function (studentId,callback){
                    //logger.info("getStudent: " + studentId);
                    Student.findOne({
                        _id: studentId
                    },callback);
                };

                var getGuardian = function(guardianId, callback){
                    //logger.info("getGuardian: " + guardianId);
                    Guardian.findOne({
                        _id: guardianId
                    },callback);
                };

                // multiple doc response
                var tasks = [];
                for (var i = response.length - 1; i >= 0; i--) {
                    var studentId = response[i].studentId;
                    var primaryGuardianId = response[i].primaryGuardianId;
                    var secondaryGuardianId = response[i].secondaryGuardianId;
                    var noSecondary = response[i].noSecondary;
                    tasks.push({
                        student:studentId,
                        primaryGuardian:primaryGuardianId,
                        secondaryGuardian:secondaryGuardianId,
                        client:response[i]});
                }

                async.map(tasks,
                    function(data,cb){
                        var retVal={};
                       
                        async.series({
                            student: function(_cb){
                                getStudent(data.student,_cb);
                            },
                            primaryGuardian: function(_cb){
                                getGuardian(data.primaryGuardian,_cb);
                            },
                            secondaryGuardian: function(_cb){
                                getGuardian(data.secondaryGuardian,_cb);
                            },
                            client: function(_cb) {
                                _cb(null,data.client);
                            }
                        },cb)
                    },
                    function(err,results){
                        console.log("Client: "+JSON.stringify(results));
                        res.status(200).json(results[0]);
                    });
            }else{
                logger.info("failed to get client: "+ clientId);
                return next(err);
            }


        });
       
    }).delete(function(req, res, next) {
        Client.findById(req.params.clientId, function(err, client) {
            if (err) {
                return next(err);
            }
            
            if (!client) {
                res.status(404).json({message: 'Client '+req.params.clientId+' not found'});
            } else {
                var tasks = [];

                if (client.studentId) {
                    tasks.push(function(cb) {
                        Student.findOneAndRemove({_id:client.studentId},cb);
                    });
                }
                if (client.primaryGuardianId) {
                    tasks.push(function(cb) {
                        Guardian.findOneAndRemove({_id:client.primaryGuardianId},cb);
                    });
                }
                if (client.secondaryGuardianId) {
                    tasks.push(function(cb) {
                        Guardian.findOneAndRemove({_id:client.secondaryGuardianId},cb);
                    });
                }

                async.series(tasks, function(err, results) {
                    if (err) {
                        return next(err);
                    }

                    client.remove(function(err, data) {
                        if (err) {
                            return next(err);
                        }
                        res.json(data);
                    });
                });
            }
        });
    });

    router.route("/clients/:providerId/:daycareId").get(function (req, res, next) {

        var providerId = req.params.providerId;
        var daycareId = req.params.daycareId;

        logger.info("Get Clients: " + providerId + " from daycare: "+daycareId);

        Client.find({providerId:providerId,daycareId:daycareId},
        function(err,response){

            if(!err){
                // logger.info("Clients count: " + response.length);

                var getStudent = function (studentId,callback){
                    //logger.info("getStudent: " + studentId);
                    Student.findOne({
                        _id: studentId
                    }).populate('class').exec(callback);
                };

                var getGuardian = function(guardianId, callback){
                    //logger.info("getGuardian: " + guardianId);
                    Guardian.findOne({
                        _id: guardianId
                    },callback);
                };

                // multiple doc response
                var tasks = [];
                for (var i = response.length - 1; i >= 0; i--) {
                    var _id = response[i]._id;
                    var studentId = response[i].studentId;
                    var primaryGuardianId = response[i].primaryGuardianId;
                    var secondaryGuardianId = response[i].secondaryGuardianId;
                    tasks.push(
                        {_id:_id,student:studentId,guardian:primaryGuardianId,secondaryGuardian:secondaryGuardianId}
                    );


                }

                //logger.info("Tasks: "+tasks.length );

                async.map(tasks,
                    function(data,cb){
                        var retVal={};
                       
                        async.series({
                            _id: function(_cb) {
                                _cb(null,data._id);
                            },
                            student: function(_cb){
                                getStudent(data.student,_cb);
                            },
                            guardian: function(_cb){
                                getGuardian(data.guardian,_cb);
                            },
                            secondaryGuardian: function(_cb){
                                getGuardian(data.secondaryGuardian,_cb);
                            }
                        },cb)
                    },
                    function(err,results){
                        res.send(results);
                    });
            }else{
                logger.info("failed to get client: "+ providerId + " from daycare: "+daycareId);
                return next(err);
            }


        });
       
    });

    router.route("/clients/add").post(function (req, res, next) {
        var providerId = req.body.providerId;
        var daycareId = req.body.daycareId;

        logger.info("Save Client for provider: "+providerId + " daycare: "+daycareId);

        var newClient = new Client(req.body);

        newClient.save(function(err,response){
            if(err){
                return next(err);
            }else{
                res.send(response);
            }
        })
        
    });

    router.route("/clients/update").post(function (req, res, next) {
        var clientId = req.body.clientId;
        delete req.body.clientId;
        if (req.body.noSecondary) {
            req.body.secondaryGuardianId = null;
        }

        logger.info("update data: "+JSON.stringify(req.body));

        Client.findOneAndUpdate( {_id:clientId}, req.body, {upsert:false}, function(err, doc){
            if (err) return res.send(500, { error: err });
            return res.send("client updated");
        });

        /*Client.findOne({ _id: clientId }, function (err, doc){
            if(err){
                logger.info("ClientUpdateFailed !");
                return next(err);

            }
            doc.studentId = req.body.studentId;
            doc.primaryGuardianId = req.body.primaryGuardianId;
            doc.secondaryGuardianId = req.body.secondaryGuardianId;

            doc.visits.$inc();
            doc.save();
        });*/

    });

    router.route("/clients/student/add").post(function (req, res, next) {
        var clientId = req.body.clientId;

        logger.info("Add Client to " + clientId + "!");

        var student = new Student(req.body);

        student.save( function( err, response) {
            if (err) {
                return next(err);
            }else{
                res.send(response);
            }
        });
    });

    router.route("/clients/guardian/add").post(function (req, res, next) {
        //var providerId = req.params.providerId;
        var providerId = req.body.providerId;

        logger.info("Saving Client's Guardian of" + JSON.stringify(req.body) + "!");

        var guardian = new Guardian(req.body);

        guardian.save( function( err,response ) {
            if (err) {
                logger.info("No Guardian !");
                return next(err);
            }else{
                logger.info("New Guardian !");
                res.send(response);
            }
        });
    });

    router.route("/clients/student/update").post(function (req, res, next) {
        var studentId = req.body._id;
        delete req.body._id;

        logger.info("Update Student: " + studentId);

        Student.update({
            _id:studentId
        }, req.body,{}, 
        function( err,response ) {
            if (err) {
                logger.info("No Student Updated!");
                return next(err);
            }else{
                logger.info("Student Updated!");
                res.send(response);
            }
        });
        
    });

    router.route("/clients/guardian/update").post(function (req, res, next) {
        var guardianId = req.body._id;
        delete req.body._id;

        logger.info("Update Guardian: " + guardianId);

        Guardian.update({
            _id:guardianId
        }, req.body,{}, 
        function( err,response ) {
            if (err) {
                logger.info("No Guardian Updated!");
                return next(err);
            }else{
                logger.info("Guardian Updated!");
                res.send(response);
            }
        });

    });

    router.route("/clients/guardian/:guardianId").delete(function(req, res, next) {
        var guardianId = req.params.guardianId;

        Guardian.remove({_id: guardianId}, function(err, response) {
            if (err) {
                return next(err);
            }

            res.send(response);
        });
    });

    router.route("/class/:providerId").get(function (req, res, next) {
        Class.find({providerId:req.params.providerId, listingId: req.query.listingId},function(err,classes){

            if(err) res.send(err);
            else if(classes) res.send(classes);
        })
    });

    router.route("/class/add").post(function (req, res, next) {
        logger.info("Saving: " + JSON.stringify(req.body));
        var newClass = new Class( req.body );

        newClass.save(function(err,response){
            if(err)res.send(err);
            else res.send(response);
        })
    });

    router.route('/class/:classId').put(function (req, res, next) {
        Class.findByIdAndUpdate(req.params.classId, req.body, function(err, result) {
            if (err) return next(err);

            res.json(result);
        });
    }).delete(function (req, res, next) {
        Class.findByIdAndRemove(req.params.classId, function (err, result) {
            if (err) return next(err);

            res.json(result);
        });
    });

    router.route('/classroom/:classId').get(function (req, res, next) {
        Class.findById(req.params.classId, function(err, classData) {
            if (err) return next(err);

            res.json(classData);
        });
    });

    router.route("/staff/addStaff").post(function (req, res, next) {
        var body = req.body;

        logger.info("Staff for: "+body.listingId);
        //var userId = req.body.userId;
        //logger.info("Add Staff for " + userId);
        var newStaff = new Staff(req.body);
        newStaff.save(req.body,function(err,response){
            if(err){
                logger.info("Error Staff: "+JSON.stringify(err));
                res.send(err);
            }
            if(response){
                logger.info("Staff Saved");
                res.send(response);

            }
        });
    });

    router.route("/staff/:listingId").get(function (req, res, next) {
        var listingId = req.params.listingId;
        logger.info("Get Staff of " + listingId);

        Staff.find({
            listingId: listingId
        },
        function (err, response) {
            if (err) {
                return next(err);
            }
            res.send(response);
        });

        /*User.find({
            _id: userId,
            'staff.listing_id': listingId
        }, 'staff', function (err, response) {
            if (err) {
                return next(err);
            }
            res.send(response);
        });*/
    });

    router.route("/staffById/:staffId").get(function (req, res, next) {
        var staffId = req.params.staffId;
        logger.info("Get Staff by id " + staffId);

        Staff.findById(staffId,
        function (err, response) {
            if (err) {
                return next(err);
            }
            res.send(response);
        });
    }).delete(function(req, res, next) {
        var staffId = req.params.staffId;
        logger.info("Remove Staff with id " + staffId);

        Staff.findOneAndRemove({_id: staffId}, function(err, staff) {
            if (err) {
                return next(err);
            }

            res.json(staff);
        });
    });

    // router.route("/staff/removeStaff").post(function (req, res, next) {
    //     var userId = req.body.userId;
    //     var listingId = req.body.listingId;
    //     var staffId = req.body.staffId;
    //     logger.info("Remove Staff From " + userId);

    //     User.update({
    //         _id: userId
    //     },
    //     {
    //         "$pull": { "staff": { "listing_id": listingId, "_id": staffId} }
    //     },
    //     null
    //     , function (err, response) {
    //         if (err) {
    //             return next(err);
    //         }
    //         res.send(response);
    //     });
    // });

    router.route("/staff/updateStaff").post(function (req, res, next) {
        var staffObj = req.body.staffObj;
        var staffId = staffObj._id;
        logger.info("Update Staff " + staffId);
        // delete _id field because mongo won't allow _id update
        delete staffObj._id;

        Staff.update({
            _id: staffId,
        },
        staffObj,
        null,
        function (err, response) {
            if (err) {
                return next(err);
            }
            res.send(response);
        });
    });

    router.route("/appointment").post(function (req, res, next) {

        var listingId = req.body.listing;
        var listingName = req.body.listingName;
        var userId = req.body.user;
        var date = req.body.date;
        var emailDate = req.body.emailDate;

        logger.info("Save Appointment for " + listingId + " w/ " + userId + "@" + date);
        var appointment = new Appointment(req.body);

        appointment.save( function (err, response) {

            if (err) {
                return next(err);
            }else{
                User.findById(userId, function(err, user) {
                    if (err) {
                        return next(err);
                    }
                    sendAppointmentEmail(user, emailDate, listingName, listingId, undefined, 'pending');
                });
                res.send(response);
                logger.info("Successful appointment insert " + JSON.stringify(response));
            }

        });


    }).get(function (req, res, next) {
        var query = {};
        if (req.query.userId) {
            query.user = req.query.userId;
        }
        if (req.query.listingId) {
            query.listing = req.query.listingId;
        }
        
        Appointment.find(query)
            .populate('listing')
            .exec(function(err, appointments) {
                if (err) {
                return next(err);
                }
                res.json(appointments);
            });
    });
    
    router.route("/appointment/:appointmentId").get(function (req, res, next) {
        Appointment.findById(req.params.appointmentId)
            .populate('listing')
            .exec(function(err, appointment) {
                if (err) {
                    return next(err);
                }
                res.json(appointment);
            });
    }).put(function (req, res, next) {
        var listingId = req.body.listing;
        var listingName = req.body.listingName;
        var userId = req.body.user;
        var date = req.body.date;
        var emailDate = req.body.emailDate;
        var status = req.body.status;

        var data = {};
        if (date) data.date = date;
        if (status) data.status = status;

        Appointment.findByIdAndUpdate(req.params.appointmentId, data, function(err, result) {
            if (err) {
                return next(err);
            }

            User.findById(userId, function(err, user) {
                if (err) {
                    return next(err);
                }
                sendAppointmentEmail(user, emailDate, listingName, listingId, req.params.appointmentId, data.status);
            });

            res.json(result);
        });
    });

    router.route("/article").post(function (req, res, next) {
        var body = req.body;
        var content = body.content;
        var user_id = body.user_id;
        var tags = body.tags;
        var title = body.title;

        var articles = new Articles(req.body);
        articles.save({
                user_id: user_id,
                content: content,
                tags:tags 
            }, function( error, docs) {
        });
    });
    router.route("/article/:userid").get(function (req, res, next) {
        var userid = req.params.userid;
        Articles.find({user_id:userid}, {}, {})
            .exec(function (err, article) {
                if (!err) {
                    res.json({
                        searchResult: article
                    });
                } else {
                    return next(err);
                }
            });
    });

    router.route("/article/delete").post(function (req, res, next) {
         var body = req.body;
         var id = body.id;
         Articles.remove({_id: id}, function(err, result){

         })

    });

    router.route("/accreditation").get(function (req, res, next) {
        var query = {};
        if (req.query.goldSeal) {
            query.goldSeal = req.query.goldSeal;
        }
        Accreditation.find(query, function(err, accreditations) {
            if (err) return next(err);

            res.json(accreditations);
        });
    });

    router.route("/curriculum").get(function (req, res, next) {
        Curriculum.find({origin: 'db'}, function(err, curriculums) {
            if (err) return next(err);

            res.json(curriculums);
        });
    });

    router.route("/document/prepare").post(function (req, res, next) {
        logger.info("Preparing invitation to edit" );

        var EmailTemplate = require('email-templates').EmailTemplate;
        
        var emailTemplatesDir = path.resolve(__dirname, '..', 'emails', 'form-edit-invite');

        var editInvite = new EmailTemplate(emailTemplatesDir);
        
        var providerId = req.body.providerId;
        var providerEmail = req.body.providerEmail;
        var recipient = req.body.recipient;
        var form = req.body.form;

        logger.info("providerEmail:"+providerEmail);
        logger.info("providerId: "+providerId);
        logger.info("Recipient: "+JSON.stringify(recipient));
        logger.info("Form: "+form);

        loopOnArrayWithDelay(recipient, 3000, 0, function(e,i){

            console.log("processData " + i);
            getData(recipient[i],function(data){

                console.log("Extracted: "+JSON.stringify(data));

                var jsonData = {
                    recipient: data.recipient,
                    provider: data.provider,
                    link_edit_enrollment : null,
                    link_edit_emergency : null,
                    link_edit_medauth : null,
                    recipientEmail: data.recipientEmail,
                    providerEmail: providerEmail
                };

                var userId = data.recipientId; // clientId
                var studentId = data.studentId;
                var recipientEmail = data.recipientEmail;

                var tasks = {

                };
                console.log("Preparing data for: "+JSON.stringify(jsonData));

                if(form.indexOf('enrollment')!= -1){
                    tasks.enrollment = function(callback){
                        createBlankDoc(userId,studentId,'enrollment', recipientEmail, providerEmail, function(err,doc){
                            callback(null,doc);
                        });
                    }

                }
                if(form.indexOf('emergency')!= -1){
                    tasks.emergency = function(callback){
                        createBlankDoc(userId,studentId,'emergencycard', recipientEmail, providerEmail, function(err,doc){
                            callback(null,doc);
                        });
                    }

                }
                if(form.indexOf('medauth')!= -1){
                    tasks.medauth = function(callback){
                        createBlankDoc(userId,studentId,'medauth', recipientEmail, providerEmail, function(err,doc){
                            callback(null,doc);
                        });
                    }

                }
                async.series(
                    tasks
                    ,function(err,results){
                        console.log(results);

                        if(results.enrollment){
                            var enrollId = results.enrollment._id;
                            jsonData.link_edit_enrollment = HOST_SERVER+'/#/document/edit/enroll/'+userId+'/'+enrollId+'?email='+encodeURIComponent(recipientEmail);
                        }
                        if(results.emergency){
                            var emergencyId = results.emergency._id;
                            jsonData.link_edit_emergency = HOST_SERVER+'/#/document/edit/emergency/'+userId+'/'+emergencyId+'?email='+encodeURIComponent(recipientEmail);
                        }
                        if(results.medauth){
                            var medauthId = results.medauth._id;
                            jsonData.link_edit_medauth = HOST_SERVER+'/#/document/edit/medauth/'+userId+'/'+medauthId+'?email='+encodeURIComponent(recipientEmail);
                        }

                        console.log("Sending Data:"+JSON.stringify(jsonData));
                        console.log("ToEmail:"+recipientEmail);
                        //console.log("Template:"+emailTemplatesDir);

                        editInvite.render(jsonData, function(_err, _results) {
                            //console.log("Sent:"+JSON.stringify(_results));
                            var mailOptions = {
                                from: 'Ratingsville <ratingsville@gmail.com>',
                                to: recipientEmail,
                                subject: 'Ratingsville | Invitation to Edit Forms' ,
                                html: _results.html
                            };
                            //console.log("mailOptions:"+JSON.stringify(mailOptions));

                            transporter.sendMail(mailOptions, function (_error, _response) {
                                if (_error) {
                                    console.log(_error);
                                } else {
                                    console.log("Edit Form sent: " + JSON.stringify(_response));
                                }
                                //transporter.close(); // shut down the connection pool, no more messages
                            });

                        });
                    }
                );

            });
            }
        , function (i) {

            logger.info("Completed iteration");
            res.send({data:"SENDING EMAIL"});

        });


        function loopOnArrayWithDelay(theArray, delayAmount, i, theFunction, onComplete) {

            // logger.info("delayAmount in milleseconds " + delayAmount);

            if (i < theArray.length && typeof delayAmount == 'number') {

                console.log("i " + i);

                theFunction(theArray[i], i);

                setTimeout(function () {

                    loopOnArrayWithDelay(theArray, delayAmount, (i + 1), theFunction, onComplete)
                }, delayAmount);

            } else {

                onComplete(i);
                /*
                 * If the loop is complete
                 * it will kill the process
                 */
                //done();
            }
        }


        function createBlankDoc(userId,studentId,type,recipientEmail, providerEmail, callback){
            logger.info("Saving: guardianId--"+ userId+": studentId--"+studentId+": type--"+type);

            Document.findOne({userId:userId, type:type},null,function(err,doc){

                var newDoc = new Document({
                    userId: userId,
                    studentId: studentId,
                    type: type,
                    recipientEmail:recipientEmail,
                    providerEmail: providerEmail
                });

                if(doc){
                    newDoc = doc;
                    logger.info("Found the document: " + type);
                } else {
                    logger.info("Creating new document: " + type);
                }

                newDoc.save().then(function(doc){
                    // logger.info("Saved " + newDoc);
                    if(!doc){
                        callback(err,null);

                    }else{
                        callback(null,doc);
                    }
                });

            });
        }

        function getData(recipient,callback){
            var retVal = {
                recipientEmail: null,
                recipientId: null,
                recipient: null,
                providerId: null,
                provider: null,
                studentId: null
            };

            Client.findOne({_id:recipient.clientId},null,function(err,response){
                if (err){
                    logger.info(err);
                    return next(err);
                }

                logger.info("Response from clients findone: " + JSON.stringify(response));

                if(response){
                    var primaryGuardianId = response.primaryGuardianId;
                    var daycareId = response.daycareId;
                    retVal.studentId = response.studentId;

                    logger.info("Details - studentId: "+ response.studentId + " primaryGuardianId: "+primaryGuardianId +  " daycareId: "+daycareId );

                    Guardian.findOne({_id: primaryGuardianId},null,function(_err,_response){

                        if (_err){
                            logger.info(_err);
                            return next(_err);
                        }

                        if(_response){
                            var recipient_name = _response.firstName+" "+_response.lastName;
                            var recipientEmail = _response.email;
                            var recipientId = recipient.clientId;

                            logger.info("Details recipient_name: "+recipient_name + " recipientEmail: "+recipientEmail + " recipientId: "+recipientId);

                            retVal.recipient = recipient_name;
                            retVal.recipientEmail = recipientEmail;
                            retVal.recipientId = recipientId;


                            Listing.findOne({_id:daycareId},function(__err,__response){
                                if (__err){
                                    logger.info(__err);
                                    return next(__err);
                                }

                                if(__response){
                                    var provider_name = __response.name;
                                    var providerId = __response._id;

                                    logger.info("Details provider_name: "+provider_name + " providerId: "+providerId);

                                    retVal.provider = provider_name;
                                    retVal.providerId = providerId;

                                    callback(retVal);
                                    return 0;
                                }else if(!__response){
                                    logger.info("ListingId not Found");
                                }

                            });
                        }else if(!_response){
                            logger.info("GuardianId not Found");
                        }


                    });
                }else if(!response){
                    logger.info("ClientId not Found");
                }

            })
        }
    });
    
    router.route("/document/enroll").post(function (req, res, next) {
        logger.info("Saving Enrollment");

        var body = req.body;
        var userId = req.body.userId;

        var newDocument = new Document(req.body);

        newDocument.save(function(err,doc){
            if(err) res.status(500).send(err);
            if(doc){
                generatePdf(doc,'enrollment',function(_err,_res){
                    if(_err) res.status(500).send(_err);
                    if(_res){
                        doc.update({pdfPath: _res.filename, pdfDate: Date.now()}, function(__err, __res) {
                            if(err) res.status(500).send(__err);
                            else res.send(_res);
                        });
                    }
                });
            }
        });
    });

    router.route("/document/enroll/update").post(function (req, res, next) {

        logger.info("Updating Enrollment ");

        var body = req.body;
        var userId = req.body.userId;
        var docId = req.body._id;
        var newDocument = new Document(req.body);

        Document.findById(docId,function(err,doc){
            if(err) res.status(500).send(err);

            if(doc){

                var oldPath = doc.pdfPath;
                var oldDate = doc.pdfDate;
                var oldVersion = doc.version;
                var newVersion = doc.version + 1;
                doc.version = newVersion;

                generatePdf(doc,'enrollment',function(_err,_res){
                    if(_err) res.status(500).send(_err);
                    if(_res){
                        doc.update({pdfPath: _res.filename, pdfDate: Date.now(), version: newVersion,
                            firstName: newDocument.firstName, middleName: newDocument.middleName,
                            lastName: newDocument.lastName, birth: newDocument.birth,
                            pobox: newDocument.pobox, street: newDocument.street,
                            zip: newDocument.zip, city: newDocument.city, state: newDocument.state,
                            contact: newDocument.contact, motherName: newDocument.motherName,
                            motherAddress: newDocument.motherAddress, motherCity: newDocument.motherCity,
                            motherState: newDocument.motherState, motherHomeNum: newDocument.motherHomeNum,
                            motherWorkNum: newDocument.motherWorkNum, motherMobileNum: newDocument.motherMobileNum,
                            fatherName: newDocument.fatherName, fatherAddress: newDocument.fatherAddress,
                            fatherCity: newDocument.fatherCity, fatherState: newDocument.fatherState,
                            fatherHomeNum: newDocument.fatherHomeNum, fatherWorkNum: newDocument.fatherWorkNum,
                            fatherMobileNum: newDocument.fatherMobileNum, note: newDocument.note, medicalData : newDocument.medicalData,
                            doctor: newDocument.doctor, careDay:newDocument.careDay, careMeal: newDocument.careMeal,
                            nickName: newDocument.nickName, gender: newDocument.gender
                        }, function(__err, __res) {
                            if(__err) res.status(500).send(__err);
                            else {
                                saveDocumentHistory(doc);
                                res.send(_res);
                            }
                        });
                    }
                });
            }
            if(!doc){
                logger.info('UpdateFailed');
                res.status(500).send(err);
            }
        });


    });

    router.route("/document/enroll/:userId/:docId").get(function (req, res, next) {
        logger.info("Getting Enrollment");
        var userId = req.params.userId;
        var docId = req.params.docId;
        Document.findOne({_id:docId,userId:userId,type:'enrollment'},null,function(err,doc){
            if(err) res.status(500).send(err);
            if(doc){
                res.send({data:doc});
            }
            if(!doc){
                res.send({data:null});
            }
        });
    });

    router.route("/document/medauth/:userId/:docId").get(function (req, res, next) {
        logger.info("Getting MedAuth");
        var userId = req.params.userId;
        var docId = req.params.docId;
        Document.findOne({_id:docId,userId:userId,type:'medauth'},null,function(err,doc){
            if(err) res.status(500).send(err);

            if(doc){
                res.send({data:doc});
            }

            if(!doc){
                res.send({data:null});
            }
        });
    });

    router.route("/document/emergency/:userId/:docId").get(function (req, res, next) {

        var userId = req.params.userId;
        var docId = req.params.docId;
        Document.findOne({_id:docId,userId:userId,type:'emergencycard'},null,function(err,doc){
            if(err) res.status(500).send(err);
            if(doc){
                res.send({data:doc});
            }
            if(!doc){
                res.send({data:null});
            }
        });
    });

    router.route("/document/emergencycard").post(function (req, res, next) {
        logger.info("Saving Emergency Card");
        
        var body = req.body;
        var userId = req.body.userId;
        var newDocument = new Document(req.body);

        newDocument.save(function(err,doc){
            if(err) res.status(500).send(err);
            if(doc){
                
                generatePdf(doc,'emergencycard',function(_err,_res){
                    if(_err) res.status(500).send(_err);
                    if(_res){

                       doc.update({pdfPath: _res.filename, pdfDate: Date.now()}, function(__err, __res) {
                            if(__err) res.status(500).send(__err);
                            else res.send(_res);
                        });
                    }
                });
            }
        });
    });

    router.route("/document/emergencycard/update").post(function (req, res, next) {

        console.log("Regenerate PDF: " + JSON.stringify(req.body));
        var body = req.body;
        var userId = req.body.userId;
        var docId = req.body._id;
        var newDocument = new Document(req.body);

        Document.findById(docId,function(err,doc){
            if(err) res.status(500).send(err);

            if(doc){

                var oldPath = doc.pdfPath;
                var oldDate = doc.pdfDate;
                var oldVersion = doc.version;
                var newVersion = doc.version + 1;
                doc.version = newVersion;

                generatePdf(doc,'emergencycard',function(_err,_res){
                    if(_err) res.status(500).send(_err);
                    if(_res){
                        doc.update({pdfPath: _res.filename, pdfDate: Date.now(), version: newVersion,
                            firstName: newDocument.firstName, middleName: newDocument.middleName,
                            lastName: newDocument.lastName, birth: newDocument.birth,
                            pobox: newDocument.pobox, street: newDocument.street,
                            zip: newDocument.zip, city: newDocument.city, state: newDocument.state,
                            contact: newDocument.contact, motherName: newDocument.motherName,
                            motherAddress: newDocument.motherAddress, motherCity: newDocument.motherCity,
                            motherState: newDocument.motherState, motherHomeNum: newDocument.motherHomeNum,
                            motherWorkNum: newDocument.motherWorkNum, motherMobileNum: newDocument.motherMobileNum,
                            fatherName: newDocument.fatherName, fatherAddress: newDocument.fatherAddress,
                            fatherCity: newDocument.fatherCity, fatherState: newDocument.fatherState,
                            fatherHomeNum: newDocument.fatherHomeNum, fatherWorkNum: newDocument.fatherWorkNum,
                            fatherMobileNum: newDocument.fatherMobileNum, note: newDocument.note, medicalData : newDocument.medicalData
                        }, function(__err, __res) {
                            if(__err) res.status(500).send(__err);
                            else {
                                saveDocumentHistory(doc);
                                res.send(_res);
                            }
                        });
                    }
                });
            }
            if(!doc){
                logger.info('UpdateFailed');
                res.status(500).send(err);
            }
        });
    });

    router.route("/document/medauth").post(function (req, res, next) {
        logger.info("Saving Autorization for Medication");
        var body = req.body;
        var userId = req.body.userId;
        var newDocument = new Document(req.body);
        
        newDocument.save(function(err,doc){
            if(err) res.status(500).send(err);
            if(doc){
                generatePdf(doc,'medauth',function(_err,_res){
                    if(_err) res.status(500).send(_err);
                    if(_res){
                        doc.update({pdfPath: _res.filename, pdfDate: Date.now()}, function(__err, __res) {
                            if(err) res.status(500).send(__err);
                            else res.send(_res);
                        });
                    }
                });
            }
        });
    });

    router.route("/document/medauth/update").post(function (req, res, next) {
        logger.info("Saving Emergency Card " + req.body );

        var body = req.body;
        var userId = req.body.userId;
        var docId = req.body._id;
        var newDocument = new Document(req.body);

        Document.findById(docId,function(err,doc){
            if(err) res.status(500).send(err);

            if(doc){

                var oldPath = doc.pdfPath;
                var oldDate = doc.pdfDate;
                var oldVersion = doc.version;
                var newVersion = doc.version + 1;
                doc.version = newVersion;

                generatePdf(doc,'medauth',function(_err,_res){
                    if(_err) res.status(500).send(_err);
                    if(_res){
                        doc.update({pdfPath: _res.filename, pdfDate: Date.now(), version: newVersion,
                            firstName: newDocument.firstName, middleName: newDocument.middleName,
                            lastName: newDocument.lastName, birth: newDocument.birth,
                            pobox: newDocument.pobox, street: newDocument.street,
                            zip: newDocument.zip, city: newDocument.city, state: newDocument.state,
                            contact: newDocument.contact, motherName: newDocument.motherName,
                            motherAddress: newDocument.motherAddress, motherCity: newDocument.motherCity,
                            motherState: newDocument.motherState, motherHomeNum: newDocument.motherHomeNum,
                            motherWorkNum: newDocument.motherWorkNum, motherMobileNum: newDocument.motherMobileNum,
                            fatherName: newDocument.fatherName, fatherAddress: newDocument.fatherAddress,
                            fatherCity: newDocument.fatherCity, fatherState: newDocument.fatherState,
                            fatherHomeNum: newDocument.fatherHomeNum, fatherWorkNum: newDocument.fatherWorkNum,
                            fatherMobileNum: newDocument.fatherMobileNum, note: newDocument.note, medicalData : newDocument.medicalData,
                            doctor: newDocument.doctor, careDay:newDocument.careDay, careMeal: newDocument.careMeal
                        }, function(__err, __res) {
                            if(__err) res.status(500).send(__err);
                            else {
                                saveDocumentHistory(doc);
                                res.send(_res);
                            }
                        });
                    }
                });
            }
            if(!doc){
                logger.info('UpdateFailed');
                res.status(500).send(err);
            }
        });
    });

    router.route("/document/student/:studentId").get(function(req, res, next) {
        Document.find({studentId: req.params.studentId, pdfPath: {$exists: true}}, function(err, docs) {
            if (err) {
                return next(err);
            }
            res.json(docs);
        });
    });

    router.route("/document/:docId").delete(function(req, res, next) {
        Document.findOneAndRemove({_id: req.params.docId}, function(err, removedDoc) {
            if (err) {
                return next(err);
            }
            res.json(removedDoc);
        });
    });

    router.route("/document/history/:studentId/:docType").get(function (req, res, next) {

        var studentId = req.params.studentId;
        var docType = req.params.docType;
        logger.info("Getting Document History from Server " + studentId );

        DocumentHst.find({studentId:studentId,type:docType, pdfPath:{$ne : null}},null,function(err,docs){
            if(err) res.status(500).send(err);
            if(docs){
                res.json(docs);
            }
        });
    });

    router.route("/downloadpdf/:clientId/:docType").get(function (req, res, next) {

        // extrapolate document owner (userId) from client table (userId references)
        var clientId = req.params.clientId;
        var docType =  req.params.docType;
        logger.info("PDF Download Request: %s : %s",clientId,docType);

        Client.findOne(
            {_id:clientId},
            null,
            function(err,client){
                if (err){
                    logger.info(err);
                    res.status(404).send();
                }
                if(client){
                    var query = {};

                    if(client.noSecondary){
                        var primaryGuardianId = client.primaryGuardianId;

                        query = { userId : primaryGuardianId };
                    }else if(!client.noSecondary){
                        var primaryGuardianId = client.primaryGuardianId;
                        var secondaryGuardianId  = client.secondaryGuardianId;

                        query = { 
                            userId: {'$in': [ primaryGuardianId, secondaryGuardianId ]}
                        };
                    }
                    Document.findOne(query,
                        null,
                        function(_err,doc){
                            if (_err){
                                logger.info(err);
                                res.status(404).send();
                                return next(err);
                            }
                            if(doc){
                                var filename = docType+"_"+doc.userId+"_"+doc._id+".pdf";
                                var download_path = path.join(__dirname, "..", "documents/pdf/", filename);
                                logger.info("Downloading "+download_path);
                                res.download(download_path);
                                //res.send({data:download_path});

                            }
                            if(!doc){
                                res.send(null);
                            }

                        });
                }
            });


        /*if(filename){
            //var pdfStreamPath = path.join(location);
            var download_path = path.join(__dirname, "..", "documents/pdf/", filename);
            logger.info("Downloading "+download_path);
            res.download(download_path);
        }else{
            res.status(404).send();
        }*/
        
    });

    router.route("/downloadpdf/:filename").get(function (req, res, next) {
        var filename = req.params.filename;
        logger.info("PDF Download Request: "+filename);

        if(filename){
            //var pdfStreamPath = path.join(location);
            var download_path = path.join(__dirname, "..", "documents/pdf/", filename);
            logger.info("Downloading "+download_path);
            res.download(download_path);
        }else{
            res.status(404).send();
        }
    });

    router.route("/downloadpdf/enrollment/:filename").get(function (req, res, next) {
        var filename = req.params.filename;
        logger.info("PDF Download Request: "+filename);

        if(filename){
            //var pdfStreamPath = path.join(location);
            var download_path = path.join(__dirname, "..", "documents/pdf/", filename);
            logger.info("Downloading "+download_path);
            res.download(download_path);
        }else{
            res.status(404).send();
        }
    });

    router.route("/printpdf/:filename").get(function(req, res, next) {
        var filename = req.params.filename;
        logger.info("PDF Print Request: "+filename);

        if(filename){
            pdfGenerator.getPrintPdf(filename, function(err, filenamePrintPdf) {
                if (err) return next(err);

                var download_path = path.join(__dirname, "..", "documents/pdf/", filenamePrintPdf);
                logger.info("Printing "+download_path);
                res.download(download_path);
            });
        }else{
            res.status(404).send(filename + " not found");
        }
    });

    router.route("/subcription/charge")
        .post(function(req, res, next) {

        })
        .get(function(req, res, next) {

        });

    router.route("/broadcast/:type").get(function (req, res, next) {
        logger.info("Getting all Broadcast");        
        var bcType = req.params.type;

        Broadcast.find({type:bcType, active:true},function(err,bc){
            if(!err&&bc){
                logger.info("Sending all Broadcast " + bcType);
                return res.send(bc);
            }else{
                logger.info("ERROR Getting all Broadcast");
                return next(err);
            }
        }); 
    });

    router.route("/broadcast").post(function (req, res, next) {
        logger.info("Inserting Broadcast");

        var broadcast = new Broadcast(req.body);

        logger.info("POST /broadcast " + JSON.stringify(broadcast));

        broadcast.save(function (err, doc) {
            if (err) {
                next(err);
            } else {
                res.send(doc);
            }
        });
    });

    // router.route("/edit_account_check_numbers").post(function(req, res, next) {
    //     console.log(req.body);
    //     User.findOne({
    //         mobileNumber:{
    //             $in: [ req.body.phoneNumber, req.body.workNumber ]
    //         }
    //     }, function (err, data) {
    //         if(err) {
    //             return next(err);
    //         }
    //         else if (data) {
    //             res.status(508).json({
    //                 message: 'Home/Work Number already in use! Try a different one.'
    //             });
    //         }
    //     })
    // });

    router.route('/subscribe').post(function (req, res, next) {
        console.log('Calling SUBSCRIBE %j', req.body);

        // secret key
        var stripe = require('stripe')(config.test_api_key_secret);
        var stripeTokenId = (req.body !== undefined ? req.body.stripeDetails.id : '');
        var customerEmail = (req.body !== undefined ? req.body.email : '');
        var subscriptionPlan = (req.body !== undefined ? req.body.plan : '');

        // create customer profile then subscribe into plan
        // customer will be automatically billed on date of creation
        // then will be billed on the next cycle until the subscription is cancelled
        stripe.customers.create(
            { email: customerEmail, plan: subscriptionPlan, card: stripeTokenId },
            function(err, customer) {
              if (err) return next(err);
              var customerId = customer.id;
              var subscriptionDetails = customer.subscriptions.data[0];
              var subscriptionId = subscriptionDetails.id;
              var subscriptionStatus = subscriptionDetails.status;
              var planId = subscriptionDetails.plan.id;
              var planAmt = subscriptionDetails.plan.amount;              ;
              var planCurrency = subscriptionDetails.plan.urrency;
              
              // Save your details to database

              // Is this the correct response?
              res.send(customer);
            }
        );
    });

    // use this url to receive stripe webhook events
    router.route('/stripe/events').post(function(req, res, next) {
        var event_json = req.body;
        console.log('event_json', event_json);

        // only subscribe to the subscription-related events

        // return a 200 status code as required by Stripe
        res.send(200);
    });

    router.route("/messageupdate").post(Message.update);
    router.route("/message").post(saveMsgAndNotifyAdmin); // don't delete
    router.route("/download-listing").get(ListingController.createPdf); // don't delete
    router.route("/downloadpdf/emergencycard").get(ListingController.downloadPdf_emergencyCard);
    router.route("/downloadpdf/AccidentIncidentreport").get(ListingController.downloadPdf_AccidentIncidentreport);
    router.route("/downloadpdf/ApplicationforEnrollment").get(ListingController.downloadPdf_ApplicationforEnrollment);
    router.route("/downloadpdf/AuthorizationForMedication").get(ListingController.downloadPdf_AuthorizationForMedication);
    router.route("/downloadpdf/FreeandReducedPriceMeal").get(ListingController.downloadPdf_FreeandReducedPriceMeal);
    router.route("/downloadpdf/Infantfeeding").get(ListingController.downloadPdf_Infantfeeding);
    router.route("/downloadpdf/MedicalStatementandDietaryConditions").get(ListingController.downloadPdf_MedicalStatementandDietaryConditions);
    router.route("/sessionsave").post(saveSession);
    router.route("/sessiondelete").post(deleteSession);

    return router;
};

function clearLock(email) {
    logger.info("Unlock Email: " + email);

    LoginAttempt.findOne({
        email: email,
        is_resolved: false
    }, function (err, existingAttempt) {
        if (err) {
            return next(err);
        }

        if (!existingAttempt) {
            console.info('No locked attempts found for this email: ' + email);
        } else {
            existingAttempt.is_resolved = true;
            existingAttempt.save();
        }
    });

}

function computeAverageRatings(listingId){
    Review.aggregate([
        {$match: {daycare_id:listingId,$or:[{approved:"true"},{approved:true}]}},
        {$sort: {dateSaved:-1}},
        {$group: {_id:"$user_id",latestReview:{$first:"$$ROOT"}}}
    ]).cursor({}).exec().toArray(function(err,res){
        if(err){
            logger.info("### Review find ListingId: "+listingId+" Error ###");
            return;
        } else if(res&&res.length==0){
            Listing.update({
                _id: listingId
            }, {
                avgSafetyRatings: 0,
                avgFacilitiesRatings: 0,
                avgStaffRatings: 0,
                avgEducationRatings: 0,
                avgOverAllRatings: 0,
                totalReviews: 0
            }, {
                upsert: true
            }, function (err, response) {
                if (err) {
                    return next(err);
                } else {
                    logger.info("Deleted all reviews, reset all Ratings");
                }
            });
        }else if(res&&res.length>0) {

            var totalReviewCount = res.length;
            var totalSafetyRate = 0;
            var totalFacilitiesRate = 0;
            var totalStaffRate = 0;
            var totalEducationRate = 0;
            var totalOverAllRate = 0;
            var totalAvgRating;

            var divisorSafety = totalReviewCount;
            var divisorFacilities = totalReviewCount;
            var divisorStaff = totalReviewCount;
            var divisorEducation = totalReviewCount;
            var divisorOverAll = totalReviewCount;

            var avgSafetyRatings = 0;
            var avgFacilitiesRatings = 0;
            var avgStaffRatings = 0;
            var avgEducationRatings = 0;
            var avgOverAllRatings = 0;

            logger.info(JSON.stringify(res));

            res.forEach(function(review){
                var latestReview = review.latestReview;
                if(latestReview.reviewInfo.safetyRate == 0 || latestReview.reviewInfo.safetyRate == null){
                    divisorSafety-=1;
                } else if(latestReview.reviewInfo.safetyRate != 0 && latestReview.reviewInfo.safetyRate != null){
                    totalSafetyRate+=latestReview.reviewInfo.safetyRate;
                }
                if(latestReview.reviewInfo.facilitiesRate == 0 || latestReview.reviewInfo.facilitiesRate == null){
                    divisorFacilities-=1;   
                } else if(latestReview.reviewInfo.facilitiesRate != 0 && latestReview.reviewInfo.facilitiesRate != null){
                    totalFacilitiesRate+=latestReview.reviewInfo.facilitiesRate;   
                }
                if(latestReview.reviewInfo.staffRate == 0 || latestReview.reviewInfo.staffRate == null){
                    divisorStaff-=1;
                } else if(latestReview.reviewInfo.staffRate != 0 && latestReview.reviewInfo.staffRate != null){
                    totalStaffRate+=latestReview.reviewInfo.staffRate;
                }
                if(latestReview.reviewInfo.educationRate == 0 || latestReview.reviewInfo.educationRate == null){
                    divisorEducation-=1;
                } else if(latestReview.reviewInfo.educationRate != 0 && latestReview.reviewInfo.educationRate != null){
                    totalEducationRate+=latestReview.reviewInfo.educationRate;
                }
                if(latestReview.reviewInfo.overAllRate == 0 || latestReview.reviewInfo.overAllRate == null){
                    divisorOverAll-=1;
                } else if(latestReview.reviewInfo.overAllRate != 0 && latestReview.reviewInfo.overAllRate != null){
                    totalOverAllRate+=latestReview.reviewInfo.overAllRate;
                }
            });
            if( divisorSafety == 0 || divisorFacilities == 0 || divisorStaff == 0 || divisorEducation == 0 || divisorOverAll==0 ){
                logger.info("### ZERO DIVISOR "+ divisorSafety +" "+divisorFacilities +" "+divisorStaff +" "+divisorEducation +" "+divisorOverAll +" ###");
            }
            if(divisorSafety == 0){
                avgSafetyRatings = 0;
            } else {
                avgSafetyRatings = totalSafetyRate / divisorSafety; //parseFloat(ratingSummary.) / parseInt(ratingSummary.totalReviews);
                avgSafetyRatings = avgSafetyRatings.toFixed(2);
            }
            if( divisorFacilities == 0 ){
                avgFacilitiesRatings = 0;
            } else {
                avgFacilitiesRatings = totalFacilitiesRate / divisorFacilities; //parseFloat(ratingSummary.totalFacilitiesRate) / parseInt(ratingSummary.totalReviews);
                avgFacilitiesRatings = avgFacilitiesRatings.toFixed(2);
            }
            if( divisorStaff == 0 ){
                avgStaffRatings = 0;
            } else {
                avgStaffRatings = totalStaffRate / divisorStaff; //parseFloat(ratingSummary.totalStaffRate) / parseInt(ratingSummary.totalReviews);
                avgStaffRatings = avgStaffRatings.toFixed(2);
            }
            if( divisorEducation == 0 ){
                avgEducationRatings = 0;
            } else {
                avgEducationRatings = totalEducationRate / divisorEducation; //parseFloat(ratingSummary.totalEducationRate) / parseInt(ratingSummary.totalReviews);
                avgEducationRatings = avgEducationRatings.toFixed(2);
            }
            if( divisorOverAll==0 ){
                avgOverAllRatings = 0;
            } else {
                avgOverAllRatings = totalOverAllRate / divisorOverAll; //parseFloat(ratingSummary.totalOverAllRate) / parseInt(ratingSummary.totalReviews);
                avgOverAllRatings = avgOverAllRatings.toFixed(2);
            }

            Listing.update({
                _id: listingId
            }, {
                avgSafetyRatings: avgSafetyRatings,
                avgFacilitiesRatings: avgFacilitiesRatings,
                avgStaffRatings: avgStaffRatings,
                avgEducationRatings: avgEducationRatings,
                avgOverAllRatings: avgOverAllRatings,
                totalReviews: totalReviewCount
            }, {
                upsert: true
            }, function (err, response) {
                if (err) {
                    return;
                } else {
                    logger.info("Updated average rating ")
                }

            });


        }
    });

}

function sendForgotPasswordEmail(firstName, email, token) {

    // initialize email template library
    var EmailTemplate = require('email-templates').EmailTemplate;

    // initialize the root template directory
    var emailTemplatesDir = path.resolve(__dirname, '..', 'emails', 'forgot-pass');

    // initialize the actual email template
    var forgotUserEmail = new EmailTemplate(emailTemplatesDir);

    var jsonData = {
        email: email,
        name: firstName,
        reset_link: HOST_SERVER + '/#/change-password?token=' + token + '&email=' + encodeURIComponent(email),
        generate_link: HOST_SERVER + '/#/forgot-password'
    };

    forgotUserEmail.render(jsonData, function (err, results) {


        var mailOptions = {
            from: 'Ratingsville <ratingsville@gmail.com>',
            to: email,
            subject: 'Ratingsville | Password Reset Request',
            html: results.html,
            text: results.text
        }

        transporter.sendMail(mailOptions, function (error, response) {
            if (error) {
                logger.info(error);
            } else {
                logger.info("Password reset sent: " + JSON.stringify(response));
            }
            transporter.close(); // shut down the connection pool, no more messages
        });


    })
}

function isNumeric(n) {
    return (typeof n == "number" && !isNaN(n));
}

function sendAccountLockEmail(email, token, name) {

    logger.info("Sending Account Locked email");

    // initialize email template library
    var EmailTemplate = require('email-templates').EmailTemplate;

    // initialize the root template directory
    var emailTemplatesDir = path.resolve(__dirname, '..', 'emails', 'account-locked');

    // initialize the actual email template
    var forgotUserEmail = new EmailTemplate(emailTemplatesDir);

    var jsonData = {
        name: name,
        email: email,
        reset_link: HOST_SERVER + '/#/change-password?token=' + token + '&email=' + encodeURIComponent(email),
        contact_link: HOST_SERVER + '/#/contactus?email=' + encodeURIComponent(email) + '&subject=' + encodeURIComponent('Unauthorized individual accessing my account')
    };

    forgotUserEmail.render(jsonData, function (err, results) {


        var mailOptions = {
            from: 'Ratingsville <ratingsville@gmail.com>',
            to: email,
            subject: 'Ratingsville | Account Locked',
            html: results.html,
            text: results.text
        }

        transporter.sendMail(mailOptions, function (error, response) {
            if (error) {
                logger.info(error);
            } else {
                logger.info("Account lock sent: " + JSON.stringify(response));
            }
            transporter.close(); // shut down the connection pool, no more messages
        });


    })
}

function passwordResetSuccess(user) {

    // initialize email template library
    var EmailTemplate = require('email-templates').EmailTemplate;

    // initialize the root template directory
    var emailTemplatesDir = path.resolve(__dirname, '..', 'emails', 'pass-reset-success');

    // initialize the actual email template
    var passwordChangedEmail = new EmailTemplate(emailTemplatesDir);

    var jsonData = {
        name: user.preferredWayToAddress || user.otherWayToAddress || user.firstName,
        contact_link: HOST_SERVER + '/#/contactus?email=' + encodeURIComponent(user.email) + '&subject=' + encodeURIComponent('Password Change')
    };

    passwordChangedEmail.render(jsonData, function (err, results) {


        var mailOptions = {
            from: 'Ratingsville <ratingsville@gmail.com>',
            to: user.email,
            subject: 'Ratingsville | Password Change Successful',
            html: results.html,
            text: results.text
        }

        transporter.sendMail(mailOptions, function (error, response) {
            if (error) {
                logger.info(error);
            } else {
                logger.info("Password Success Message Sent: " + JSON.stringify(response));
            }
            transporter.close(); // shut down the connection pool, no more messages
        });


    })
}

function sendForgotUsernameEmail(email, name) {

    // initialize email template library
    var EmailTemplate = require('email-templates').EmailTemplate;

    // initialize the root template directory
    var emailTemplatesDir = path.resolve(__dirname, '..', 'emails', 'forgot-user');

    // initialize the actual email template
    var forgotUserEmail = new EmailTemplate(emailTemplatesDir);

    var jsonData = {email: email, name: name};

    forgotUserEmail.render(jsonData, function (err, results) {


        var mailOptions = {
            from: 'Ratingsville <ratingsville@gmail.com>',
            to: email,
            subject: 'Ratingsville | Username Reminder',
            html: results.html,
            text: results.text
        }

        transporter.sendMail(mailOptions, function (error, response) {
            if (error) {
                logger.info(error);
            } else {
                logger.info("Message sent: " + JSON.stringify(response));
            }
            transporter.close(); // shut down the connection pool, no more messages
        });


    })
}

function sendReviewSubmitted(review) {

    // initialize email template library
    var EmailTemplate = require('email-templates').EmailTemplate;

    // initialize the root template directory
    var emailTemplatesDir = path.resolve(__dirname, '..', 'emails', 'review-submitted');

    // initialize the actual email template
    var reviewSubmittedEmail = new EmailTemplate(emailTemplatesDir);

    // remove timestamp from date
    review.dateSaved = new Date(review.dateSaved).toLocaleDateString();

    var jsonData = {
        user_first_name: review.user_id.firstName,
        daycare_name: review.daycare.name,
        submission_date: moment(review.dateSaved).format('dddd, MMMM D, YYYY').toString(),
        review_info: review.reviewInfo,
        login_link: HOST_SERVER + '/#/login?email=' + encodeURIComponent(review.user_id.email),
        contact_link: HOST_SERVER + '/#/contactus?email=' + encodeURIComponent(review.user_id.email)
    };

    // generate html stars
    jsonData.review_info.safetyStars = createHtmlStars(jsonData.review_info.safetyRate);
    jsonData.review_info.facilitiesStars = createHtmlStars(jsonData.review_info.facilitiesRate);
    jsonData.review_info.staffStars = createHtmlStars(jsonData.review_info.staffRate);
    jsonData.review_info.educationStars = createHtmlStars(jsonData.review_info.educationRate);
    jsonData.review_info.overAllStars = createHtmlStars(jsonData.review_info.overAllRate);
    // convert line breaks to br tags
    jsonData.review_info.safetyComment = linebreakToBrTag(jsonData.review_info.safetyComment);
    jsonData.review_info.facilitiesComment = linebreakToBrTag(jsonData.review_info.facilitiesComment);
    jsonData.review_info.staffComment = linebreakToBrTag(jsonData.review_info.staffComment);
    jsonData.review_info.educationComment = linebreakToBrTag(jsonData.review_info.educationComment);
    jsonData.review_info.overAllComment = linebreakToBrTag(jsonData.review_info.overAllComment);

    reviewSubmittedEmail.render(jsonData, function (err, results) {

        var mailOptions = {
            from: 'Ratingsville <ratingsville@gmail.com>',
            to: review.user_id.email,
            subject: 'Review for ' + review.daycare.name + ' Successfully Submitted',
            html: results.html,
            text: results.text
        }

        transporter.sendMail(mailOptions, function (error, response) {
            if (error) {
                logger.info(error);
            } else {
                logger.info("Review submitted email sent: " + JSON.stringify(response));
            }
            transporter.close(); // shut down the connection pool, no more messages
        });
    });
}

function createHtmlStars(stars) {
    var result = '<span style="color: #F5BE4E">';
    for (var i = 0; i < stars; i++) {
        result += '&#9733;';
    }
    for (var i = 0; i < 5 - stars; i++) {
        result += '&#9734;';
    }
    return result += '</span>';
}

function linebreakToBrTag(str) {
    var br = '<br>';
    for (var i = 0; i < str.length; i++) {
        if (str.charAt(i) === '\n') {
            var start = str.slice(0, i);
            var end = str.slice(i+1);
            str = start.concat(br).concat(end);
            i += br.length - 1;
        }
    }
    return str;
}

function toLower(keyword){

    if(!keyword){
        return keyword;
    } else {
        return keyword.toLowerCase();
    }
}

function saveSearchQuery(query) {

    logger.info("Saving Previous Search Before: "+JSON.stringify(query));

    // temporary code to remove filters
    query.cost = [];
    query.age = [];
    query.schoolyearonly = "";
    query.infantcare = "";
    query.weekend = "";
    query.halfday = "";
    query.fullday = "";
    query.parttime = "";
    query.nightcare = "";
    query.faithbased = "";
    query.accredited = "";
    query.headstart = "";
    query.dropins = "";
    query.beforeschool = "";
    query.afterschool = "";
    query.meals = "";
    query.transportation = "";
    query.goldSeal = "";
    query.vpk = "";
    query.schoolReadiness = "";

    query.keyword = toLower(query.keyword)
    query.location = toLower(query.location);
    query.county = toLower(query.county);
    query.fullAddress = toLower(query.fullAddress);

    if(!query.fullAddress){
        query.within = "";
    }

    logger.info("Saving Previous Search After: "+JSON.stringify(query));

    var doc = {'userId': query.userId, 'is_saved': false, saveTitle: "", 'keyword':query.keyword,
        'location':query.location, 'zip':query.zip, 'county':query.county,
        'within': query.within, 'fullAddress': query.fullAddress, 'queryJson':JSON.stringify(query)};

    var deleteThenAdd = function (count,doc) {
        if (count >= searchSaveLimit) {
            Searches.findOneAndRemove(
                {userId: doc.userId, is_saved:false},
                {
                    sort: {'searchDate': 1},
                    passRawResult: true
                },
                function (__err, doc, raw) {
                    if (__err) {
                        throw __err;
                    }
                });
        }
        doc.searchDate = Date.now();
        var saveQuery = new Searches(doc);
        saveQuery.save(function (__err) {
            if (__err) throw __err;
        });
    }

    Searches.findOne(
        {userId: doc.userId, is_saved:false, location: query.location, keyword: query.keyword,
            zip: query.zip, county: query.county, fullAddress: query.fullAddress, within: query.within
         },
        function (__err, existingSearch) {

             if (__err) {
                throw __err;
            }

            if(existingSearch){
                logger.info("Previous Search exist: " + JSON.stringify(existingSearch));
                existingSearch.searchDate = Date.now() ;
                existingSearch.save();
            } else {
                Searches.count({userId: doc.userId, is_saved:false},function (err, count) {
                    if (err) {
                        throw err;
                    } else {
                        deleteThenAdd(count,doc);
                    }
                });
            }
        });
}

function saveFilters(searchFilter) {

    var query = {'userId': searchFilter.userId, 'is_saved': searchFilter.is_saved};
    var deleteThenAdd = function (i) {
        logger.info("Saving search : saveFilters ");
        var count = i;
        if (count >= searchSaveLimit) {
            Searches.findOneAndRemove(
                query,
                {
                    sort: {'searchDate': 1},
                    passRawResult: true
                },
                function (__err, doc, raw) {
                    if (__err) {
                        throw __err;
                    }
                });
        }

        var saveFilters = new Searches(searchFilter);
        saveFilters.save(function (__err) {
            if (__err) throw __err;
        });
    }
    Searches.count(
        query,
        function (err, count) {

            if (err) {
                throw err;
            } else {
                //logger.info("### SearchID is "+searchFilter._id+" ###");
                if (searchFilter._id != null) {
                    Searches.find({
                            '_id': searchFilter._id,
                            'userId': searchFilter.userId,
                            'is_saved': searchFilter.is_saved
                        },
                        function (_err, _res) {
                            if (_res && !_err) {
                                // A DUPLICATE IS FOUND
                                // DO NOT ADD OR DELETE ANYTHING
                                //logger.info("### Search is Duplicate ###");
                            } else if (!_err) {
                                // SEARCH IS UNIQUE
                                // ADD TO DB
                                //logger.info("### Search is Unique ###");
                                deleteThenAdd(count);

                            } else {
                                throw _err;
                            }
                        });
                } else {
                    deleteThenAdd(count);
                }

            }
        });
}

function isSearchUnique(query){
    query.keyword = toLower(query.keyword);
    query.location = toLower(query.location);
    query.county = toLower(query.county);
    query.fullAddress = toLower(query.fullAddress);

    Searches.find({
                    'userId': query.userId,
                    'is_saved': false,
                    'keyword': query.keyword,
                    'location': query.location,
                    'county' : query.county,
                    'fullAddress' : query.fullAddress,
                    'zip': query.zip,
                    'within': query.within
                },
                function (_err, _res) {
                    if (_res && !_err) {
                        // A DUPLICATE IS FOUND
                        logger.info("### Search : Duplicate ###");
                        return false;
                    } else if (!_err) {
                        // SEARCH IS UNIQUE
                        logger.info("### Search : Unique ###");
                        return true;
                    } else {
                        throw _err;
                    }
                });
}

function saveMsgAndNotifyAdmin(req,res,next){

    var subj = "Ratingsville Daycare Message Nofitication"
    var txt = 
    "recipient_name : " + req.body.recipient_name +"\n"+
    "recipient_id : " + req.body.recipient_id +"\n"+
    "listing_id : " + req.body.listing_id +"\n"+
    "subject : " + req.body.subject +"\n"+
    "message : " + req.body.message +"\n"+
    "sender_id : " + req.body.sender_id +"\n"+
    "sender_email : " + req.body.sender_email +"\n"+
    "status : " + req.body.status;
    notifyAdmin(subj,txt);

    User.findOne({username: req.body.sender_email}, function(err, user) {
        if (!err) {
            var emailData = {
                message: req.body.message,
                register_link: HOST_SERVER + '/#/register',
                sender_email: req.body.sender_email,
                user: user
            }

            notifySender(emailData);
            // sendChildCareCopy(emailData);
        }
    });

    // Message.send;
    res.send();
}

function documentInputToAdmin(jsonData,dir,filename,callback){
    logger.info("JSON Email: " + JSON.stringify(jsonData));

    var mailOptions = {
        from: 'Ratingsville <ratingsville@gmail.com>',
        to: [jsonData.recipientEmail],
        bcc: [jsonData.providerEmail],
        subject: 'Ratingsville | Client Form Submitted' ,
        text: 'Document submitted by a client.\n\nClientJsonData:' + JSON.stringify(jsonData),
        attachments: [
            {
                path: path.join(dir,filename)
            }
        ]
    };
    logger.info("mailOptions:"+JSON.stringify(mailOptions));

    transporter.sendMail(mailOptions, function (_error, _response) {
        if (_error) {
            //logger.info(_error);
            callback(_error,null);
        } else {
            //logger.info("Edit Form sent: " + JSON.stringify(_response));
            callback(null,_response);
        }
        //transporter.close(); // shut down the connection pool, no more messages
    });
}

function generatePdf(data,docType,callback){
    var copyRes = {};
    copyRes = _.cloneDeep(data);

    pdfGenerator.createPdf(data,docType,function(err,filename){



        copyRes.filename = filename;

        logger.info("Document Saved: "+filename);
        documentInputToAdmin(copyRes,pdfRootDir,filename, function(_err,_res){
            if(_err){
                logger.info("ErrSend: "+_err);
                return 0;
            }
            if(_res){
                logger.info(filename+" sent to admin");
                return 0;
            }
        });

        if(err){
            callback(err);
        }else if(!copyRes){
            callback(null);
        }else{
            callback(null,copyRes);
        }       
    });
}

function saveSession(req, res, next){
    var session = new Session({
            sessionId:req.sessionID,
            userId:req.body.user._id,
            userEmail: req.body.user.email,
            userType:( (req.body.user.userType.indexOf("admin")!=-1)?"admin":"user" )
        });
        session.save(function(err){
            if(err){
                return res.status(401).send("UserNotFound");
            }
            else{
                logger.info("UserSessionSaved!!!");
                res.send();
            }
        });
}

function deleteSession(req, res, next){
    Session.remove({userId:req.body.userId},function(err){
        if(err){
            return res.status(404).send("UserSessionNotFound");
        }
        else{
            logger.info("UserSessionDeleted!!!");
            res.send();
        }
    });
}

function saveDocumentHistory(doc){

    var docHistory = new DocumentHst();
    docHistory.type = doc.type;
    docHistory.userId = doc.userId;
    docHistory.studentId = doc.studentId;
    docHistory.pdfPath = doc.pdfPath;
    docHistory.pdfDate = doc.pdfDate;
    docHistory.version = doc.version;

    docHistory.save(function(err,returnDoc){
        if(err) {
            logger.info("Error in saving document history");
        }
        if(returnDoc){
           return returnDoc;
        }
    });

}

debug("Loaded");
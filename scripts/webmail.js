const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
						service: 'Gmail',
    						auth: {
        						user: 'ratingsville@gmail.com',
        						pass: 'R4tingsvill3',
    						      },
    					    });
    	
module.exports = function sendEmail(to, subject, message) {
    const mailOptions = {
        from: 'Ratingsville <ratingsville@gmail.com>',
        to: to,
        subject: subject,
        html: message,
    };

    transport.sendMail(mailOptions, function(error){
        if (error) {
            console.log(error);
        }
    });
};

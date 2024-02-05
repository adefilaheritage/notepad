nodemailer = require('nodemailer');

const sendEmail = async options => {
    //STEP 1: CREATE A TRANSPORTER
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    console.log(process.env.EMAIL_PASSWORD)

    //STEP 2: DEFINE THE EMAIL OPTIONS
    const mailOptions = {
        from: 'Heritage Notes Corporation <hello.heritageco@gmail.com>',
        to: options.email,
        subject: options.subject,
        text: options.message
        //HTML

    };

    //STEP 3: ACTUALLY SEND THE EMAIL
    await transporter.sendEmail(mailOptions);
};

module.exports = sendEmail;
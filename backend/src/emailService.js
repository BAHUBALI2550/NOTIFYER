const nodemailer = require('nodemailer');
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

//SMTP Provider
// for docker
// const transport = nodemailer.createTransport({
//     service: "Gmail",
//     secure: false,
//     auth: process.env.SMTP_USER ? {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS,
//     }
//     : undefined,
// });


async function sendWelcomeEmail(toEmail, name) {
    try {
        console.log(`gg:${toEmail}`);
    const info = 
    // await transport.sendMail({
    //     from: process.env.SMTP_USER,
    //     to: toEmail,
    //     subject: 'Welcome! ',
    //     text: `Hi ${name}, Welcome! Thanks for using our service, wishing you a smooth experience through our platform. Feel free to send us any issue or troubleshoot`,
    // });
    await resend.emails.send({
    from: "Notifyer <onboarding@resend.dev>",
    to: toEmail,
    subject: "Welcome!",
    html: `Hi ${name}, Welcome! Thanks for using our service, wishing you a smooth experience through our platform. Feel free to send us any issue or troubleshoot`,
  });
    console.log('Welcome email sent:', info.data);
} catch (err) {
    console.error('Error sending welcome email:', err);
    throw err;
}
}

async function sendWelcomeBackEmail(toEmail, name) {
    try {
        console.log(`gg:${toEmail}`);
    const info = 
    // await transport.sendMail({
    //     from: process.env.SMTP_USER,
    //     to: toEmail,
    //     subject: 'Welcome back! ',
    //     text: `Hi ${name}, Welcome back! you voucher can be claimed through our app`,
    // });
    await resend.emails.send({
    from: "Notifyer <onboarding@resend.dev>",
    to: toEmail,
    subject: "Welcome back!",
    html: `Hi ${name}, Welcome back! you voucher can be claimed through our app`,
  });
    console.log('Welcome Back email sent:', data);
} catch (err) {
    console.error('Error sending welcome back email:', err);
    throw err;
}
}

module.exports = {
    sendWelcomeEmail,
    sendWelcomeBackEmail,
};
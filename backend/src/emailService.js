const nodemailer = require('nodemailer');

//SMTP Provider
// const transport = nodemailer.createTransport({
//     service: "Gmail",
//     secure: false,
//     auth: process.env.SMTP_USER ? {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS,
//     }
//     : undefined,
// });

const transport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // IMPORTANT
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // for render
  },
});

(async () => {
  try {
    await transport.verify();
    console.log("✅ SMTP server verified & ready");
  } catch (err) {
    console.error("❌ SMTP verification failed:", err);
  }
})();

async function sendWelcomeEmail(toEmail, name) {
    try {
        console.log(`gg:${toEmail}`);
    const info = await transport.sendMail({
        from: process.env.SMTP_USER,
        to: toEmail,
        subject: 'Welcome! ',
        text: `Hi ${name}, Welcome! Thanks for using our service, wishing you a smooth experience through our platform. Feel free to send us any issue or troubleshoot`,
    });
    console.log('Welcome email sent:', info.messageId);
} catch (err) {
    console.error('Error sending welcome email:', err);
    throw err;
}
}

async function sendWelcomeBackEmail(toEmail, name) {
    try {
        console.log(`gg:${toEmail}`);
    const info = await transport.sendMail({
        from: process.env.SMTP_USER,
        to: toEmail,
        subject: 'Welcome back! ',
        text: `Hi ${name}, Welcome back! you voucher can be claimed through our app`,
    });
    console.log('Welcome Back email sent:', info.messageId);
} catch (err) {
    console.error('Error sending welcome back email:', err);
    throw err;
}
}

module.exports = {
    sendWelcomeEmail,
    sendWelcomeBackEmail,
};
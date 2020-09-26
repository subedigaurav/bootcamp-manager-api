const nodemailer = require('nodemailer')

const sendEmail = async options => {
	// create reusable transporter using the default SMTP transport
	const transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: process.env.SMTP_PORT,
		secure: false,
		auth: {
			user: process.env.SMTP_USERNAME,
			pass: process.env.SMTP_PASSWORD,
		},
	})

	// send mail with the defined transporter object
	const message = {
		from: `${process.env.FROM_NAME}<${process.env.FROM_EMAIL}>`,
		to: options.email,
		subject: options.subject,
		text: options.message,
	}

	const info = await transporter.sendMail(message)

	console.log('message sent:', info.messageId)
}

module.exports = sendEmail

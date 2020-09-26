const mongoose = require('mongoose')
const chalk = require('chalk')

const connectDB = async () => {
	const conn = await mongoose.connect(process.env.MONGODB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
		useFindAndModify: false,
	})

	console.log(chalk.cyanBright`MongoDB connected: ${conn.connection.host}`)
}

module.exports = connectDB

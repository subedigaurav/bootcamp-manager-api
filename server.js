const path = require('path')
const express = require('express')
const morgan = require('morgan')
const errorHandler = require('./middleware/error')
const connectDB = require('./config/db')
const cookieParser = require('cookie-parser')
const mongoSanitize = require('express-mongo-sanitize')
const helmet = require('helmet')
const xss = require('xss-clean')
const rateLimit = require('express-rate-limit')
const hpp = require('hpp')
const cors = require('cors')
const fileupload = require('express-fileupload')
const chalk = require('chalk')

//% load the environment variables
require('dotenv').config({ path: './config/config.env' })

//^ connect to database
connectDB()

//% route files
const bootcamps = require('./routes/bootcamps')
const courses = require('./routes/courses')
const auth = require('./routes/auth')
const users = require('./routes/users')
const reviews = require('./routes/reviews')

const app = express()

//@ body parser
app.use(express.json())

//@ cookie parser
app.use(cookieParser())

// dev logging middleware
if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'))
}

// file uploading
app.use(fileupload())

// sanitize data
app.use(mongoSanitize())

// set security headers
app.use(helmet())

// prevent XSS attacks
app.use(xss())

// rate limiting
const limiter = rateLimit({
	windowMs: 10 * 60 * 1000, // 10 minutes
	max: 200,
})

app.use(limiter)

// prevent http params pollution
app.use(hpp())

// enable cors
app.use(cors())

//@ set CSP header to allow inline scripts
app.use((req, res, next) => {
	res.setHeader('Content-Security-Policy', "script-src 'self' 'unsafe-inline'")
	next()
})

// set static folder
app.use(express.static(path.join(__dirname, 'public')))

//^ MOUNT ROUTERS
app.use('/api/v1/bootcamps', bootcamps)
app.use('/api/v1/courses', courses)
app.use('/api/v1/auth', auth)
app.use('/api/v1/users', users)
app.use('/api/v1/reviews', reviews)

//# ERROR HANDLER
app.use(errorHandler)

const PORT = process.env.PORT || 5000
const server = app.listen(
	PORT,
	console.log(
		chalk.inverse`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
	)
)

// handle unhandled promise rejection
process.on('unhandledRejection', (error, promise) => {
	console.log(error)
	console.log(`Error: ${error.message}`)
	// close server & exit process
	server.close(() => process.exit(1))
})

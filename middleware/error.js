const ErrorResponse = require('../utils/errorResponse')

const errorHandler = (err, req, res, next) => {
	let error = new ErrorResponse(err.message || 'Server Error', err.statusCode || 500)

	//^ log to console for developer
	console.log(err)

	//^ mongoose bad objectID
	if (err.name === 'CastError') {
		error.message = `resouce does not exist in the server`
		error.statusCode = 404
	}

	//^ mongoose duplicate key
	if (err.code === 11000) {
		error.message = `resource already exists in the server`
		error.statusCode = 400
	}

	//^ mongoose validation error
	if (err.name === 'ValidationError') {
		const message = Object.values(err.errors).map(val => val.message)
		error.message = message
		error.statusCode = 400
	}

	res.status(error.statusCode).json({ success: false, error: error.message })
}

module.exports = errorHandler

const jwt = require('jsonwebtoken')
const asyncHandler = require('./async')
const errorResponse = require('../utils/errorResponse')
const User = require('../models/User')
const ErrorResponse = require('../utils/errorResponse')

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
	let token = null

	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
		// set token from Bearer Token in header
		token = req.headers.authorization.split(' ')[1]
	} else if (req.cookies.token) {
		// set token from cookie
		token = req.cookies.token
	}

	// Make sure token exists
	if (!token) {
		return next(new ErrorResponse('not authorized to access this route', 401))
	}

	try {
		// Verify token
		const decoded = jwt.verify(token, process.env.JWT_SECRET)

		req.user = await User.findById(decoded.id)

		next()
	} catch (err) {
		return next(new ErrorResponse('not authorized to access this route', 401))
	}
})

// Grant access to specific roles
exports.authorize = (...roles) => {
	return (req, res, next) => {
		if (!roles.includes(req.user.role)) {
			return next(
				new ErrorResponse(
					`role '${req.user.role}' is not authorized to access this route`,
					403
				)
			)
		}
		next()
	}
}

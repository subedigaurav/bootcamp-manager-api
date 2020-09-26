const crypto = require('crypto')
const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const sendEmail = require('../utils/sendEmail')
const User = require('../models/User')

/**
 * @desc    Register user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
exports.register = asyncHandler(async (req, res, next) => {
	const { name, email, password, role } = req.body

	// create user
	const user = await User.create({
		name,
		email,
		password,
		role,
	})

	sendTokenResponse(user, 200, res)
})

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
	const { email, password } = req.body

	// validate email and password
	if (!email || !password) {
		return next(new ErrorResponse('Please provide an email and password', 400))
	}

	// check for user
	const user = await User.findOne({ email }).select('+password')

	if (!user) {
		return next(new ErrorResponse('Invalid credentials', 401))
	}

	// check if password matches
	const isMatch = await user.matchPassword(password)

	if (!isMatch) {
		return next(new ErrorResponse('Invalid credentials', 401))
	}

	sendTokenResponse(user, 200, res)
})

/**
 * @desc    Logout user / clear cookie
 * @route   GET /api/v1/auth/logout
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res, next) => {
	res.cookie('token', 'none', {
		expires: new Date(Date.now() + 10 * 1000),
		httpOnly: true,
	})

	res.status(200).json({
		success: true,
		message: 'successfully logged out',
	})
})

/**
 * @desc    Get the current logged in user
 * @route   POST /api/v1/auth/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res, next) => {
	const user = await User.findById(req.user.id)

	res.status(200).json({
		success: true,
		data: user,
	})
})

/**
 * @desc    Update user details
 * @route   PUT /api/v1/auth/updatedetails
 * @access  Private
 */
exports.updateDetails = asyncHandler(async (req, res, next) => {
	const fieldsToUpdate = {
		name: req.body.name,
		email: req.body.email,
	}

	const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
		new: true,
		runValidators: true,
	})

	res.status(200).json({
		success: true,
		data: user,
	})
})

/**
 * @desc    Update password
 * @route   PUT /api/v1/auth/updatepassword
 * @access  Private
 */
exports.updatePassword = asyncHandler(async (req, res, next) => {
	const user = await User.findById(req.user.id).select('+password')

	// check current password
	if (!(await user.matchPassword(req.body.currentPassword))) {
		return next(new ErrorResponse('password is incorrect', 401))
	}

	user.password = req.body.newPassword
	await user.save()

	// send a new token to the user in response
	sendTokenResponse(user, 200, res)
})

/**
 * @desc    Forgot Password
 * @route   POST /api/v1/auth/forgotpassword
 * @access  Public
 */
exports.forgotPassword = asyncHandler(async (req, res, next) => {
	const user = await User.findOne({ email: req.body.email })

	if (!user) {
		return next(new ErrorResponse('there is no user with that email', 404))
	}

	// Get the reset token
	const resetToken = user.getResetPasswordToken()

	await user.save({ validateBeforeSave: false })

	// create reset URL
	const resetURL = `${req.protocol}://
  ${req.get('host')}/api/v1/auth/resetpassword/${resetToken}`

	const message = `You are receiving this email because you (or someone else) has requested the reset of password associated with your account. Please make a put request to: \n \n ${resetURL}`

	try {
		await sendEmail({
			email: user.email,
			subject: 'Password reset token',
			message,
		})

		return res.status(200).json({
			success: true,
			message: 'email with reset token sent',
		})
	} catch (err) {
		console.log(err)
		user.resetPasswordToken = undefined
		user.resetPasswordExpire = undefined

		await user.save({ validateBeforeSave: false })

		return next(new ErrorResponse('email could not be sent', 500))
	}
})

/**
 * @desc    Reset password
 * @route   PUT /api/v1/auth/resetpassword/:resettoken
 * @access  Public
 */
exports.resetPassword = asyncHandler(async (req, res, next) => {
	// get hashed token
	const resetPasswordToken = crypto
		.createHash('sha256')
		.update(req.params.resettoken)
		.digest('hex')

	const user = await User.findOne({
		resetPasswordToken,
		resetPasswordExpire: {
			$gt: Date.now(),
		},
	})

	if (!user) {
		return next(new ErrorResponse('invalid token', 400))
	}

	// set new password
	user.password = req.body.password
	user.resetPasswordToken = undefined
	user.resetPasswordExpire = undefined
	await user.save()

	sendTokenResponse(user, 200, res)
})

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
	// create token
	const token = user.getSignedJwtToken()

	const options = {
		expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
		httpOnly: true,
	}

	if (process.env.NODE_ENV === 'production') {
		options.secure = true
	}

	res.status(statusCode).cookie('token', token, options).json({
		success: true,
		token,
	})
}

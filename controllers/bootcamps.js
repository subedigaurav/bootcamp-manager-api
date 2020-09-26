const path = require('path')
const ErrorResponse = require('../utils/errorResponse')
const geocoder = require('../utils/geocoder')
const Bootcamp = require('../models/Bootcamp')
const asyncHandler = require('../middleware/async')

/**
 * @desc    Get all Bootcamps
 * @route   GET /api/v1/bootcamps
 * @access  Public
 */
exports.getBootcamps = asyncHandler(async (req, res, next) => {
	return res.status(200).json(res.advancedResults)
})

/**
 * @desc    Get single bootcamp
 * @route   GET /api/v1/bootcamps/:id
 * @access  Public
 */
exports.getBootcamp = asyncHandler(async (req, res, next) => {
	const bootcamp = await Bootcamp.findById(req.params.id).populate(
		'courses',
		'title -bootcamp'
	)

	// check if there is any result or not
	if (!bootcamp) {
		return next(
			new ErrorResponse(
				404,
				`resource with id ${req.params.id} does not exist in the server`
			)
		)
	}

	return res.status(200).json({ success: true, data: bootcamp })
})

/**
 * @desc    Create new bootcamp
 * @route   POST /api/v1/bootcamps
 * @access  Private
 */
exports.createBootcamp = asyncHandler(async (req, res, next) => {
	//^ add user to req.body so that it is stored in database (we have req.user from our protect middleware)
	req.body.user = req.user.id

	// Check for published bootcamp
	const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id })

	// If the user is not an admin, they can only add one bootcamp
	if (publishedBootcamp && req.user.role !== 'admin') {
		return next(
			new ErrorResponse(
				`the user with id ${req.user.id} has already published a bootcamp`,
				400
			)
		)
	}

	const bootcamp = await Bootcamp.create(req.body)
	res.status(201).json({ success: true, data: bootcamp })
})

/**
 * @desc    Update bootcamp
 * @route   PUT /api/v1/bootcamps/:id
 * @access  Private
 */
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
	let bootcamp = await Bootcamp.findById(req.params.id)

	if (!bootcamp) {
		return next(
			new ErrorResponse(
				404,
				`resource with id ${req.params.id} does not exist in the server`
			)
		)
	}

	// make sure user is the bootcamp owner
	if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
		return next(
			new ErrorResponse(
				`user ${req.user.id} is not authorized to update this bootcamp`,
				401
			)
		)
	}

	bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
	})

	res.status(200).json({ success: true, data: bootcamp })
})

/**
 * @desc    Delete bootcamp
 * @route   DELETE /api/v1/bootcamps/:id
 * @access  Private
 */
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
	const bootcamp = await Bootcamp.findById(req.params.id)

	if (!bootcamp) {
		return next(
			new ErrorResponse(
				404,
				`resource with id ${req.params.id} does not exist in the server`
			)
		)
	}

	// make sure user is the bootcamp owner
	if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
		return next(
			new ErrorResponse(
				`user ${req.user.id} is not authorized to delete this bootcamp`,
				401
			)
		)
	}

	bootcamp.remove()

	res.status(200).json({
		success: true,
		message: `deleted reource with id ${req.params.id} successfully`,
	})
})

/**
 * @desc    Get bootcamps within a radius (km)
 * @route   GET /api/v1/bootcamps/radius/:zipcode/:distance
 * @access  Private
 */
exports.getBootcampsWithinRadius = asyncHandler(async (req, res, next) => {
	const { zipcode, distance } = req.params

	//^ get the latitude/longitude from geocoder
	const loc = await geocoder.geocode(zipcode)
	const lat = loc[0].latitude
	const lng = loc[0].longitude

	//^ calculate radius using radians
	// divide distance by the radius of the earth
	// EARTH_RADIUS = 6378 kilometers
	const radius = distance / 6378

	const bootcamps = await Bootcamp.find({
		location: {
			$geoWithin: { $centerSphere: [[lng, lat], radius] },
		},
	})

	res.status(200).json({
		success: true,
		count: bootcamps.length,
		data: bootcamps,
	})
})

/**
 * @desc    Upload photo for bootcamp
 * @route   PUT /api/v1/bootcamps/:id/photo
 * @access  Private
 */
exports.uploadBootcampPhoto = asyncHandler(async (req, res, next) => {
	const bootcamp = await Bootcamp.findById(req.params.id)

	if (!bootcamp) {
		return next(
			new ErrorResponse(
				`resource with id ${req.params.id} does not exist in the server`,
				404
			)
		)
	}

	// make sure user is the bootcamp owner
	if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
		return next(
			new ErrorResponse(
				`user ${req.user.id} is not authorized to delete this bootcamp`,
				401
			)
		)
	}

	// check if file was uploaded
	if (!req.files) {
		return next(new ErrorResponse(`please upload a file`, 400))
	}

	const file = req.files.file

	// make sure that the image is a photo
	if (!file.mimetype.startsWith('image')) {
		return next(new ErrorResponse(`please upload a valid image file`, 400))
	}

	// check file size
	if (file.size > process.env.MAX_FILE_UPLOAD) {
		return next(
			new ErrorResponse(
				`please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
				400
			)
		)
	}

	// create custom file name
	file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`

	file.mv(`${process.env.FILE_UPLAOD_PATH}/${file.name}`, async err => {
		if (err) {
			console.log(err)
			return next(new ErrorResponse(`problem with file upload`, 500))
		}

		await Bootcamp.findByIdAndUpdate(req.params.id, {
			photo: file.name,
		})

		res.status(200).json({
			success: true,
			data: file.name,
		})
	})
})

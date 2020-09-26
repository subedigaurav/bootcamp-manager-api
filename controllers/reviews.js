const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const Review = require('../models/Review')
const Bootcamp = require('../models/Bootcamp')

/**
 * @desc    Get Reviews
 * @route   GET /api/v1/reviews
 * @route   GET /api/v1/bootcamps/:bootcampId/reviews
 * @access  Public
 */
exports.getReviews = asyncHandler(async (req, res, next) => {
	if (req.params.bootcampId) {
		// get courses for a specific bootcamp
		const reviews = await Review.find({ bootcamp: req.params.bootcampId })
		return res.status(200).json({
			success: true,
			count: reviews.length,
			data: reviews,
		})
	} else {
		res.status(200).json(res.advancedResults)
	}
})

/**
 * @desc    Get single review
 * @route   GET /api/v1/reviews/:id
 * @access  Public
 */
exports.getReview = asyncHandler(async (req, res, next) => {
	const review = await Review.findById(req.params.id).populate({
		path: 'bootcamp',
		select: 'name description',
	})

	if (!review) {
		return next(new ErrorResponse(`no review with id ${req.params.id} found`, 404))
	}

	res.status(200).json({
		success: true,
		data: review,
	})
})

/**
 * @desc    Add Review
 * @route   POST /api/v1/bootcamps/:bootcampId/reviews
 * @access  Private
 */
exports.addReview = asyncHandler(async (req, res, next) => {
	req.body.bootcamp = req.params.bootcampId
	req.body.user = req.user.id

	const bootcamp = await Bootcamp.findById(req.params.bootcampId)

	if (!bootcamp) {
		return next(
			new ErrorResponse(`no bootcamp with id ${req.params.bootcampId} found`, 404)
		)
	}

	await Review.create(req.body)

	res.status(201).json({
		success: true,
		message: `review for bootcamp ${req.params.bootcampId} was added successfully`,
	})
})

/**
 * @desc    Update Review
 * @route   PUT /api/v1/reviews/:id
 * @access  Private
 */
exports.updateReview = asyncHandler(async (req, res, next) => {
	const review = await Review.findById(req.params.id)

	if (!review) {
		return next(new ErrorResponse(`no review with id ${req.params.id} found`, 404))
	}

	// make sure the review belongs to the user of the user is an admin
	if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
		return next(new ErrorResponse('not authorized to update review', 401))
	}

	await Review.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
	})

	res.status(200).json({
		success: true,
		message: `review with id ${req.params.id} was updated successfully`,
	})
})

/**
 * @desc    Delete Review
 * @route   DELETE /api/v1/reviews/:id
 * @access  Private
 */
exports.deleteReview = asyncHandler(async (req, res, next) => {
	const review = await Review.findById(req.params.id)

	if (!review) {
		return next(new ErrorResponse(`no review with id ${req.params.id} found`, 404))
	}

	// make sure the review belongs to the user of the user is an admin
	if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
		return next(new ErrorResponse('not authorized to update review', 401))
	}

	await review.remove()

	res.status(200).json({
		success: true,
		message: `review with id ${req.params.id} was deleted successfully`,
	})
})

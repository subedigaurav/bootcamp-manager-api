const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const Course = require('../models/Course')
const Bootcamp = require('../models/Bootcamp')

/**
 * @desc    Get Courses
 * @route   GET /api/v1/courses
 * @route   GET /api/v1/bootcamps/:bootcampId/courses
 * @access  Public
 */
exports.getCourses = asyncHandler(async (req, res, next) => {
	if (req.params.bootcampId) {
		// get courses for a specific bootcamp
		const courses = await Course.find({ bootcamp: req.params.bootcampId })
		return res.status(200).json({
			success: true,
			count: courses.length,
			data: courses,
		})
	} else {
		res.status(200).json(res.advancedResults)
	}
})

/**
 * @desc    Get single course
 * @route   GET /api/v1/courses/:id
 * @access  Public
 */
exports.getCourse = asyncHandler(async (req, res, next) => {
	const course = await Course.findById(req.params.id).populate({
		path: 'Bootcamp',
		select: 'name description',
	})

	if (!course) {
		return next(
			new ErrorResponse(
				404,
				`no course with the id ${req.params.id} exists on the server`
			)
		)
	}

	res.status(200).json({
		success: true,
		data: course,
	})
})

/**
 * @desc    Add single course
 * @route   POST /api/v1/bootcamps/:bootcampId/courses
 * @access  Private
 */
exports.addCourse = asyncHandler(async (req, res, next) => {
	req.body.bootcamp = req.params.bootcampId
	req.body.user = req.user.id

	const bootcamp = await Bootcamp.findById(req.params.bootcampId)

	if (!bootcamp) {
		return next(
			new ErrorResponse(
				404,
				`no bootcamp with the id ${req.params.bootcampId} exists on the server`
			)
		)
	}

	// make sure user is the bootcamp owner
	if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
		return next(
			new ErrorResponse(
				`user ${req.user.id} is not authorized to add a course to bootcamp ${bootcamp._id}`,
				401
			)
		)
	}

	// if the bootcamp exists, create a new course
	const course = await Course.create(req.body)

	res.status(200).json({
		success: true,
		data: course,
	})
})

/**
 * @desc    Update course
 * @route   PUT /api/v1/courses/:id
 * @access  Private
 */
exports.updateCourse = asyncHandler(async (req, res, next) => {
	let course = await Course.findById(req.params.id)

	if (!course) {
		return next(
			new ErrorResponse(
				404,
				`no course with the id ${req.params.id} exists on the server`
			)
		)
	}

	// make sure user is the course owner
	if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
		return next(
			new ErrorResponse(
				`user ${req.user.id} is not authorized to update course ${course._id}`,
				401
			)
		)
	}

	// update the course
	course = await Course.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
		runValidators: true,
	})

	res.status(200).json({
		success: true,
		data: course,
	})
})

/**
 * @desc    Delete course
 * @route   DELETE /api/v1/courses/:id
 * @access  Private
 */
exports.deleteCourse = asyncHandler(async (req, res, next) => {
	const course = await Course.findById(req.params.id)

	if (!course) {
		return next(
			new ErrorResponse(
				404,
				`no course with the id ${req.params.id} exists on the server`
			)
		)
	}

	// make sure user is the course owner
	if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
		return next(
			new ErrorResponse(
				`user ${req.user.id} is not authorized to delete course ${course._id}`,
				401
			)
		)
	}

	// delete the course
	await course.remove()

	res.status(200).json({
		success: true,
		message: `course with id ${req.params.id} was deleted successfully`,
	})
})

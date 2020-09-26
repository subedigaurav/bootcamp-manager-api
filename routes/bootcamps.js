const express = require('express')
const {
	getBootcamps,
	getBootcamp,
	createBootcamp,
	updateBootcamp,
	deleteBootcamp,
	getBootcampsWithinRadius,
	uploadBootcampPhoto,
} = require('../controllers/bootcamps')

const Bootcamp = require('../models/Bootcamp')

//^ include other resource router
const courseRouter = require('./courses')
const reviewRouter = require('./reviews')

//^ base route: /api/v1/bootcamps
const router = express.Router()

const advancedResults = require('../middleware/advancedResults')
const { protect, authorize } = require('../middleware/auth')

//^ reroute into other resource routers
router.use('/:bootcampId/courses', courseRouter)
router.use('/:bootcampId/reviews', reviewRouter)

router
	.route('/:id')
	.get(getBootcamp)
	.put(protect, authorize('publisher', 'admin'), updateBootcamp)
	.delete(protect, authorize('publisher', 'admin'), deleteBootcamp)

router
	.route('/:id/photo')
	.put(protect, authorize('publisher', 'admin'), uploadBootcampPhoto)

router.route('/radius/:zipcode/:distance').get(getBootcampsWithinRadius)

router
	.route('/')
	.get(advancedResults(Bootcamp, 'courses'), getBootcamps)
	.post(protect, authorize('publisher', 'admin'), createBootcamp)

module.exports = router

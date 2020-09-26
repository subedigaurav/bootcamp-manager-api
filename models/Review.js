const mongoose = require('mongoose')
require('./Bootcamp')

const ReviewSchema = new mongoose.Schema({
	title: {
		type: String,
		trim: true,
		required: [true, 'Please add a title for the title'],
		maxlength: 100,
	},
	text: {
		type: String,
		required: [true, 'Please add some text'],
	},
	rating: {
		type: Number,
		min: 1,
		max: 10,
		required: [true, 'Please add a rating between 1 and 10'],
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	bootcamp: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Bootcamp',
		required: true,
	},
	user: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
})

// prevent user from submitting more than one review per bootcamp
ReviewSchema.index(
	{
		bootcamp: 1,
		user: 1,
	},
	{ unique: true }
)

// static method to get the average rating and save
ReviewSchema.statics.getAverageRating = async function (bootcampId) {
	const obj = await this.aggregate([
		{
			$match: { bootcamp: bootcampId },
		},
		{
			$group: {
				_id: '$bootcamp',
				averageRating: {
					$avg: '$rating',
				},
			},
		},
	])

	try {
		await this.model('Bootcamp').findByIdAndUpdate(bootcampId, {
			averageRating: obj[0].averageRating.toFixed(1),
		})
	} catch (err) {
		console.log(err)
	}
}

// call getAverageCost after save
ReviewSchema.post('save', async function () {
	await this.constructor.getAverageRating(this.bootcamp)
})

// call getAverageCost before remove
ReviewSchema.pre('remove', async function () {
	await this.constructor.getAverageRating(this.bootcamp)
})

module.exports = mongoose.model('Review', ReviewSchema)

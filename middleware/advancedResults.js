const advancedResults = (model, populate) => async (req, res, next) => {
	let query = null

	// copy req.query
	let reqQuery = { ...req.query }

	//@ fields to exclude : donot treat the below as fields to match
	const removeFields = ['select', 'sort', 'page', 'limit']
	// loop over the removeFields and delete them from request query
	removeFields.forEach(param => delete reqQuery[param])

	// create query string
	let queryStr = JSON.stringify(reqQuery)

	// create operators like $gt, $gte, ...
	queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`)

	//@ finding resource : query starts here
	query = model.find(JSON.parse(queryStr))

	//# adding to query if the ops present in request
	//@ Select fields
	if (req.query.select) {
		const fields = req.query.select.split(',').join(' ')
		query = query.select(fields)
	}

	//@ sort
	if (req.query.sort) {
		const sortBy = req.query.sort.split(',').join(' ')
		query = query.sort(sortBy)
	} else {
		query = query.sort('-createdAt')
	}

	//@ pagination : default is page 1
	const page = parseInt(req.query.page, 10) || 1
	const limit = parseInt(req.query.limit) || 25
	const startIndex = (page - 1) * limit
	const endIndex = page * limit
	const total = await model.countDocuments()

	query = query.skip(startIndex).limit(limit)

	if (populate) {
		query.populate(populate)
	}

	// execute the query
	const results = await query

	// Pagination result
	const pagination = {}

	if (endIndex < total) {
		pagination.next = {
			page: page + 1,
			limit,
		}
	}

	if (startIndex > 0) {
		pagination.prev = {
			page: page - 1,
			limit,
		}
	}

	res.advancedResults = {
		succes: true,
		count: results.length,
		pagination,
		data: results,
	}

	next()
}

module.exports = advancedResults

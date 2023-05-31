const express = require('express');
const getAPIData = require('./script');

const app = express();

app.get('/:from/:to', async function (req, res) {
	const from = String(req.params.from);
	const to = String(req.params.to);

	const datetime = new Date();

	try {
		const response = await getAPIData(from, to, datetime);
		res.json(response);
	} catch (e) {
		console.log(e);
		res.status(500).send('Something went wrong');
	}
});

app.get('/:from/:to/:timestamp', async function (req, res) {
	const from = String(req.params.from);
	const to = String(req.params.to);

	let datetime;

	try {
		const timestamp = parseInt(req.params.timestamp);
		datetime = new Date(timestamp);
	} catch (e) { // catch NaN
		if (e instanceof TypeError)
			res.status(400).send(`Invalid timestamp (${req.params.timestamp})}`);

		return;
	}

	try { // extract function
		const response = await getAPIData(from, to, datetime);
		res.json(response);
	} catch (e) {
		console.log(e);
		res.status(500).send('Something went wrong');
	}
});

app.listen(3000, () => {
	console.log('Server running on port http://localhost:3000');
	console.log('Test routes:');
	console.log('\thttp://localhost:3000/Zaandam/Metro%20Amstelveenseweg');
	console.log('\thttp://localhost:3000/Zaandam/Metro%20Amstelveenseweg/1684864270');
});
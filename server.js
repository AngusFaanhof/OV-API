const express = require('express');
const getAPIData = require('./script');

const app = express();

app.get('/:from/:to', async function (req, res) {
	const from = req.params.from;
	const to = req.params.to;
	const date = new Date();

	const response = await getAPIData(from, to, date);
	res.json(response);
});

app.get('/:from/:to/:timestamp', async function (req, res) {
	const from = req.params.from;
	const to = req.params.to;
	const timestamp = parseInt(req.params.timestamp);
	const date = new Date(timestamp * 1000);

	const response = await getAPIData(from, to, date);
	res.json(response);
});

app.listen(3000, () => {
	console.log("Server running on port http://localhost:3000");
	console.log("Test routes:");
	console.log("\thttp://localhost:3000/Zaandam/Metro%20Amstelveenseweg");
	console.log("\thttp://localhost:3000/Zaandam/Metro%20Amstelveenseweg/1684864270");
});
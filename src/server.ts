import express from "express";
import { getApiData } from "./extract"

const app = express();

app.get('/:from/:to', async (req, res) => {
	const from: string = req.params.from;
	const to: string = req.params.to;
	const datetime: Date = new Date();

	try {
		const response = await getApiData(from, to, datetime);
		res.json(response);
	} catch (e) {
		console.log(e);
		res.status(500).send('Something went wrong');
	}
});

app.get('/:from/:to/:timestamp', async (req, res) => {
	const from: string = req.params.from;
	const to: string = req.params.to;

	let datetime: Date;

	try {
		const timestamp = parseInt(req.params.timestamp, 10);
		datetime = new Date(timestamp);
	} catch (e) { // catch NaN
		if (e instanceof TypeError)
			res.status(400).send(`Invalid timestamp (${req.params.timestamp})}`);

		return;
	}

	try {
		const response = await getApiData(from, to, datetime);
		res.json(response);
	} catch (e) {
		console.log(e);
		res.status(500).send('Something went wrong');
	}
});

app.listen(3000, () => {
	console.log('Server running on port http://localhost:3000');
	console.log(`Test routes:
	http://localhost:3000/Zaandam/Metro%20Amstelveenseweg
	http://localhost:3000/Zaandam/Metro%20Amstelveenseweg/1684864270`);
});
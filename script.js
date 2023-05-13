const puppeteer = require('puppeteer');
const moment = require('moment');

async function getData(from, to, date) {
	const browser = await puppeteer.launch({
		// headless: false,
		headless: "new",
		args: ['--disable-web-security', '--disable-features=IsolateOrigins', ' --disable-site-isolation-trials'],
	});

	const page = await browser.newPage();

	await page.goto('https://9292.nl', { waitUntil: 'networkidle2' });

	// Accept cookies
	await page.waitForSelector('iframe');
	const frame = page.frames().find(frame => frame.url().includes('consent-tool'));

	const acceptButton = await frame.$('button#save');
	acceptButton.click();

	async function results() {
		await new Promise(r => setTimeout(r, 500)); // Let page fully load
		await page.waitForSelector('input#van');

		// TODO: extract to function
		await page.$eval('input#van', (el,value) => el.value = value, from);
		await page.$eval('input#naar', (el,value) => el.value = value, to);
		await page.$eval('input#date', (el,value) => el.value = value, moment(date).format('DD-MM-YYYY'));
		await page.$eval('input#time', (el,value) => el.value = value, moment(date).format('HH:mm'));

		await page.click('button[type="submit"]');

		// Next page in sequence
		await page.waitForSelector('#from-text-again')
		await page.click('button[type="submit"]');

		await page.waitForSelector('#journeyTabList');

		// format to steps array
		let handles = await page.$$('div.active ul li');
		let steps = [];

		// TODO: clean up
		for (let i = 0; i < handles.length; i++) {
			const handle = handles[i];
			const response = {}

			// transport
			const transportType = await handle.$eval('strong', (el) => el.innerText);
			response.transport = transportType;

			// direction
			if (transportType != 'Lopen') {
				response.direction = await handle.$eval('.text-muted.small', (el) => el.innerText);
			}

			// times
			response.times = await handle.$$eval('.timeline-time span', els => els.map(el => el.innerText));;

			// from / to
			const allStations = await handle.$$eval('.leg-link a', els => {
				return els.map(el => el.innerText);
			});

			response.from = i == 0 ? allStations[0] : steps[i-1].to;
			response.to = i == 0 ? allStations[1] : allStations[0];

			// Add track logic
			if (transportType.startsWith('NS')) {
				const elementTexts = await handle.$$eval('.timeline-type > span', els => {
					return els.map(el => el.innerText);
				});

				response.from += ' - ' + elementTexts[2];
				response.to += ' - ' + elementTexts[4];
			}

			steps.push(response);
		}

		const apiResponse = {
			departureTime: steps[0].times[0],
			arrivalTime: steps[steps.length - 1].times[1],
			steps: steps
		}

		return apiResponse;
	}

	const apiResponse = await results();
	const jsonApiResponse = JSON.stringify(apiResponse);
	console.log(jsonApiResponse);
}

const date = new Date("2023-05-10T12:00:00+01:00");
getData('Zaandam', 'Metro Amstelveenseweg', date);
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

		// format to api
		let handles = await page.$$('div.active ul li');
		let responses = [];

		for (let i = 0; i < handles.length; i++) {
			let handle = handles[i];

			let transportType = await handle.$eval('strong', (el) => el.innerText);

			let times = await handle.$eval('.timeline-time span', (el) => el.innerText);
			let stations = await handle.$eval('span a', (el) => el.innerText);

			console.log("times", times);
			console.log("stations", stations);

			let response = {
				transport: transportType,
				departure: {
					time: times[0],
					station: stations[0]
				},
				arrival: {
					time: times[1],
					station: stations[1]
				}
			}

			if (transportType != 'Lopen')
				response.direction = await handle.$eval('.text-muted', (el) => el.innerText);

			if (transportType.startsWith('NS'))
				response.departure.platform = await handle.$eval('.timeline-type > span', (el) => el.innerText);

			responses.push(response);
		}
		console.log(responses);
	}

	results();
}

const date = new Date("2023-05-10T12:00:00+01:00");

getData('Zaandam', 'Metro Amstelveenseweg', date);
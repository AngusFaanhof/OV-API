const puppeteer = require('puppeteer');

function getTimeFormatted(datetime) {
	const fullMinutes = datetime.getMinutes() < 10 ? `0${datetime.getMinutes()}` : datetime.getMinutes();
	return `${datetime.getUTCHours()}:${fullMinutes}`
}

function getDateFormatted(datetime) {
	return datetime.toLocaleDateString('nl-NL', { year: 'numeric', month: '2-digit', day: '2-digit'});
}

async function navigateToDetails(page, from, to, datetime) {
	await new Promise(r => setTimeout(r, 500));
	await page.waitForSelector('input#van');

	await page.type('input#van', from);
	await page.type('input#naar', to);

	// select arrival time
	await page.click('#aankomst');
	await page.type('input#date', getDateFormatted(datetime));
	await page.type('input#time', getTimeFormatted(datetime));

	await page.click('button[type="submit"]');

	// Confirm route
	await page.waitForSelector('#from-text-again')
	await page.click('button[type="submit"]');

	// Wait for details page to load
	await page.waitForSelector('#journeyTabList');
}

async function extractAPIData(page) {
	//format to steps array
	let handles = await page.$$('div.active ul li');
	let steps = [];

	// TODO: clean up
	for (let i = 0; i < handles.length; i++) {
		const handle = handles[i];
		const response = {}

		const transportType = await handle.$eval('strong', (el) => el.innerText);
		response.transport = transportType;

		if (transportType != 'Lopen')
			response.direction = await handle.$eval('.text-muted.small', (el) => el.innerText);

		response.times = await handle.$$eval('.timeline-time span', els => els.map(el => el.innerText));;

		const allStations = await handle.$$eval('.leg-link a', els => {
			return els.map(el => el.innerText);
		});

		response.from = i == 0 ? allStations[0] : steps[i-1].to;
		response.to = i == 0 ? allStations[1] : allStations[0];

		if (transportType.startsWith('NS')) {
			const elementTexts = await handle.$$eval('.timeline-type > span', els => {
				return els.map(el => el.innerText);
			});

			response.from += ' - ' + elementTexts[2];
			response.to += ' - ' + elementTexts[4];
		}

		steps.push(response);
	}

	return {
		departureTime: steps[0].times[0],
		arrivalTime: steps[steps.length - 1].times[1],
		steps: steps
	}
}

async function getAPIData(from, to, datetime) {
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

	await navigateToDetails(page, from, to, datetime);
	const apiResponse = await extractAPIData(page);

	await browser.close();

	return apiResponse;
}

// example call
// const from = 'Zaandam';
// const to = 'Metro Amstelveenseweg';
// const datetime = new Date("2023-05-10T12:00:00+01:00");
// getAPIData(from, to, datetime);

module.exports = getAPIData;

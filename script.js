const puppeteer = require('puppeteer');

async function getData(from, to) {
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
		await page.waitForSelector('input#van');
		await new Promise(r => setTimeout(r, 500)); // Let page fully load

		await page.type('input#van', from);

		await page.waitForSelector('input#naar');
		await page.type('input#naar', to);

		await page.click('button[type="submit"]');

		// Next page in sequence
		await page.waitForSelector('#from-text-again')
		await page.click('button[type="submit"]');

		await page.waitForSelector('#journeyTabList');
		const contents = await page.$eval('#journeyTabList', el => el.innerHTML);

		console.log(contents);
	}

	results();
}

getData('Zaandam', 'Metro Amstelveenseweg');
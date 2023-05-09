const puppeteer = require('puppeteer');

async function getData(from, to) {
	const browser = await puppeteer.launch({
		headless: false,
	});

	const page = await browser.newPage();

	await page.goto('https://9292.nl', { waitUntil: 'networkidle2' });


	// Accept cookies. TODO: Make it work in headless mode
	await page.waitForSelector('iframe');
	await page.keyboard.down('Shift');
	await page.keyboard.press('Tab');
	await page.keyboard.up('Shift');
	await page.keyboard.press("Enter");


	async function results() {
		await page.waitForSelector('input#van');
		await page.type('input#van', from);
		await page.type('input#naar', to);

		await page.click('button[type="submit"]');

		await page.waitForSelector('#from-text-again')
		await page.click('button[type="submit"]');

		await page.waitForSelector('#journeyTabList');
		const contents = await page.$eval('#journeyTabList', el => el.textContent);
		console.log(contents);
	}

	results();
	// console.log(results());
}

getData('Zaandam', 'Vrije Universiteit Amsterdam, Amsterdam');
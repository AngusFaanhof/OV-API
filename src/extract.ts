export async function getApiData(from: string, to: string, datetime: Date) {
	return {
		from,
		to,
		datetime,
	}
}
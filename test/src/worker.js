export default {
	async fetch(request, env, ctx) {
		// console.log(JSON.stringify(request.cf));
		let temp = {
			// body: await response.clone().text(),
			cache: request.cache,
			cf: request.cf,
			credentials: request.credentials,
			destination: request.destination,
			headers: {},
			integrity: request.integrity,
			method: request.method,
			mode: request.mode,
			redirect: request.redirect,
			referrer: request.referrer,
			referrerPolicy: request.referrerPolicy,
			signal: request.signal,
			url: request.url,
		};
		for (const [key, value] of request.headers.entries()) {
			temp.headers[key] = value;
		}
		return new Response(JSON.stringify({ ...request, ...temp }, null, '\t'), { headers: { 'Content-Type': 'application/json' } });
	},
};

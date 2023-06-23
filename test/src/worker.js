export default {
	async fetch(request, env, ctx) {
		let temp = { headers: {} };
		for (const [key, value] of request.headers.entries()) {
			temp.headers[key] = value;
		}
		return new Response(JSON.stringify({ ...request, ...temp }, null, '\t'), { headers: { 'Content-Type': 'application/json' } });
	},
};

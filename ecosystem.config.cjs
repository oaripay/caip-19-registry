module.exports = {
	apps: [
		{
			name: 'caip-19-registry',
			script: 'node run.js',
			post_update: ['npm i'],
		},
	],
}

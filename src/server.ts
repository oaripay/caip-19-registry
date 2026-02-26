import log from '@mwni/log'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { prettyJSON } from 'hono/pretty-json'
import type { AppContext, Caip19Asset } from './types.js'
import { mapAliasToAsset } from './registry.js'


export default function startServer(ctx: AppContext): { close: () => void } {
	const app = new Hono()

	app.use(prettyJSON({
		space: 4,
		force: true
	}))

	app.get('/', async c => {
		return c.json({
			name: 'caip-registry',
			version: ctx.version,
			assets: ctx.assets
		})
	})

	app.post('/map', async c => {
		const payload = await c.req.json() as Array<{
			symbol: string
			chain?: string
		}>

		if(!Array.isArray(payload)){
			return c.json({ error: 'Body must be an array' }, 400)
		}

		if(!payload.every(item => typeof item?.symbol === 'string' && item.symbol.trim().length > 0)){
			return c.json({ error: 'Each item must include a non-empty symbol string' }, 400)
		}

		const mapped = payload
			.map(alias => stripAliases(mapAliasToAsset(ctx, alias)))

		return c.json({ mapped })
	})

	const server = serve({
		fetch: app.fetch,
		port: ctx.config.server.port,
		hostname: ctx.config.server.address
	})

	log.info(`listening on ${ctx.config.server.address}:${ctx.config.server.port}`)

	return server
}

function stripAliases(asset: Caip19Asset | null): Omit<Caip19Asset, 'aliases' | 'chainAliases' | 'chain'> & { chain: Omit<Caip19Asset['chain'], 'aliases'> } | null {
	if (!asset) return null
	const { aliases: _aliases, chainAliases: _chainAliases, chain, ...rest } = asset
	const { aliases: _chainAliasesList, ...chainRest } = chain
	return {
		...rest,
		chain: chainRest
	}
}
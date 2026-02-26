import * as fs from 'fs'
import * as path from 'path'
import log from '@mwni/log'
import * as toml from 'toml'
import { AppContext, Caip2Chain, Caip19Asset } from './types.js'

type PresetConfig = {
	chain?: Array<Caip2Chain>,
	asset?: Array<Caip19Asset>
}

export async function initRegistry(ctx: AppContext){
	let presetsDir = path.join(ctx.srcDir, '..', 'presets')
	let presetFiles = fs.readdirSync(presetsDir)

	for(let file of presetFiles){
		log.info(`loading preset list ${file}`)

		try{
			const configText: string = fs.readFileSync(path.join(presetsDir, file), 'utf-8')
			const { chain, asset }: PresetConfig = toml.parse(configText)

			if(chain?.length)
				ctx.chains.push(...chain)

			if(asset?.length)
				ctx.assets.push(...asset)

		}catch (error){
			log.warn(`corrupt preset file ${file}`)
			log.warn(error)
		}
	}

	for(let asset of ctx.assets.slice()){
		const [chainId, _] = asset.id.split('/')
		const chain = ctx.chains.find(chain => chain.id === chainId)

		if(!chain){
			log.warn(`missing chain definition for asset ${asset.id}`)
			ctx.assets.splice(ctx.assets.indexOf(asset, 1))
			continue
		}

		asset.chain = chain
	}
	
	log.info(`loaded ${ctx.chains.length} chains and ${ctx.assets.length} assets in total`)
}

export function mapAliasToAsset(
	ctx: AppContext, 
	alias: { symbol: string, chain?: string }
): Caip19Asset | null {
	const searchSymbol = alias.symbol.toLowerCase()
	const searchChain = alias.chain?.toLowerCase()

	const calculateScore = (asset: Caip19Asset): number => {
		const chainAliases = [
			asset.chain.name,
			...(asset.chain.aliases ?? []),
			...(asset.chainAliases ?? [])
		].map(a => a.toLowerCase())

		const symbolAliases = [
			asset.symbol,
			asset.name,
			...(asset.aliases ?? [])
		].map(a => a.toLowerCase())

		if(searchChain){
			const chainFoundIndex = chainAliases.indexOf(searchChain)
			const symbolFoundIndex = symbolAliases.indexOf(searchSymbol)

			if(chainFoundIndex === -1)
				return 0

			if(symbolFoundIndex === -1)
				return 0

			return 1 - chainFoundIndex/100 - symbolFoundIndex/100
		}else{
			const concatSymbols = []

			for(let symbol of symbolAliases){
				for(let chain of chainAliases){
					concatSymbols.push(`${symbol}${chain}`)
					concatSymbols.push(`${symbol}:${chain}`)
					concatSymbols.push(`${symbol}-${chain}`)
					concatSymbols.push(`${symbol}_${chain}`)
					concatSymbols.push(`${symbol}/${chain}`)
					concatSymbols.push(`${symbol} ${chain}`)
				}
			}

			const concatFoundIndex = concatSymbols.indexOf(searchSymbol)

			if(concatFoundIndex === -1)
				return 0

			return 1 - concatFoundIndex/600 // todo: needs better symmetry
		}
	}

	return ctx.assets
		.map(asset => ({ asset, score: calculateScore(asset) }) as { asset: Caip19Asset, score: number })
		.sort((a, b) => b.score - a.score)
		.filter(({ score }) => score > 0.25)
		.at(0)
		?.asset
}
import * as fs from 'fs'
import * as path from 'path'
import log from '@mwni/log'
import * as toml from 'toml'
import { AppContext, Caip19Alias, Caip19Asset } from './types.js'

type PresetConfig = {
	asset?: Array<Caip19Asset>
}

export async function loadAssetLists(ctx: AppContext){
	let presetsDir = path.join(ctx.srcDir, '..', 'presets')
	let presetFiles = fs.readdirSync(presetsDir)

	for(let file of presetFiles){
		log.info(`loading asset list ${file}`)

		try{
			const configText: string = fs.readFileSync(path.join(presetsDir, file), 'utf-8')
			const { asset }: PresetConfig = toml.parse(configText)

			if(asset?.length)
				ctx.assetList.push(...asset)
		}catch (error){
			log.warn(`corrupt preset file ${file}`)
			log.warn(error)
		}
	}

	updateAliasMap(ctx)
	
	log.info(`loaded ${ctx.assetList.length} assets in total`)
}

export function mapAliasToAsset(
	ctx: AppContext, 
	alias: { symbol: string, network?: string, source?: string }
): Caip19Asset | null {
	const aliasSymbol = alias.symbol.toLowerCase()
	const aliasNetwork = alias.network?.toLowerCase()
	const aliasSource = alias.source?.toLowerCase()

	const calculateScore = (a: Caip19Alias): number => {
		const aSymbol = a.symbol.toLocaleLowerCase()
		const aNetwork = a.network?.toLocaleLowerCase()

		let score = 0

		if(aliasSource && a.usedBy?.includes(aliasSource)){
			if(aSymbol === aliasSymbol && aNetwork === aliasNetwork)
				score += 1
		}else if(alias.network){
			if(aSymbol === aliasSymbol && a.network && aNetwork === aliasNetwork)
				score += 1
		}else{
			if(a.network){
				const concatSymbol = aSymbol + aNetwork

				if(concatSymbol === aliasSymbol)
					score += 0.5
				else if('W' + concatSymbol === aliasSymbol)
					score += 0.5
				else if(concatSymbol === 'W' + aliasSymbol)
					score += 0.5
			}else{
				if(aSymbol === aliasSymbol)
					score += 1
				else if('W' + aSymbol === aliasSymbol)
					score += 0.5
				else if(aSymbol === 'W' + aliasSymbol)
					score += 0.5
			}
		}

		return score
	}

	const ranking = Array.from(ctx.aliasMap.keys())
		.map(a => ({ alias: a, score: calculateScore(a) }) as { alias: Caip19Alias, score: number })
		.sort((a, b) => b.score - a.score)

	const bestMatch = ranking.find(entry => entry.score > 0)
	return bestMatch ? (ctx.aliasMap.get(bestMatch.alias) ?? null) : null
}

function updateAliasMap(ctx: AppContext){
	ctx.aliasMap = new Map()

	for(const asset of ctx.assetList){
		ctx.aliasMap.set({ symbol: asset.symbol, network: asset.network }, asset)

		if(!Array.isArray(asset.aliases))
			continue

		for(const alias of asset.aliases){
			ctx.aliasMap.set(alias, asset)
		}
	}
}
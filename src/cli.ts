#!/usr/bin/env node

import fs from 'fs'
import minimist from 'minimist'
import path from 'path'
import { fileURLToPath } from 'url'
import * as toml from 'toml'
import log from '@mwni/log'
import descriptor from '../package.json' with { type: 'json' }
import startServer from './server.js'
import type { AppConfig, AppContext } from './types.js'
import { loadAssetLists } from './registry.js'

const args = minimist(process.argv.slice(2) || [])

log.info(`*** CAIP ASSET REGISTRY v${descriptor.version} ***`)
log.info(`working dir is ${path.resolve()}`)

if(!fs.existsSync('config.toml')){
	log.error(`no config.toml in working dir`)
	process.exit(1)
}

try {
	var configText: string = fs.readFileSync("config.toml", "utf-8")
	var config: AppConfig = toml.parse(configText)
} catch (error) {
	log.error(`corrupt config.toml in working dir`)
	log.error(error)
	process.exit(1)
}

log.config({ level: args.log || config.log.level })

const ctx: AppContext = {
	srcDir: path.dirname(fileURLToPath(import.meta.url)),
	version: descriptor.version,
	config,
	assetList: []
}

const action = args._[0] ?? 'run'

switch(action){
	case 'run': {
		loadAssetLists(ctx)
		startServer(ctx)
		break
	}
	default: {
		log.error(`unknown action "${action}"`)
		process.exit(1)
	}
}

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
import { initRegistry } from './registry.js'
import { openDb } from './db.js'

const args = minimist(process.argv.slice(2) || [])

log.info(`*** CAIP-19 REGISTRY v${descriptor.version} ***`)

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

const srcDir = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(srcDir, '..', config.data.dir)

if(!fs.existsSync(dataDir))
	fs.mkdirSync(dataDir)

log.config({ level: args.log || config.log.level })
log.info(`data dir is ${dataDir}`)

const ctx: AppContext = {
	srcDir,
	dataDir,
	version: descriptor.version,
	config,
	db: openDb(dataDir),
	chains: [],
	assets: []
}

const action = args._[0] ?? 'run'

switch(action){
	case 'run': {
		initRegistry(ctx)
		startServer(ctx)
		break
	}
	default: {
		log.error(`unknown action "${action}"`)
		process.exit(1)
	}
}

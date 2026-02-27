export type AppConfig = {
	data: {
		dir: string
	},
	server: {
		address: string
		port: number
	},
	log: {
		level: string
	}
}

import type Database from 'better-sqlite3'

export type AppContext = {
	srcDir: string,
	dataDir: string,
	version: string,
	config: AppConfig,
	db: Database,
	chains: Array<Caip2Chain>,
	assets: Array<Caip19Asset>,
	server?: { close: () => void },
}

export type Caip2Chain = {
	id: string,
	name: string,
	aliases: Array<string>
}

export type Caip19Asset = {
	id: string,
	chain: Caip2Chain,
	name: string,
	symbol: string
	aliases: Array<string>,
	chainAliases: Array<string>
}
export type AppConfig = {
	server: {
		address: string
		port: number
	},
	log: {
		level: string
	}
}

export type AppContext = {
	srcDir: string
	version: string
	config: AppConfig
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
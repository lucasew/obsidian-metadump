import { Plugin } from 'obsidian';


export default class Dumper extends Plugin {

	async dumpMetadata() {
		console.log("dumping...")
		// TODO: assert this is happening only once concurrently
		console.log((this.app.vault as any).fileMap)
		await this.saveData((this.app.vault as any).fileMap)
	}

	async onload() {
		console.log('loading plugin');

		this.addCommand({
			id: 'dump-metadata',
			name: 'Dump metadata file',
			callback: () => {
				this.dumpMetadata()
			},
		});

		this.registerInterval(window.setInterval(() => this.dumpMetadata(), 1000 * 300)) // 5 minutes
	}

	onunload() {
		console.log('unloading plugin');
	}
}

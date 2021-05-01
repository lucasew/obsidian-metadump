import { Plugin } from 'obsidian';
import { stringify } from 'querystring';

interface Item {
	basename: string,
	extension: string,
	name: string,
	path: string,
	stat: {
		ctime: number,
		mtime: number
	}
}
function normalizeItem(item: Object) {
	const {
		basename,
		extension,
		name,
		path,
		stat: {
			ctime,
			mtime
		}
	} = item as any
	return {
		basename,
		extension,
		name,
		path,
		stat: {
			ctime,
			mtime
		}
	} as Item
}

export default class Dumper extends Plugin {

	async dumpMetadata() {
		console.log("dumping...")
		// TODO: assert this is happening only once concurrently
		const input = (this.app.vault as any).fileMap
		let ret : Record<string, Item> = {}
		Object.keys(input).forEach((key) => {
			const value = input[key]
			try { // folders does not provide stat so normalizeItem will fail
				const normalizedValue = normalizeItem(value)
				ret[normalizedValue.path] = normalizedValue
				if (!ret[normalizedValue.basename] || ret[normalizedValue.basename].path.split("/") > normalizedValue.path.split("/")) {
					ret[normalizedValue.basename] = normalizedValue
				}
			} catch {
				return
			}
			
		})
		const serialized = JSON.stringify(ret, null, 2)
		await this.app.vault.create("files.json", serialized)
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

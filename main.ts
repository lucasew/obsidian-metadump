import { App, Notice, Plugin, TFile } from 'obsidian';
import {writeFile} from 'fs'
import {join} from 'path'

const FILENAME = "meta.json";

interface Item {
	basename: string,
	extension: string,
	name: string,
	path: string,
	ctime: number,
	mtime: number
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
		ctime,
		mtime
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
				let shortKey = normalizedValue.basename
				let longKey = normalizedValue.path
				if (normalizedValue.extension === "md") {
					longKey = longKey.slice(0, longKey.length - normalizedValue.extension.length - 1)
				}
				ret[longKey] = normalizedValue
				if (ret[shortKey] === undefined || ret[shortKey].path.split("/").length > normalizedValue.path.split("/").length) {
					ret[shortKey] = normalizedValue
				}
			} catch {
				return
			}
			
		})
		try {
			const data = JSON.stringify(ret, null, 2)
			await this.app.vault.adapter.write(FILENAME, data)
		} catch (e) {
			new Notice("Failed to dump metadata. Press Ctrl+Shift+i for details.")
			console.error(e)
		}
	}

	async onload() {
		console.log('started dumping metadata');

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
		console.log('stopped dumping metadata');
	}
}

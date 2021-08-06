import { Notice, Plugin } from 'obsidian';

const FILENAME = "meta.json";

interface Item {
	basename: string,
	extension: string,
	name: string,
	path: string,
	ctime: number,
	mtime: number
}


export default class Dumper extends Plugin {
	normalizeItem(item: Object) {
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
		const backlinks = (this.app.metadataCache as any).getBacklinksForFile(item).data
		const backlinkFiles = Object.keys(backlinks)
		return {
			basename,
			extension,
			name,
			path,
			ctime,
			mtime,
			referencedBy: backlinkFiles
		} as Item
	}
	async dumpMetadata() {
		console.log("dumping...")
		// TODO: assert this is happening only once concurrently
		const input = (this.app.vault as any).fileMap
		let ret : Record<string, Item> = {}
		const promises = Object.keys(input).map((key) => {
			return new Promise<void>((res) => {
				setTimeout(() => { // WORKAROUND: don't freeze the main thread while dumping stuff. Good for big (>1k notes) vaults
					try { // folders does not provide stat so normalizeItem will fail
						if (key === "meta.json") {
							throw null // just to finally
						}
						const value = input[key]
						const normalizedValue = this.normalizeItem(value)
						let shortKey = normalizedValue.basename
						let longKey = normalizedValue.path
						if (normalizedValue.extension === "md") {
							longKey = longKey.slice(0, longKey.length - normalizedValue.extension.length - 1)
						}
						ret[longKey] = normalizedValue
						if (ret[shortKey] === undefined || ret[shortKey].path.split("/").length > normalizedValue.path.split("/").length) {
							ret[shortKey] = normalizedValue
						}
					} 
					catch {}
					finally {
						res()
					}
				}, 1)
			})
		})
		try {
			await Promise.all(promises)
			const data = JSON.stringify(ret, null, 2)
			await this.app.vault.adapter.write(FILENAME, data)
		} catch(e) {
			new Notice("Failed to dump metadata. Press Ctrl+Shift+i for details.")
			console.error(e)
		} finally {
			console.log("metadump success")
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

import { App, Notice } from 'obsidian';
import { reportError } from './errorReporter';

export interface Item {
	basename: string,
	extension: string,
	name: string,
	path: string,
	ctime: number,
	mtime: number,
	referencedBy?: string[]
}

const YIELD_DELAY_MS = 1;
const FILENAME = "meta.json";

export class MetadataDumper {
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	normalizeItem(item: Object): Item {
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
					catch(e) {
						if (e !== null) {
							reportError(`Failed to normalize item for key ${key}`, e);
						}
					}
					finally {
						res()
					}
				}, YIELD_DELAY_MS)
			})
		})
		try {
			await Promise.all(promises)
			const data = JSON.stringify(ret, null, 2)
			await this.app.vault.adapter.write(FILENAME, data)
		} catch(e) {
			new Notice("Failed to dump metadata. Press Ctrl+Shift+i for details.")
			reportError("Failed to write metadata file", e);
		} finally {
			console.log("metadump success")
		}
	}
}

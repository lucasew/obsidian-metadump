import { Notice, Plugin } from 'obsidian';

const FILENAME = "meta.json";

/**
 * Represents the normalized metadata for a single entity in the vault.
 * Extracted by external tools or personal automations to build offline graphs
 * without needing to parse the markdown contents directly.
 */
interface Item {
	basename: string,
	extension: string,
	name: string,
	path: string,
	ctime: number,
	mtime: number
}


/**
 * Main Obsidian plugin entrypoint. Orchestrates periodic extraction of the vault's
 * file metadata and backlink graph, persisting it to a unified JSON file.
 * This decoupled approach allows separate external scripts to consume the vault
 * state reliably.
 */
export default class Dumper extends Plugin {
	/**
	 * Transforms an internal Obsidian file object into a standardized `Item` format,
	 * enriching it with resolved backlinks from the global `metadataCache`.
	 *
	 * @param item - Raw Obsidian file/folder object from the internal `fileMap`.
	 * @returns The structured metadata, including a dynamically injected `referencedBy` array.
	 *
	 * @throws Will fail silently (caught by caller) if the item is a folder, as folders
	 * lack the required `stat` (ctime/mtime) properties.
	 */
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
	/**
	 * Asynchronously scans the entire vault and serializes the metadata graph to disk.
	 *
	 * **Performance considerations:**
	 * To prevent freezing the Obsidian UI on large vaults (>1k notes), the iteration
	 * is chunked using `setTimeout(..., 1)`. This macro-task scheduling yields the main
	 * thread between processing each file.
	 *
	 * **Edge Cases handled:**
	 * - Skips the target `meta.json` file to prevent recursive processing.
	 * - Gracefully handles and ignores folders (via try/catch around `normalizeItem`).
	 * - Deduplicates entries by prioritizing the shortest path when filenames collide.
	 *
	 * **Side Effects:**
	 * Overwrites `meta.json` in the root of the vault. Spawns a UI `Notice` if the write fails.
	 */
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

	/**
	 * Bootstraps the plugin lifecycle upon activation.
	 * Registers a manual command palette trigger and establishes a 5-minute
	 * background polling interval to keep the JSON graph eventually consistent.
	 */
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

	/**
	 * Lifecycle hook called when the plugin is disabled or Obsidian is closing.
	 * (Note: Intervals registered via `registerInterval` are automatically cleaned up by Obsidian).
	 */
	onunload() {
		console.log('stopped dumping metadata');
	}
}

import { Notice, Plugin } from 'obsidian';

const FILENAME = "meta.json";

/**
 * Represents the normalized metadata for a single item (file or folder) in the vault.
 */
interface Item {
	/** The file name without the extension (e.g., "my-note"). */
	basename: string;
	/** The file extension (e.g., "md"). */
	extension: string;
	/** The full file name with extension (e.g., "my-note.md"). */
	name: string;
	/** The full path relative to the vault root (e.g., "folder/my-note.md"). */
	path: string;
	/** Creation time of the file in milliseconds since epoch. */
	ctime: number;
	/** Last modification time of the file in milliseconds since epoch. */
	mtime: number;
	/**
	 * Array of paths to other files that link to this item.
	 * Dynamically populated using Obsidian's internal metadataCache.
	 */
	referencedBy?: string[];
}


/**
 * The main plugin class responsible for periodically scanning the Obsidian vault
 * and dumping metadata (file paths, timestamps, and backlinks) into a JSON file.
 * This enables external scripts or personal automations to consume vault metadata.
 */
export default class Dumper extends Plugin {
	/**
	 * Extracts and normalizes metadata from an Obsidian file/folder object.
	 * Resolves backlinks for the item using the internal metadataCache.
	 *
	 * @param item - The raw file or folder object from the Obsidian vault.
	 * @returns The normalized `Item` metadata, including an array of files that link to it.
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
	 * Iterates over all files in the vault, normalizes their metadata, and writes
	 * the aggregated result to the target JSON file.
	 *
	 * To prevent UI freezes in large vaults, processing is yielded to the event loop
	 * via `setTimeout`.
	 *
	 * Side effects:
	 * - Writes to the file system (`meta.json` in the vault root).
	 * - Shows a Notice in the Obsidian UI if the dump fails.
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
	 * Plugin lifecycle hook: called when the plugin is loaded by Obsidian.
	 * Registers the manual command palette action and sets up the 5-minute interval
	 * for automatic background metadata dumping.
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
	 * Plugin lifecycle hook: called when the plugin is disabled or Obsidian is closed.
	 */
	onunload() {
		console.log('stopped dumping metadata');
	}
}

import { App, Notice } from 'obsidian';
import { Item } from './types';
import { reportError } from './errorReporter';

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
			stat
		} = item as any;

		// Folders don't have stat. Let's return a partial object that lacks ctime/mtime
		// Or we can throw an error if it's strictly unexpected. But folders are expected.
		const ctime = stat ? stat.ctime : 0;
		const mtime = stat ? stat.mtime : 0;

		const backlinks = (this.app.metadataCache as any).getBacklinksForFile(item)?.data || {};
		const backlinkFiles = Object.keys(backlinks);

		return {
			basename,
			extension,
			name,
			path,
			ctime,
			mtime,
			referencedBy: backlinkFiles
		};
	}

	async dumpMetadata(): Promise<void> {
		console.log("dumping...");
		// TODO: assert this is happening only once concurrently
		const input = (this.app.vault as any).fileMap;
		let ret: Record<string, Item> = {};

		const promises = Object.keys(input).map((key) => {
			return new Promise<void>((res) => {
				setTimeout(() => { // WORKAROUND: don't freeze the main thread while dumping stuff. Good for big (>1k notes) vaults
					try {
						if (key === FILENAME) {
							// skip the output file
							return;
						}

						const value = input[key];

						// skip items without stat (like folders)
						if (!value.stat) {
							return;
						}

						const normalizedValue = this.normalizeItem(value);
						let shortKey = normalizedValue.basename;
						let longKey = normalizedValue.path;

						if (normalizedValue.extension === "md") {
							longKey = longKey.slice(0, longKey.length - normalizedValue.extension.length - 1);
						}

						ret[longKey] = normalizedValue;

						if (ret[shortKey] === undefined || ret[shortKey].path.split("/").length > normalizedValue.path.split("/").length) {
							ret[shortKey] = normalizedValue;
						}
					} catch (e) {
						reportError(`Failed to process item: ${key}`, e, { key, item: input[key] });
					} finally {
						res();
					}
				}, 1);
			});
		});

		try {
			await Promise.all(promises);
			const data = JSON.stringify(ret, null, 2);
			await this.app.vault.adapter.write(FILENAME, data);
		} catch (e) {
			new Notice("Failed to dump metadata. Press Ctrl+Shift+i for details.");
			reportError("Failed to write metadata dump", e);
		} finally {
			console.log("metadump success");
		}
	}
}

import { Notice, Plugin } from 'obsidian';
import { MetadataDumper } from './MetadataDumper';
import { reportError } from './errorReporter';

export default class DumperPlugin extends Plugin {
	private dumper: MetadataDumper;

	async onload() {
		console.log('started dumping metadata');

		try {
			this.dumper = new MetadataDumper(this.app);

			this.addCommand({
				id: 'dump-metadata',
				name: 'Dump metadata file',
				callback: () => {
					this.dumper.dumpMetadata().catch((e) => {
						reportError("Failed to dump metadata via command", e);
					});
				},
			});

			this.registerInterval(window.setInterval(() => {
				this.dumper.dumpMetadata().catch((e) => {
					reportError("Failed to dump metadata via interval", e);
				});
			}, 1000 * 300)); // 5 minutes
		} catch (e) {
			reportError("Failed to initialize MetadataDumper", e);
		}
	}

	onunload() {
		console.log('stopped dumping metadata');
	}
}

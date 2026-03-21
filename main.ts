import { Plugin } from 'obsidian';
import { MetadataDumper } from './src/MetadataDumper';
import { reportError } from './src/errorReporter';

const DUMP_INTERVAL_MS = 1000 * 300;

export default class Dumper extends Plugin {
	private dumper: MetadataDumper;

	async onload() {
		console.log('started dumping metadata');

		this.dumper = new MetadataDumper(this.app);

		this.addCommand({
			id: 'dump-metadata',
			name: 'Dump metadata file',
			callback: () => {
				this.dumper.dumpMetadata().catch(e => {
					reportError("Failed command execution for dumpMetadata", e);
				});
			},
		});

		this.registerInterval(window.setInterval(() => {
			this.dumper.dumpMetadata().catch(e => {
				reportError("Failed interval execution for dumpMetadata", e);
			});
		}, DUMP_INTERVAL_MS));
	}

	onunload() {
		console.log('stopped dumping metadata');
	}
}

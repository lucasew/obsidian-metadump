import { Plugin } from 'obsidian';
import { MetadataDumper } from './metadataDumper';

export default class Dumper extends Plugin {
	private dumper: MetadataDumper;

	async onload() {
		console.log('started dumping metadata');
		this.dumper = new MetadataDumper(this.app);

		this.addCommand({
			id: 'dump-metadata',
			name: 'Dump metadata file',
			callback: () => {
				this.dumper.dumpMetadata()
			},
		});

		this.registerInterval(window.setInterval(() => this.dumper.dumpMetadata(), 1000 * 300)) // 5 minutes
	}

	onunload() {
		console.log('stopped dumping metadata');
	}
}
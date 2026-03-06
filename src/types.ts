export interface Item {
	basename: string;
	extension: string;
	name: string;
	path: string;
	ctime: number;
	mtime: number;
	referencedBy?: string[];
}

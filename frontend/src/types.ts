export type JobStatus = 'uploading' | 'processing' | 'success' | 'error';

export interface ProcessResult {
	id: string;
	pdfName: string;
	pngName: string;
}

export interface Job {
	id: string;
	name: string;
	size: number;
	status: JobStatus;
	error: string;
	result: ProcessResult | null;
	activeStep: number;
	showPreview: boolean;
	fileObject: File | null;
}

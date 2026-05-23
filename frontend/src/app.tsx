import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Dropzone } from './components/dropzone';
import { Footer } from './components/footer';
import { Header } from './components/header';
import { JobItem } from './components/job-item';
import { ThemeToggle } from './components/theme-toggle';
import type { Job } from './types';

export default function App() {
	const [jobs, setJobs] = useState<Job[]>([]);

	const processUploadedFiles = (files: File[]) => {
		const newJobs: Job[] = files.map((file) => {
			const jobId = `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
			const isRtf = file.name.toLowerCase().endsWith('.rtf');
			return {
				id: jobId,
				name: file.name,
				size: file.size,
				status: isRtf ? 'uploading' : 'error',
				error: isRtf
					? ''
					: 'Недопустимый формат файла. Допускаются только .rtf файлы.',
				result: null,
				activeStep: 0,
				showPreview: false,
				fileObject: isRtf ? file : null,
			};
		});

		setJobs((prev) => [...newJobs, ...prev]);

		newJobs.forEach((job) => {
			if (job.status === 'uploading' && job.fileObject) {
				uploadJob(job.id, job.fileObject);
			}
		});
	};

	const uploadJob = async (jobId: string, file: File) => {
		let stepTimer: ReturnType<typeof setInterval> | undefined;
		const updateStep = () => {
			setJobs((prev) =>
				prev.map((j) => {
					if (j.id === jobId && j.status === 'processing') {
						return { ...j, activeStep: Math.min(j.activeStep + 1, 3) };
					}
					return j;
				}),
			);
		};

		try {
			setJobs((prev) =>
				prev.map((j) =>
					j.id === jobId ? { ...j, status: 'uploading', activeStep: 0 } : j,
				),
			);
			const formData = new FormData();
			formData.append('file', file);

			setJobs((prev) =>
				prev.map((j) =>
					j.id === jobId ? { ...j, status: 'processing', activeStep: 0 } : j,
				),
			);
			stepTimer = setInterval(updateStep, 1300);

			const response = await fetch('/upload', {
				method: 'POST',
				body: formData,
			});
			clearInterval(stepTimer);

			if (!response.ok) {
				let errorMsg = 'Ошибка конвертации на сервере';
				try {
					const errData = await response.json();
					errorMsg = errData.error || errorMsg;
				} catch {}
				throw new Error(errorMsg);
			}

			const resultData = await response.json();
			setJobs((prev) =>
				prev.map((j) =>
					j.id === jobId
						? { ...j, status: 'success', activeStep: 4, result: resultData }
						: j,
				),
			);
		} catch (err: any) {
			if (stepTimer) clearInterval(stepTimer);
			setJobs((prev) =>
				prev.map((j) =>
					j.id === jobId
						? {
								...j,
								status: 'error',
								error: err.message || 'Ошибка обработки.',
							}
						: j,
				),
			);
		}
	};

	const retryJob = (jobId: string) => {
		const job = jobs.find((j) => j.id === jobId);
		if (job && job.fileObject) uploadJob(jobId, job.fileObject);
	};

	const deleteJob = (jobId: string) =>
		setJobs((prev) => prev.filter((j) => j.id !== jobId));
	const togglePreview = (jobId: string) =>
		setJobs((prev) =>
			prev.map((j) =>
				j.id === jobId ? { ...j, showPreview: !j.showPreview } : j,
			),
		);
	const clearAllJobs = () => setJobs([]);

	const hasJobs = jobs.length > 0;

	return (
		<div className="w-full flex-grow flex flex-col items-center py-12 px-4">
			<ThemeToggle />
			<div className="max-w-3xl w-full flex flex-col gap-6 md:gap-8">
				<Header />

				<Dropzone hasJobs={hasJobs} onFilesAdded={processUploadedFiles} />

				{hasJobs && (
					<div className="flex flex-col gap-4 animate-in fade-in duration-300">
						<div className="flex justify-between items-center px-1">
							<span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
								Очередь обработки ({jobs.length})
							</span>
							<button
								onClick={clearAllJobs}
								className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition flex items-center gap-1.5 px-2 py-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-900/50"
							>
								<Trash2 className="h-3.5 w-3.5" /> Очистить список
							</button>
						</div>
						<div className="flex flex-col gap-4">
							{jobs.map((job) => (
								<JobItem
									key={job.id}
									job={job}
									onDelete={deleteJob}
									onRetry={retryJob}
									onTogglePreview={togglePreview}
								/>
							))}
						</div>
					</div>
				)}
			</div>
			<Footer />
		</div>
	);
}

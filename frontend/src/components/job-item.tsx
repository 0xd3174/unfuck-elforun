import {
	FileText,
	Image as ImageIcon,
	Download,
	AlertCircle,
	RefreshCw,
	Trash2,
	Eye,
	EyeOff,
} from 'lucide-react';

import type { Job } from '../types';
import { formatBytes, processingSteps } from '../utils';

interface JobItemProps {
	job: Job;
	onDelete: (id: string) => void;
	onRetry: (id: string) => void;
	onTogglePreview: (id: string) => void;
}

export function JobItem({
	job,
	onDelete,
	onRetry,
	onTogglePreview,
}: JobItemProps) {
	return (
		<div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm dark:shadow-lg relative overflow-hidden flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300">
			<div className="flex justify-between items-start gap-4">
				<div className="flex items-center gap-3">
					<div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl text-zinc-500 dark:text-zinc-400">
						<FileText className="h-5 w-5" />
					</div>
					<div className="flex flex-col">
						<span
							className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 truncate max-w-xs md:max-w-md"
							title={job.name}
						>
							{job.name}
						</span>
						<span className="text-[11px] text-zinc-500">
							{formatBytes(job.size)}
						</span>
					</div>
				</div>
				<div className="flex items-center gap-3">
					{job.status === 'uploading' && (
						<span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
							Загрузка...
						</span>
					)}
					{job.status === 'processing' && (
						<span className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40 px-2.5 py-0.5 rounded-full text-[11px] font-semibold animate-pulse">
							Обработка...
						</span>
					)}
					{job.status === 'success' && (
						<span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
							Готово
						</span>
					)}
					{job.status === 'error' && (
						<span className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
							Ошибка
						</span>
					)}
					<button
						onClick={() => onDelete(job.id)}
						className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-950 rounded transition"
					>
						<Trash2 className="h-4 w-4" />
					</button>
				</div>
			</div>

			{job.status === 'processing' && (
				<div className="flex flex-col gap-2 mt-1 animate-in fade-in">
					<div className="flex justify-between items-center text-xs">
						<span className="text-zinc-600 dark:text-zinc-400 font-medium">
							{processingSteps[job.activeStep]}
						</span>
						<span className="text-zinc-500">{job.activeStep + 1} / 5</span>
					</div>
					<div className="w-full bg-zinc-100 dark:bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-900">
						<div
							className="bg-zinc-500 dark:bg-zinc-400 h-full rounded-full transition-all duration-500"
							style={{ width: `${((job.activeStep + 1) / 5) * 100}%` }}
						></div>
					</div>
				</div>
			)}

			{job.status === 'error' && (
				<div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-200 p-3 rounded-lg flex items-start gap-2.5 text-xs animate-in fade-in">
					<AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
					<div className="flex flex-col gap-2 w-full">
						<span>{job.error}</span>
						{job.fileObject && (
							<button
								onClick={() => onRetry(job.id)}
								className="px-2.5 py-1 w-fit border border-red-300 dark:border-red-900/60 bg-red-100 dark:bg-red-950/40 hover:bg-red-200 dark:hover:bg-red-950/80 transition rounded text-[10px] font-semibold text-red-700 dark:text-red-100 flex items-center gap-1"
							>
								<RefreshCw className="h-3 w-3" /> Повторить попытку
							</button>
						)}
					</div>
				</div>
			)}

			{job.status === 'success' && job.result && (
				<div className="flex flex-col gap-3 mt-1 animate-in fade-in duration-300">
					<div className="flex flex-wrap items-center gap-3">
						<a
							href={`/download/${job.result.id}/${job.result.pdfName}`}
							download={`${job.name.replace(/\.[^/.]+$/, '')}.pdf`}
							className="inline-flex items-center gap-1.5 py-2 px-4 bg-zinc-900 dark:bg-zinc-50 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-950 rounded-lg text-xs font-bold transition shadow-sm"
						>
							<Download className="h-3.5 w-3.5" /> Скачать PDF
						</a>
						<a
							href={`/download/${job.result.id}/${job.result.pngName}`}
							download={`${job.name.replace(/\.[^/.]+$/, '')}_chart.png`}
							className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-semibold transition"
						>
							<ImageIcon className="h-3.5 w-3.5" /> Скачать график (PNG)
						</a>
						<button
							onClick={() => onTogglePreview(job.id)}
							className={`inline-flex items-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-semibold transition ml-auto ${job.showPreview ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'}`}
						>
							{job.showPreview ? (
								<EyeOff className="h-3.5 w-3.5" />
							) : (
								<Eye className="h-3.5 w-3.5" />
							)}
							{job.showPreview ? 'Скрыть график' : 'Показать график'}
						</button>
					</div>
					{job.showPreview && (
						<div className="border border-zinc-200 dark:border-zinc-950 bg-zinc-50 dark:bg-zinc-950/50 rounded-lg p-4 flex flex-col gap-2 mt-1 animate-in slide-in-from-top-2 duration-300">
							<span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
								Предпросмотр хроматограммы
							</span>
							<div className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900/60 rounded flex items-center justify-center p-3">
								<img
									src={`/download/${job.result.id}/${job.result.pngName}`}
									alt="Хроматограмма"
									className="max-h-[220px] w-auto max-w-full object-contain rounded shadow-sm border border-zinc-100 dark:border-zinc-900 select-none"
								/>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

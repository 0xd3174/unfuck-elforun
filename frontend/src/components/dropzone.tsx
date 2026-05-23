import { UploadCloud } from 'lucide-react';
import { useRef, useState } from 'react';

interface DropzoneProps {
	hasJobs: boolean;
	onFilesAdded: (files: File[]) => void;
}

export function Dropzone({ hasJobs, onFilesAdded }: DropzoneProps) {
	const [dragActive, setDragActive] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleDrag = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === 'dragenter' || e.type === 'dragover') {
			setDragActive(true);
		} else if (e.type === 'dragleave') {
			setDragActive(false);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);
		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			onFilesAdded(Array.from(e.dataTransfer.files));
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			onFilesAdded(Array.from(e.target.files));
		}
	};

	const triggerFileSelect = () => fileInputRef.current?.click();

	return (
		<div
			onDragEnter={handleDrag}
			onDragOver={handleDrag}
			onDragLeave={handleDrag}
			onDrop={handleDrop}
			onClick={triggerFileSelect}
			className={`border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-3 group
        ${
					hasJobs
						? 'py-6 px-8 border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10 hover:border-zinc-400 dark:hover:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900/20'
						: 'py-12 px-10 md:py-16 md:px-14 border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/30 hover:border-zinc-400 dark:hover:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-900/40 scale-[0.99] hover:scale-[1.0]'
				}
        ${dragActive ? 'border-blue-400 dark:border-zinc-400 bg-blue-50 dark:bg-zinc-900/60' : ''}`}
		>
			<input
				ref={fileInputRef}
				type="file"
				onChange={handleFileChange}
				accept=".rtf"
				multiple
				className="hidden"
			/>
			<div
				className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl group-hover:scale-110 transition duration-300 group-hover:border-zinc-300 dark:group-hover:border-zinc-700 shadow-sm ${hasJobs ? 'p-2' : 'p-4'}`}
			>
				<UploadCloud
					className={`text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition ${hasJobs ? 'h-6 w-6' : 'h-8 w-8'}`}
				/>
			</div>
			<div className="flex flex-col gap-1">
				<h3
					className={`font-semibold text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 ${hasJobs ? 'text-sm' : 'text-base'}`}
				>
					{hasJobs ? 'Перетащите сюда ещё файлы' : 'Перетащите сюда RTF-отчеты'}
				</h3>
				{!hasJobs && (
					<p className="text-zinc-500 text-sm max-w-xs mx-auto">
						Или кликните для выбора нескольких файлов на устройстве
					</p>
				)}
			</div>
		</div>
	);
}

export function formatBytes(bytes: number) {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export const processingSteps = [
	'Загрузка RTF-отчета',
	'Конвертация в PDF (LibreOffice)',
	'Декодирование WMF-графика',
	'Кадрирование в Pillow',
	'Готово!',
];

import { Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

export function ThemeToggle() {
	const [theme, setTheme] = useState<'light' | 'dark'>(() => {
		if (typeof window !== 'undefined') {
			return localStorage.getItem('theme') === 'light' ? 'light' : 'dark';
		}
		return 'dark';
	});

	useEffect(() => {
		if (theme === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
		localStorage.setItem('theme', theme);
	}, [theme]);

	return (
		<div className="w-full flex justify-end max-w-3xl mb-4">
			<button
				onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
				className="p-2.5 rounded-full bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors shadow-sm"
				title="Переключить тему"
			>
				{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
			</button>
		</div>
	);
}

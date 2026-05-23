export function Header() {
	return (
		<div className="flex flex-row items-center justify-center gap-3 md:gap-4">
			<img
				src="/logo.png"
				alt="Logo"
				className="w-10 h-10 md:w-12 md:h-12 object-contain dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]"
			/>
			<h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-700 via-zinc-500 to-zinc-900 dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-500 bg-clip-text text-transparent">
				UF Elforun
			</h1>
		</div>
	);
}

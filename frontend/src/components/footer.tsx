export function Footer() {
  return (
    <footer className="w-full text-center py-6 mt-auto text-xs text-zinc-500 dark:text-zinc-600 z-10 flex flex-row items-center justify-center gap-1.5">
      <span>Исходный код этого сайта открыт —</span>
      <a
        href="https://github.com/0xd3174/unfuck-elforun"
        target="_blank"
        rel="noopener noreferrer"
        className="text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors duration-200 underline decoration-zinc-300 dark:decoration-zinc-700 underline-offset-2 flex items-center gap-1"
      >
        GitHub
      </a>
    </footer>
  );
}

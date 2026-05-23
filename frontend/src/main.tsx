import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// oxlint-disable import/no-unassigned-import
import './index.css';
import App from './app.tsx';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);

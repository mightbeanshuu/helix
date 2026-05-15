import { Route, Routes } from 'react-router-dom';

import { Landing } from './Landing.js';
import { ScanView } from './ScanView.js';

export function App(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/scan/:id" element={<ScanView />} />
      <Route
        path="*"
        element={
          <div className="grid h-full place-items-center text-helix-fg-muted">
            <div>404 — not in the map</div>
          </div>
        }
      />
    </Routes>
  );
}

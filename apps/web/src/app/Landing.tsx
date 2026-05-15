import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Logo } from '../components/Logo.js';
import { api } from '../lib/api.js';

const EXAMPLES = [
  'https://github.com/expressjs/express',
  'https://github.com/pallets/flask',
  'https://github.com/django/django',
];

export function Landing(): JSX.Element {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');

  const recent = useQuery({
    queryKey: ['scans'],
    queryFn: () => api.listScans(),
  });

  const mutation = useMutation({
    mutationFn: api.createScan,
    onSuccess: (data) => navigate(`/scan/${data.scanId}`),
  });

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-12">
      <div className="flex items-center gap-3">
        <Logo size={48} />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Helix</h1>
          <p className="text-sm text-helix-fg-muted">Untangle the DNA of any codebase.</p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (url.trim()) mutation.mutate({ url: url.trim() });
        }}
        className="panel mt-10 w-full p-6"
      >
        <label htmlFor="url" className="mb-2 block text-sm text-helix-fg-muted">
          Git URL or absolute path
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            className="input"
            autoFocus
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!url.trim() || mutation.isPending}
          >
            {mutation.isPending ? 'Queuing…' : 'Map it →'}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-helix-fg-muted">
          <span>Try:</span>
          {EXAMPLES.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUrl(u)}
              className="rounded border border-helix-border px-1.5 py-0.5 font-mono hover:border-helix-accent hover:text-white"
            >
              {u.replace('https://github.com/', '')}
            </button>
          ))}
        </div>
        {mutation.error && (
          <p className="mt-3 text-sm text-helix-danger">{mutation.error.message}</p>
        )}
      </form>

      <section className="mt-10 w-full">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-helix-fg-muted">
          Recent scans
        </h2>
        <div className="panel divide-y divide-helix-border">
          {recent.data?.scans.length ? (
            recent.data.scans.map((s) => (
              <button
                key={s.scanId}
                onClick={() => navigate(`/scan/${s.scanId}`)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-helix-bg-alt"
              >
                <span className="truncate font-mono">{s.url}</span>
                <span
                  className={
                    s.stage === 'done'
                      ? 'text-helix-ok'
                      : s.stage === 'failed'
                        ? 'text-helix-danger'
                        : 'text-helix-fg-muted'
                  }
                >
                  {s.stage} · {s.percent}%
                </span>
              </button>
            ))
          ) : (
            <p className="px-4 py-4 text-sm text-helix-fg-muted">No scans yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

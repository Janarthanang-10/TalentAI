import { useState } from "react";

export default function GitHubInput({ onAnalyze, loading = false }) {
  const [githubUrl, setGithubUrl] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const url = githubUrl.trim();

    if (!url) {
      return;
    }

    onAnalyze(url);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">
          GitHub Projects
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Enter a candidate's GitHub profile to analyze their public projects.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/username"
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
          />

          <button
            type="submit"
            disabled={loading || !githubUrl.trim()}
            className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze Projects"}
          </button>
        </div>
      </form>
    </div>
  );
}

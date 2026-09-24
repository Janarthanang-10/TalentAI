import React, { useState } from "react";
import { Github, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function GitHubInput({ onAnalyze, loading = false, placeholder = "https://github.com/username or user/repo" }) {
  const [githubUrl, setGithubUrl] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = githubUrl.trim();
    if (!url) return;
    onAnalyze(url);
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-[rgba(255,255,255,0.06)] relative overflow-hidden">
      <div className="mb-4">
        <h2 className="font-syne text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Github size={20} className="text-[#8B5CF6]" />
          GitHub Repository & Profile Input
        </h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Enter a candidate's GitHub profile or repository to analyze public projects and code.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder={placeholder}
            disabled={loading}
            className="flex-1 glass-panel px-4 py-3 rounded-xl text-sm outline-none transition focus:border-[#8B5CF6] text-[var(--text-primary)] placeholder-[var(--text-dim)] disabled:opacity-50"
          />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || !githubUrl.trim()}
            className="clay-btn px-6 py-3 font-syne font-bold text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.9), rgba(88,28,135,0.9))",
              boxShadow: "0 4px 20px rgba(139,92,246,0.3)"
            }}
          >
            <Search size={16} />
            {loading ? "Analyzing..." : "Analyze Projects"}
          </motion.button>
        </div>
      </form>
    </div>
  );
}

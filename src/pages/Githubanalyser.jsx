import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Github,
  Search,
  CheckCircle2,
  XCircle,
  Code2,
  GitBranch,
  Star,
  Users,
} from "lucide-react";
import { callAI } from "../api/ai";
import { fetchGitHubData } from "../api/github";
import LoadingBeam from "../components/LoadingBeam";

export default function GithubAnalyser() {
  const [githubUrl, setGithubUrl] = useState("");
  const [githubData, setGithubData] = useState("");
  const [result, setResult] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error, setError] = useState("");

  const handleFetch = async () => {
    if (!githubUrl.trim()) {
      setError("Please paste a GitHub profile or repository link.");
      return;
    }

    setIsFetching(true);
    setError("");
    setResult(null);

    try {
      const data = await fetchGitHubData(githubUrl.trim());
      setGithubData(data);
    } catch (err) {
      console.error("GitHub fetch error:", err);
      setError(err.message || "Failed to fetch data from GitHub.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleAnalyse = async () => {
    if (!githubData.trim()) {
      setError("Fetch GitHub data before analysing it.");
      return;
    }

    setIsAnalysing(true);
    setError("");
    setResult(null);

    const systemPrompt = `You are an expert software engineering recruiter.
Analyse the provided GitHub profile/repository data.

Return ONLY valid JSON, with no markdown and no code fences.
Use this exact structure:
{
  "profileSummary": "Short summary of the developer or repository.",
  "technicalSkills": ["skill 1", "skill 2", "skill 3"],
  "projectQuality": "Short assessment based only on the provided GitHub data.",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "areasToImprove": ["area 1", "area 2"],
  "activity": "Short description of visible activity.",
  "recommendation": "Short factual hiring-relevant observation, without making a hiring decision."
}`;

    try {
      const responsePrompt = `GitHub URL:
${githubUrl.trim()}

GitHub Data:
${githubData.substring(0, 12000)}`;

      const rawJson = await callAI(systemPrompt, responsePrompt, true);

      let data;
      try {
        data = JSON.parse(rawJson);
      } catch (parseError) {
        const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw parseError;
        data = JSON.parse(jsonMatch[0]);
      }

      setResult({
        profileSummary: data.profileSummary || "GitHub analysis completed.",
        technicalSkills: Array.isArray(data.technicalSkills)
          ? data.technicalSkills
          : [],
        projectQuality:
          data.projectQuality || "No project quality assessment available.",
        strengths: Array.isArray(data.strengths) ? data.strengths : [],
        areasToImprove: Array.isArray(data.areasToImprove)
          ? data.areasToImprove
          : [],
        activity: data.activity || "No activity information available.",
        recommendation:
          data.recommendation || "Review the repository details directly.",
      });
    } catch (err) {
      console.error("GitHub analysis error:", err);
      setError(err.message || "Failed to analyse GitHub data.");
    } finally {
      setIsAnalysing(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto hidden-scrollbar pb-24">
      <div className="mb-8 relative z-10">
        <h1 className="font-syne text-3xl font-extrabold text-[var(--text-primary)] mb-2">
          GitHub Analyser
        </h1>
        <p className="text-[var(--text-muted)]">
          Analyse a GitHub profile or repository separately from the Resume
          Screener.
        </p>
        <div className="absolute top-0 right-0 w-64 h-64 bg-[rgba(139,92,246,0.08)] blur-3xl rounded-full pointer-events-none -z-10" />
      </div>

      <div className="space-y-6 relative z-10">
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2 ml-1">
            GitHub Profile / Repository
          </label>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username or https://github.com/user/repo"
              className="flex-1 glass-panel px-4 py-3 rounded-xl text-sm transition-all text-[var(--text-primary)] placeholder-[var(--text-dim)]"
            />

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleFetch}
              disabled={isFetching || isAnalysing || !githubUrl.trim()}
              className="clay-btn px-6 py-3 font-syne font-bold text-sm text-white whitespace-nowrap disabled:opacity-50"
              style={{
                background:
                  "linear-gradient(135deg, rgba(139,92,246,0.9), rgba(88,28,135,0.9))",
                boxShadow: "0 8px 24px rgba(139,92,246,0.3)",
              }}
            >
              <span className="flex items-center gap-2">
                <Github size={16} />
                {isFetching ? "Fetching..." : "Fetch GitHub"}
              </span>
            </motion.button>
          </div>
        </div>

        {githubData && (
          <div className="glass-panel p-5 rounded-2xl">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                <Github size={18} className="text-[var(--accent-blue)]" />
                <h2 className="font-syne font-bold text-[var(--text-primary)]">
                  GitHub Data Ready
                </h2>
              </div>

              <span className="text-xs text-[var(--text-dim)]">
                {githubData.length.toLocaleString()} characters
              </span>
            </div>

            <p className="text-sm text-[var(--text-muted)]">
              GitHub information has been fetched successfully. It is kept
              separate from the Resume Screener.
            </p>

            <motion.button
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAnalyse}
              disabled={isAnalysing || isFetching || !githubData.trim()}
              className="clay-btn w-full mt-4 py-4 font-syne font-bold text-lg text-white disabled:opacity-50"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,212,255,0.8), rgba(0,163,255,0.8))",
                boxShadow: "0 8px 32px rgba(0,212,255,0.3)",
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <Search size={18} />
                {isAnalysing ? "Analysing GitHub..." : "Analyse GitHub"}
              </span>
            </motion.button>
          </div>
        )}

        {(isFetching || isAnalysing) && (
          <div className="py-8">
            <LoadingBeam
              accent="#8B5CF6"
              text={
                isFetching
                  ? "Fetching GitHub profile and repository data..."
                  : "Analysing GitHub activity and projects..."
              }
            />
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel border-[#FF6B6B] bg-[rgba(255,107,107,0.1)] p-4 rounded-xl flex items-center gap-3 text-[#FF6B6B]"
          >
            <XCircle size={20} />
            <p className="text-sm font-medium">{error}</p>
          </motion.div>
        )}

        <AnimatePresence>
          {result && !isAnalysing && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel p-6 md:p-8 rounded-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[rgba(139,92,246,0.1)] blur-3xl rounded-full" />

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-[rgba(139,92,246,0.12)]">
                  <Github size={24} className="text-[#8B5CF6]" />
                </div>
                <div>
                  <h2 className="font-syne text-2xl font-bold text-[var(--text-primary)]">
                    GitHub Analysis
                  </h2>
                  <p className="text-sm text-[var(--text-muted)]">
                    {githubUrl}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-syne font-bold text-[var(--text-primary)] mb-2">
                  Profile Summary
                </h3>
                <p className="text-sm text-[var(--text-muted)]">
                  {result.profileSummary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-syne font-bold text-[var(--accent-blue)] mb-4">
                    <Code2 size={16} /> Technical Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.technicalSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium glass-panel text-[var(--text-primary)]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="flex items-center gap-2 text-sm font-syne font-bold text-[var(--accent-blue)] mb-4">
                    <GitBranch size={16} /> Activity
                  </h4>
                  <p className="text-sm text-[var(--text-muted)]">
                    {result.activity}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-[rgba(255,255,255,0.06)]">
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-syne font-bold text-[#00FFB2] mb-4">
                    <CheckCircle2 size={16} /> Strengths
                  </h4>
                  <ul className="space-y-3">
                    {result.strengths.map((item, index) => (
                      <li
                        key={index}
                        className="flex gap-2 text-sm text-[var(--text-primary)]"
                      >
                        <span className="text-[#00FFB2] opacity-50">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="flex items-center gap-2 text-sm font-syne font-bold text-[#FF6B6B] mb-4">
                    <XCircle size={16} /> Areas to Improve
                  </h4>
                  <ul className="space-y-3">
                    {result.areasToImprove.map((item, index) => (
                      <li
                        key={index}
                        className="flex gap-2 text-sm text-[var(--text-primary)]"
                      >
                        <span className="text-[#FF6B6B] opacity-50">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.06)]">
                <h4 className="flex items-center gap-2 text-sm font-syne font-bold text-[var(--text-primary)] mb-3">
                  <Star size={16} /> Project Quality
                </h4>
                <p className="text-sm text-[var(--text-muted)]">
                  {result.projectQuality}
                </p>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.1)]">
                <p className="text-sm text-[var(--text-primary)]">
                  <span className="font-bold">Observation:</span>{" "}
                  {result.recommendation}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

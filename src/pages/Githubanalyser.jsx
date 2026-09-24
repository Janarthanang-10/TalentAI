import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Github,
  Search,
  CheckCircle2,
  XCircle,
  Code2,
  GitBranch,
  Star,
  GitFork,
  ExternalLink,
  Users,
  FolderGit2,
  Calendar,
  Sparkles,
  Globe,
  Key,
  BookmarkPlus,
  Check,
  AlertCircle,
  Layers,
} from "lucide-react";
import { callAI } from "../api/ai";
import {
  fetchGitHubData,
  checkGitHubRateLimit,
  getGitHubToken,
  getDemoGitHubData,
} from "../api/github";
import { useCandidateStore } from "../store/useCandidateStore";
import LoadingBeam from "../components/LoadingBeam";

const LANG_COLORS = {
  JavaScript: "#F7DF1E",
  TypeScript: "#3178C6",
  Python: "#3776AB",
  Go: "#00ADD8",
  Rust: "#DEA584",
  Java: "#B07219",
  "C++": "#F34B7D",
  "C#": "#178600",
  HTML: "#E34F26",
  CSS: "#563D7C",
  Ruby: "#701516",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  HCL: "#844FBA",
};

export default function GithubAnalyser() {
  const [githubUrl, setGithubUrl] = useState("");
  const [githubPayload, setGithubPayload] = useState(null);
  const [result, setResult] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error, setError] = useState("");
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [repoFilter, setRepoFilter] = useState("all"); // 'all' | 'original' | 'stars' | 'recent'
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [expandedReadme, setExpandedReadme] = useState(null);

  const addCandidate = useCandidateStore((state) => state.addCandidate);

  // Check rate limit on mount
  useEffect(() => {
    refreshRateLimit();
  }, []);

  const refreshRateLimit = async () => {
    const info = await checkGitHubRateLimit();
    setRateLimitInfo(info);
  };

  const handleSaveToken = () => {
    if (tokenInput.trim()) {
      localStorage.setItem("talentai_github_token", tokenInput.trim());
    } else {
      localStorage.removeItem("talentai_github_token");
    }
    setShowTokenModal(false);
    setError("");
    refreshRateLimit();
  };

  const handleFetch = async (targetUrl = githubUrl) => {
    const input = (targetUrl || "").trim();
    if (!input) {
      setError("Please paste a GitHub profile (e.g. github.com/username) or repo link.");
      return;
    }

    setIsFetching(true);
    setError("");
    setResult(null);
    setGithubPayload(null);
    setSavedSuccess(false);

    try {
      const data = await fetchGitHubData(input);
      setGithubPayload(data);
      refreshRateLimit();
    } catch (err) {
      console.error("GitHub fetch error:", err);
      setError(err.message || "Failed to fetch data from GitHub.");
      refreshRateLimit();
    } finally {
      setIsFetching(false);
    }
  };

  const handleLoadDemo = () => {
    setError("");
    setGithubUrl("https://github.com/alexchen-cloud");
    const demo = getDemoGitHubData("alexchen-cloud");
    setGithubPayload(demo);
    setResult(null);
    setSavedSuccess(false);
  };

  const handleAnalyse = async () => {
    if (!githubPayload) {
      setError("Fetch GitHub data before analysing it.");
      return;
    }

    setIsAnalysing(true);
    setError("");
    setResult(null);

    const systemPrompt = `You are an expert technical hiring manager and software engineering recruiter.
Evaluate the candidate's GitHub profile, public repositories, and codebase quality.

Return ONLY valid JSON with this exact structure:
{
  "profileSummary": "Comprehensive 2-3 sentence overview of this developer's focus, technical depth, and architectural strengths.",
  "technicalSkills": ["skill 1", "skill 2", "skill 3", "skill 4", "skill 5"],
  "projectQuality": "Detailed assessment of the candidate's repositories, project complexity, documentation, and architecture.",
  "strengths": ["Key engineering strength 1", "Key engineering strength 2", "Key engineering strength 3"],
  "areasToImprove": ["Specific growth area 1", "Specific growth area 2"],
  "activity": "Summary of visible project activity, commit consistency, and maintenance.",
  "recommendation": "Decisive recruitment verdict (e.g. Strong Hire / Technical Interview Recommended) with technical rationale."
}`;

    try {
      const responsePrompt = `GitHub Target:
${githubPayload.user?.login || githubUrl}

GitHub Data:
${githubPayload.summaryText.substring(0, 10000)}`;

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
        profileSummary: data.profileSummary || "GitHub repositories analyzed successfully.",
        technicalSkills: Array.isArray(data.technicalSkills) && data.technicalSkills.length > 0
          ? data.technicalSkills
          : (githubPayload.topLanguages?.map((l) => l.name) || ["JavaScript", "Git"]),
        projectQuality: data.projectQuality || "Quality assessment completed based on repository metrics.",
        strengths: Array.isArray(data.strengths) ? data.strengths : ["Practical hands-on implementation"],
        areasToImprove: Array.isArray(data.areasToImprove) ? data.areasToImprove : ["Expand automated test coverage"],
        activity: data.activity || "Active repository maintenance visible.",
        recommendation: data.recommendation || "Recommended for technical interview review.",
      });
    } catch (err) {
      console.error("GitHub analysis error:", err);
      setError(err.message || "Failed to analyse GitHub data.");
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleSaveToCandidates = () => {
    if (!githubPayload || !result) return;
    const user = githubPayload.user || {};
    const topSkill = githubPayload.topLanguages?.[0]?.name || "Software";

    const candidatePayload = {
      id: Date.now(),
      name: user.name || user.login || "GitHub Candidate",
      role: `${topSkill} Engineer (GitHub Verified)`,
      score: Math.min(95, Math.max(70, 75 + (githubPayload.stats?.totalStars > 10 ? 10 : 5))),
      summary: result.profileSummary,
      strengths: result.strengths,
      gaps: result.areasToImprove,
      recommendation: result.recommendation.toLowerCase().includes("strong") ? "Hire" : "Maybe",
      confidence: 90,
      scannedAt: new Date().toISOString(),
      resumeText: `GitHub Profile: ${user.htmlUrl || githubUrl}\n\n${githubPayload.summaryText}`,
    };

    addCandidate(candidatePayload);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  // Filter and sort repositories for display
  const reposToDisplay = githubPayload?.repos
    ? [...githubPayload.repos]
        .filter((r) => {
          if (repoFilter === "original") return !r.isFork;
          return true;
        })
        .sort((a, b) => {
          if (repoFilter === "stars") return b.stars - a.stars;
          if (repoFilter === "recent") return new Date(b.pushedAt || 0) - new Date(a.pushedAt || 0);
          return b.stars - a.stars;
        })
    : [];

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto hidden-scrollbar pb-24">
      {/* Header & Status Bar */}
      <div className="mb-8 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-syne text-3xl font-extrabold text-[var(--text-primary)] mb-2 flex items-center gap-3">
            GitHub Repository & Profile Analyser
            <Sparkles size={24} className="text-[#8B5CF6]" />
          </h1>
          <p className="text-[var(--text-muted)]">
            Inspect real public repositories, languages breakdown, code metrics, and engineering depth.
          </p>
        </div>

        {/* Rate limit & Token pill */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTokenInput(getGitHubToken());
              setShowTokenModal(true);
            }}
            className="glass-panel px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs hover:border-[#8B5CF6] transition-colors"
            title="Configure GitHub Token"
          >
            <Key size={14} className={getGitHubToken() ? "text-[#00FFB2]" : "text-[var(--text-dim)]"} />
            <span className="font-mono text-[var(--text-primary)]">
              {getGitHubToken() ? "Token: Active" : "No Token (60/hr)"}
            </span>
            {rateLimitInfo && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${rateLimitInfo.remaining === 0 ? "bg-red-500/20 text-red-400" : "bg-white/5 text-[var(--text-muted)]"}`}>
                {rateLimitInfo.remaining} left
              </span>
            )}
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-[rgba(139,92,246,0.08)] blur-3xl rounded-full pointer-events-none -z-10" />
      </div>

      {/* Input Box & Action Controls */}
      <div className="space-y-6 relative z-10 mb-8">
        <div className="glass-panel p-4 md:p-6 rounded-2xl">
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
            GitHub Profile or Repository URL / Username
          </label>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Github size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                placeholder="e.g. Janarthanang-10, facebook/react, or https://github.com/torvalds"
                className="w-full glass-panel pl-11 pr-4 py-3.5 rounded-xl text-sm transition-all text-[var(--text-primary)] placeholder-[var(--text-dim)] focus:border-[#8B5CF6]"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleFetch()}
              disabled={isFetching || isAnalysing || !githubUrl.trim()}
              className="clay-btn px-6 py-3.5 font-syne font-bold text-sm text-white whitespace-nowrap disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.9), rgba(88,28,135,0.9))",
                boxShadow: "0 8px 24px rgba(139,92,246,0.3)",
              }}
            >
              <span className="flex items-center gap-2">
                <Search size={16} />
                {isFetching ? "Fetching Data..." : "Fetch Repositories"}
              </span>
            </motion.button>
          </div>

          {/* Quick Suggestions & Demo Mode */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-[rgba(255,255,255,0.05)]">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-dim)]">
              <span>Quick Try:</span>
              <button
                onClick={() => {
                  setGithubUrl("Janarthanang-10");
                  handleFetch("Janarthanang-10");
                }}
                className="px-2.5 py-1 rounded-lg bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[var(--text-muted)] hover:text-white transition-colors"
              >
                Janarthanang-10
              </button>
              <button
                onClick={() => {
                  setGithubUrl("facebook/react");
                  handleFetch("facebook/react");
                }}
                className="px-2.5 py-1 rounded-lg bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[var(--text-muted)] hover:text-white transition-colors"
              >
                facebook/react
              </button>
              <button
                onClick={() => {
                  setGithubUrl("torvalds");
                  handleFetch("torvalds");
                }}
                className="px-2.5 py-1 rounded-lg bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[var(--text-muted)] hover:text-white transition-colors"
              >
                torvalds
              </button>
            </div>

            <button
              onClick={handleLoadDemo}
              className="text-xs text-[#8B5CF6] hover:underline flex items-center gap-1 font-medium"
            >
              <Layers size={13} /> Load Sample Portfolio
            </button>
          </div>
        </div>

        {/* Rate Limit Alert with Quick Token Input */}
        {rateLimitInfo && rateLimitInfo.remaining === 0 && !rateLimitInfo.hasToken && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel border-amber-500/40 bg-amber-500/10 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200"
          >
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-amber-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold">GitHub IP Rate Limit Reached:</span> The unauthenticated 60 requests/hr limit is exhausted.
                Add a free GitHub Personal Access Token to get 5,000 requests/hr or load sample data.
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={() => setShowTokenModal(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition-colors"
              >
                Add Token
              </button>
              <button
                onClick={handleLoadDemo}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
              >
                Use Demo Data
              </button>
            </div>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel border-[#FF6B6B] bg-[rgba(255,107,107,0.1)] p-4 rounded-xl flex items-center justify-between gap-3 text-[#FF6B6B]"
          >
            <div className="flex items-center gap-3">
              <XCircle size={20} className="shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
            {error.includes("rate limit") && (
              <button
                onClick={handleLoadDemo}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold shrink-0"
              >
                Try Demo Portfolio
              </button>
            )}
          </motion.div>
        )}

        {/* Loading Beam */}
        {(isFetching || isAnalysing) && (
          <div className="py-8">
            <LoadingBeam
              accent="#8B5CF6"
              text={
                isFetching
                  ? "Fetching real repository metadata, stars, topics & languages..."
                  : "Synthesizing code complexity, repository architecture & technical skills..."
              }
            />
          </div>
        )}

        {/* FETCHED DATA VIEW */}
        {githubPayload && !isFetching && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Candidate / Repo Profile Header Card */}
            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                <div className="flex items-start md:items-center gap-5">
                  {githubPayload.user?.avatarUrl && (
                    <img
                      src={githubPayload.user.avatarUrl}
                      alt={githubPayload.user.name}
                      className="w-20 h-20 rounded-2xl border-2 border-[#8B5CF6]/30 shadow-lg object-cover shrink-0"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="font-syne text-2xl font-bold text-[var(--text-primary)]">
                        {githubPayload.user?.name || githubPayload.user?.login}
                      </h2>
                      <a
                        href={githubPayload.user?.htmlUrl || `https://github.com/${githubPayload.user?.login}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs px-2.5 py-1 rounded-lg bg-[rgba(255,255,255,0.06)] hover:bg-[#8B5CF6]/20 text-[var(--accent-blue)] flex items-center gap-1 transition-colors"
                      >
                        @{githubPayload.user?.login} <ExternalLink size={12} />
                      </a>
                    </div>

                    {githubPayload.user?.bio && (
                      <p className="text-sm text-[var(--text-muted)] mt-1 max-w-2xl">
                        {githubPayload.user.bio}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 items-center mt-3 text-xs text-[var(--text-dim)]">
                      {githubPayload.user?.company && (
                        <span>💼 {githubPayload.user.company}</span>
                      )}
                      {githubPayload.user?.location && (
                        <span>📍 {githubPayload.user.location}</span>
                      )}
                      {githubPayload.user?.blog && (
                        <a
                          href={githubPayload.user.blog.startsWith("http") ? githubPayload.user.blog : `https://${githubPayload.user.blog}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--accent-blue)] hover:underline flex items-center gap-1"
                        >
                          <Globe size={12} /> {githubPayload.user.blog}
                        </a>
                      )}
                      {githubPayload.user?.followers !== undefined && (
                        <span className="flex items-center gap-1">
                          <Users size={12} /> {githubPayload.user.followers} followers
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Analysis Trigger Button */}
                <div className="shrink-0 w-full md:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAnalyse}
                    disabled={isAnalysing}
                    className="clay-btn w-full md:w-auto px-6 py-4 font-syne font-bold text-white flex items-center justify-center gap-2"
                    style={{
                      background: "linear-gradient(135deg, rgba(0,212,255,0.9), rgba(0,163,255,0.9))",
                      boxShadow: "0 8px 32px rgba(0,212,255,0.3)",
                    }}
                  >
                    <Sparkles size={18} />
                    {isAnalysing ? "Analysing Code..." : "Run AI Repository Analysis"}
                  </motion.button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[rgba(255,255,255,0.06)]">
                <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]">
                  <p className="text-xs text-[var(--text-dim)] uppercase tracking-wider font-semibold">
                    Public Repos
                  </p>
                  <p className="font-syne font-bold text-xl text-[var(--text-primary)] mt-0.5">
                    {githubPayload.stats?.totalRepos || githubPayload.repos?.length || 0}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {githubPayload.stats?.originalCount || 0} original · {githubPayload.stats?.forkCount || 0} forks
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]">
                  <p className="text-xs text-[var(--text-dim)] uppercase tracking-wider font-semibold flex items-center gap-1">
                    <Star size={12} className="text-yellow-400" /> Total Stars
                  </p>
                  <p className="font-syne font-bold text-xl text-[var(--text-primary)] mt-0.5">
                    {githubPayload.stats?.totalStars || 0}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">Across public projects</p>
                </div>

                <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]">
                  <p className="text-xs text-[var(--text-dim)] uppercase tracking-wider font-semibold flex items-center gap-1">
                    <GitFork size={12} className="text-purple-400" /> Total Forks
                  </p>
                  <p className="font-syne font-bold text-xl text-[var(--text-primary)] mt-0.5">
                    {githubPayload.stats?.totalForks || 0}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">Community contributions</p>
                </div>

                <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]">
                  <p className="text-xs text-[var(--text-dim)] uppercase tracking-wider font-semibold">
                    Top Language
                  </p>
                  <p className="font-syne font-bold text-xl text-[#00FFB2] mt-0.5">
                    {githubPayload.stats?.topLanguage || "Multi"}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Last push: {githubPayload.stats?.latestPush || "Recent"}
                  </p>
                </div>
              </div>

              {/* Language Distribution Bar */}
              {githubPayload.topLanguages && githubPayload.topLanguages.length > 0 && (
                <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                  <p className="text-xs font-semibold text-[var(--text-muted)] mb-2">
                    Verified Languages Breakdown:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {githubPayload.topLanguages.slice(0, 6).map((lang, idx) => {
                      const color = LANG_COLORS[lang.name] || "#8B5CF6";
                      return (
                        <div
                          key={idx}
                          className="px-3 py-1.5 rounded-lg glass-panel flex items-center gap-2 text-xs"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-medium text-[var(--text-primary)]">
                            {lang.name}
                          </span>
                          <span className="text-[var(--text-dim)] font-mono">
                            {lang.percentage}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* AI ANALYSIS RESULTS SECTION */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.96, opacity: 0 }}
                  className="glass-panel p-6 md:p-8 rounded-2xl relative overflow-hidden border border-[#00D4FF]/30 shadow-[0_8px_32px_rgba(0,212,255,0.1)]"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[rgba(255,255,255,0.06)]">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-[#00D4FF]/10 text-[var(--accent-blue)]">
                        <Sparkles size={24} />
                      </div>
                      <div>
                        <h2 className="font-syne text-2xl font-bold text-[var(--text-primary)]">
                          AI Codebase & Profile Evaluation
                        </h2>
                        <p className="text-xs text-[var(--text-muted)]">
                          Evidence verified across {githubPayload.repos?.length || 0} repositories
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveToCandidates}
                      disabled={savedSuccess}
                      className="px-4 py-2.5 rounded-xl bg-[#00FFB2]/20 hover:bg-[#00FFB2]/30 text-[#00FFB2] border border-[#00FFB2]/30 text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,255,178,0.15)] disabled:opacity-80"
                    >
                      {savedSuccess ? (
                        <>
                          <Check size={16} /> Saved to Candidates!
                        </>
                      ) : (
                        <>
                          <BookmarkPlus size={16} /> Save to Candidate Store
                        </>
                      )}
                    </button>
                  </div>

                  {/* Summary */}
                  <div className="mb-6">
                    <h3 className="font-syne font-bold text-sm uppercase tracking-wider text-[var(--text-dim)] mb-2">
                      Executive Profile Summary
                    </h3>
                    <p className="text-sm text-[var(--text-primary)] leading-relaxed glass-panel p-4 rounded-xl bg-white/[0.02]">
                      {result.profileSummary}
                    </p>
                  </div>

                  {/* Skills & Activity Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-syne font-bold text-[var(--accent-blue)] mb-3">
                        <Code2 size={16} /> Verified Technical Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.technicalSkills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold glass-panel text-[var(--text-primary)] border border-[var(--accent-blue)]/20"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-syne font-bold text-[var(--accent-blue)] mb-3">
                        <GitBranch size={16} /> Activity & Commit Consistency
                      </h4>
                      <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                        {result.activity}
                      </p>
                    </div>
                  </div>

                  {/* Strengths & Areas to Improve */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[rgba(255,255,255,0.06)]">
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-syne font-bold text-[#00FFB2] mb-3">
                        <CheckCircle2 size={16} /> Engineering Strengths
                      </h4>
                      <ul className="space-y-2.5">
                        {result.strengths.map((item, index) => (
                          <li key={index} className="flex gap-2 text-sm text-[var(--text-primary)]">
                            <span className="text-[#00FFB2] font-bold">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-syne font-bold text-[#FF6B6B] mb-3">
                        <XCircle size={16} /> Areas to Probe / Improve
                      </h4>
                      <ul className="space-y-2.5">
                        {result.areasToImprove.map((item, index) => (
                          <li key={index} className="flex gap-2 text-sm text-[var(--text-primary)]">
                            <span className="text-[#FF6B6B] font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Project Quality & Verdict */}
                  <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.06)] space-y-4">
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-syne font-bold text-yellow-400 mb-2">
                        <Star size={16} /> Architecture & Code Quality Assessment
                      </h4>
                      <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                        {result.projectQuality}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-r from-[rgba(0,212,255,0.08)] to-[rgba(139,92,246,0.08)] border border-[rgba(0,212,255,0.2)]">
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        <span className="font-bold text-[#00D4FF]">Recruiter Takeaway:</span>{" "}
                        {result.recommendation}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ACTUAL REPOSITORIES SHOWCASE SECTION */}
            <div className="glass-panel p-6 rounded-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6]">
                    <FolderGit2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-syne text-xl font-bold text-[var(--text-primary)]">
                      Public Repositories ({reposToDisplay.length})
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      Explore candidate's real open source code, commits, and project architecture
                    </p>
                  </div>
                </div>

                {/* Filter and Sort buttons */}
                <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.05)] text-xs">
                  <button
                    onClick={() => setRepoFilter("all")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${repoFilter === "all" ? "bg-[var(--surface)] text-[var(--accent-blue)] font-bold shadow" : "text-[var(--text-dim)] hover:text-white"}`}
                  >
                    All Repos
                  </button>
                  <button
                    onClick={() => setRepoFilter("original")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${repoFilter === "original" ? "bg-[var(--surface)] text-[var(--accent-blue)] font-bold shadow" : "text-[var(--text-dim)] hover:text-white"}`}
                  >
                    Original Only
                  </button>
                  <button
                    onClick={() => setRepoFilter("stars")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${repoFilter === "stars" ? "bg-[var(--surface)] text-[var(--accent-blue)] font-bold shadow" : "text-[var(--text-dim)] hover:text-white"}`}
                  >
                    Top Starred
                  </button>
                  <button
                    onClick={() => setRepoFilter("recent")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${repoFilter === "recent" ? "bg-[var(--surface)] text-[var(--accent-blue)] font-bold shadow" : "text-[var(--text-dim)] hover:text-white"}`}
                  >
                    Recent Commits
                  </button>
                </div>
              </div>

              {/* Repos Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reposToDisplay.map((repo) => {
                  const langColor = LANG_COLORS[repo.language] || "#8B5CF6";
                  const isExpanded = expandedReadme === repo.id;

                  return (
                    <motion.div
                      key={repo.id}
                      whileHover={{ y: -3 }}
                      className="p-5 rounded-2xl glass-panel flex flex-col justify-between hover:border-[#8B5CF6]/50 transition-all border border-[rgba(255,255,255,0.06)] bg-white/[0.01]"
                    >
                      <div>
                        {/* Title and External Link */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <a
                            href={repo.htmlUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-syne font-bold text-base text-[var(--text-primary)] hover:text-[var(--accent-blue)] transition-colors flex items-center gap-1.5 group"
                          >
                            <span className="truncate">{repo.name}</span>
                            <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </a>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {repo.isFork ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">
                                Fork
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#00FFB2]/10 text-[#00FFB2] border border-[#00FFB2]/20">
                                Original
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed mb-4">
                          {repo.description}
                        </p>

                        {/* Topics */}
                        {repo.topics && repo.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {repo.topics.slice(0, 4).map((topic, tIdx) => (
                              <span
                                key={tIdx}
                                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[rgba(255,255,255,0.04)] text-[var(--text-dim)]"
                              >
                                #{topic}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer: Metrics, Language, and Dates */}
                      <div className="pt-3 border-t border-[rgba(255,255,255,0.05)] mt-auto flex items-center justify-between text-xs text-[var(--text-dim)]">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: langColor }}
                            />
                            <span className="font-medium text-[var(--text-muted)]">
                              {repo.language}
                            </span>
                          </span>

                          <span className="flex items-center gap-1 text-[var(--text-muted)]">
                            <Star size={12} className="text-yellow-400" />
                            {repo.stars}
                          </span>

                          <span className="flex items-center gap-1 text-[var(--text-muted)]">
                            <GitFork size={12} />
                            {repo.forks}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {repo.homepage && (
                            <a
                              href={repo.homepage.startsWith("http") ? repo.homepage : `https://${repo.homepage}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[var(--accent-blue)] hover:underline flex items-center gap-1 text-[11px]"
                              title="Live Demo"
                            >
                              <Globe size={11} /> Demo
                            </a>
                          )}

                          {repo.pushedAt && (
                            <span className="flex items-center gap-1 text-[11px]">
                              <Calendar size={11} />
                              {repo.pushedAt.slice(0, 10)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* README Excerpt Toggle */}
                      {repo.readme && (
                        <div className="mt-3 pt-2 border-t border-[rgba(255,255,255,0.03)]">
                          <button
                            onClick={() => setExpandedReadme(isExpanded ? null : repo.id)}
                            className="text-[11px] text-[#8B5CF6] hover:underline flex items-center gap-1"
                          >
                            {isExpanded ? "Hide README Preview" : "View README Preview"}
                          </button>
                          {isExpanded && (
                            <div className="mt-2 p-3 rounded-xl bg-black/40 text-[11px] text-[var(--text-muted)] font-mono whitespace-pre-wrap max-h-48 overflow-y-auto hidden-scrollbar border border-white/5">
                              {repo.readme}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {reposToDisplay.length === 0 && (
                <div className="p-12 text-center text-[var(--text-dim)]">
                  No repositories match the current filter.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* GitHub Token Modal */}
      <AnimatePresence>
        {showTokenModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTokenModal(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-panel p-6 md:p-8 rounded-3xl relative z-10 w-full max-w-lg border-[#8B5CF6]/30 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6]">
                  <Key size={22} />
                </div>
                <div>
                  <h3 className="font-syne text-xl font-bold text-[var(--text-primary)]">
                    GitHub Personal Access Token
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Increases GitHub API rate limit from 60 to 5,000 requests/hour
                  </p>
                </div>
              </div>

              <div className="space-y-4 my-6">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider mb-2">
                    Personal Access Token (classic or fine-grained)
                  </label>
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full glass-panel px-4 py-3 rounded-xl text-sm font-mono text-[var(--text-primary)] focus:border-[#8B5CF6]"
                  />
                  <p className="text-[11px] text-[var(--text-dim)] mt-2 leading-relaxed">
                    Tokens are stored only in your local browser storage. No repo permissions are required — even a token with zero scopes grants 5,000 req/hr public access.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-[var(--text-muted)]">
                  <span>Need a token? </span>
                  <a
                    href="https://github.com/settings/tokens/new"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#8B5CF6] hover:underline font-semibold"
                  >
                    Generate one on GitHub (1 minute) →
                  </a>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowTokenModal(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-sm font-semibold hover:bg-white/5 transition-colors text-[var(--text-muted)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveToken}
                  className="flex-1 py-3 rounded-xl bg-[#8B5CF6] text-white text-sm font-bold shadow-[0_4px_20px_rgba(139,92,246,0.3)] hover:opacity-90 transition-opacity"
                >
                  Save Token
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

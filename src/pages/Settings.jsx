import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database,
    Trash2,
    Info,
    Github,
    Key,
    Cpu,
    Check,
    AlertCircle,
    Eye,
    EyeOff,
    ExternalLink,
    RefreshCw
} from 'lucide-react';
import { useCandidateStore } from '../store/useCandidateStore';
import { callAI, getApiKey } from '../api/ai';
import { checkGitHubRateLimit, getGitHubToken } from '../api/github';

const Modal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;
    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="glass-panel p-6 rounded-2xl relative z-10 w-full max-w-sm border-[#FF6B6B]/20 shadow-[0_0_40px_rgba(255,107,107,0.15)]"
                >
                    <div className="w-12 h-12 rounded-full bg-[#FF6B6B]/10 text-[#FF6B6B] flex items-center justify-center mb-4 mx-auto">
                        <Trash2 size={24} />
                    </div>
                    <h3 className="font-syne text-xl font-bold text-center text-[var(--text-primary)] mb-2">Clear All Data?</h3>
                    <p className="text-center text-sm text-[var(--text-muted)] mb-6">
                        This will permanently delete your stored candidate profiles and history from this browser. This action cannot be undone.
                    </p>
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.1)] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors text-[var(--text-primary)]"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => { onConfirm(); onClose(); }}
                            className="flex-1 py-2.5 rounded-xl bg-[#FF6B6B] text-white text-sm font-medium shadow-[0_4px_15px_rgba(255,107,107,0.3)] hover:opacity-90 transition-opacity"
                        >
                            Confirm
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default function Settings() {
    const candidates = useCandidateStore(state => state.candidates);
    const clearAll = useCandidateStore(state => state.clearAll);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // API Keys state
    const [groqKey, setGroqKey] = useState('');
    const [githubToken, setGithubToken] = useState('');
    const [showGroqKey, setShowGroqKey] = useState(false);
    const [showGithubToken, setShowGithubToken] = useState(false);

    // Test status state
    const [aiTestStatus, setAiTestStatus] = useState(null); // { type: 'success' | 'error', message }
    const [isTestingAi, setIsTestingAi] = useState(false);
    const [rateLimitInfo, setRateLimitInfo] = useState(null);
    const [isCheckingRateLimit, setIsCheckingRateLimit] = useState(false);
    const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

    useEffect(() => {
        // Load initial keys from localStorage
        const storedGroq = localStorage.getItem('talentai_groq_key') || '';
        const storedGh = localStorage.getItem('talentai_github_token') || '';
        setGroqKey(storedGroq);
        setGithubToken(storedGh);

        refreshRateLimit();

        const handleEsc = (e) => {
            if (e.key === 'Escape') setIsModalOpen(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const refreshRateLimit = async () => {
        setIsCheckingRateLimit(true);
        const info = await checkGitHubRateLimit();
        setRateLimitInfo(info);
        setIsCheckingRateLimit(false);
    };

    const handleSaveKeys = (e) => {
        e.preventDefault();
        if (groqKey.trim()) {
            localStorage.setItem('talentai_groq_key', groqKey.trim());
        } else {
            localStorage.removeItem('talentai_groq_key');
        }

        if (githubToken.trim()) {
            localStorage.setItem('talentai_github_token', githubToken.trim());
        } else {
            localStorage.removeItem('talentai_github_token');
        }

        setSaveSuccessMsg('API credentials updated successfully!');
        setTimeout(() => setSaveSuccessMsg(''), 3000);
        refreshRateLimit();
    };

    const handleTestAi = async () => {
        setIsTestingAi(true);
        setAiTestStatus(null);
        try {
            const start = Date.now();
            const resp = await callAI("You are a system health check bot.", "Reply with: PING_OK", false);
            const duration = Date.now() - start;
            setAiTestStatus({
                type: 'success',
                message: `Connection successful (${duration}ms latency). Response: "${resp.slice(0, 40)}..."`
            });
        } catch (err) {
            setAiTestStatus({
                type: 'error',
                message: `Connection failed: ${err.message}`
            });
        } finally {
            setIsTestingAi(false);
        }
    };

    const activeGroqKey = getApiKey();
    const activeGithubToken = getGitHubToken();

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto hidden-scrollbar pb-24">
            {/* Header */}
            <div className="mb-10 relative z-10">
                <h1 className="font-syne text-3xl font-extrabold text-[var(--text-primary)] mb-2">Settings</h1>
                <p className="text-[var(--text-muted)]">Manage your AI inference, GitHub integration, and storage preferences</p>
                <div className="absolute top-0 right-0 w-64 h-64 bg-[rgba(255,107,107,0.06)] blur-3xl rounded-full pointer-events-none -z-10" />
            </div>

            <div className="space-y-8 relative z-10">
                {/* AI & Cloud Credentials Management */}
                <section className="glass-panel p-6 md:p-8 rounded-3xl">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="font-syne text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <Cpu size={20} className="text-[var(--accent-blue)]" />
                                AI & GitHub Integrations
                            </h2>
                            <p className="text-sm text-[var(--text-muted)] mt-1">
                                Configure your API keys for live cloud inference and increased GitHub limits
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSaveKeys} className="space-y-6">
                        {/* Groq Cloud API Key */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                                    <Key size={14} className="text-[#00D4FF]" />
                                    Groq Cloud API Key (Llama 3.3)
                                </label>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${activeGroqKey ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                    {activeGroqKey ? 'Active Key Found' : 'Offline Engine Mode'}
                                </span>
                            </div>

                            <div className="relative">
                                <input
                                    type={showGroqKey ? "text" : "password"}
                                    value={groqKey}
                                    onChange={(e) => setGroqKey(e.target.value)}
                                    placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                    className="w-full glass-panel pl-4 pr-24 py-3 rounded-xl text-sm font-mono text-[var(--text-primary)] focus:border-[var(--accent-blue)] placeholder-[var(--text-dim)]"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowGroqKey(!showGroqKey)}
                                        className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-white transition-colors"
                                        title={showGroqKey ? "Hide key" : "Show key"}
                                    >
                                        {showGroqKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-1.5 text-xs text-[var(--text-dim)]">
                                <span>Overrides .env key in browser. Stored securely in localStorage.</span>
                                <a
                                    href="https://console.groq.com/keys"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[var(--accent-blue)] hover:underline flex items-center gap-1"
                                >
                                    Get Groq Key <ExternalLink size={11} />
                                </a>
                            </div>
                        </div>

                        {/* GitHub Personal Access Token */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                                    <Github size={14} className="text-[#8B5CF6]" />
                                    GitHub Personal Access Token (Optional)
                                </label>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${activeGithubToken ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' : 'bg-white/5 text-[var(--text-dim)] border border-white/10'}`}>
                                    {activeGithubToken ? '5,000 req/hr Active' : '60 req/hr Limit'}
                                </span>
                            </div>

                            <div className="relative">
                                <input
                                    type={showGithubToken ? "text" : "password"}
                                    value={githubToken}
                                    onChange={(e) => setGithubToken(e.target.value)}
                                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                    className="w-full glass-panel pl-4 pr-24 py-3 rounded-xl text-sm font-mono text-[var(--text-primary)] focus:border-[#8B5CF6] placeholder-[var(--text-dim)]"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowGithubToken(!showGithubToken)}
                                        className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-white transition-colors"
                                        title={showGithubToken ? "Hide token" : "Show token"}
                                    >
                                        {showGithubToken ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-1.5 text-xs text-[var(--text-dim)]">
                                <span>No scopes required. Grants 5,000 requests/hr for analyzing repositories.</span>
                                <a
                                    href="https://github.com/settings/tokens/new"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[#8B5CF6] hover:underline flex items-center gap-1"
                                >
                                    Generate Token <ExternalLink size={11} />
                                </a>
                            </div>

                            {/* Rate Limit Info Pill */}
                            {rateLimitInfo && (
                                <div className="mt-3 p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] flex items-center justify-between text-xs">
                                    <span className="text-[var(--text-muted)]">
                                        Current GitHub Rate Limit: <strong className={rateLimitInfo.remaining === 0 ? "text-red-400 font-mono" : "text-[#00FFB2] font-mono"}>{rateLimitInfo.remaining} / {rateLimitInfo.limit}</strong> remaining
                                    </span>
                                    <button
                                        type="button"
                                        onClick={refreshRateLimit}
                                        disabled={isCheckingRateLimit}
                                        className="text-[var(--accent-blue)] hover:underline flex items-center gap-1"
                                    >
                                        <RefreshCw size={12} className={isCheckingRateLimit ? "animate-spin" : ""} /> Check Limit
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Save & Test Buttons */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                            <button
                                type="submit"
                                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00D4FF] to-[#00A3FF] text-white font-syne font-bold text-sm shadow-[0_4px_20px_rgba(0,212,255,0.3)] hover:opacity-95 transition-opacity"
                            >
                                Save Credentials
                            </button>

                            <button
                                type="button"
                                onClick={handleTestAi}
                                disabled={isTestingAi}
                                className="w-full sm:w-auto px-5 py-2.5 rounded-xl glass-panel text-sm font-medium hover:border-[var(--accent-blue)] transition-colors text-[var(--text-primary)] disabled:opacity-50"
                            >
                                {isTestingAi ? "Testing..." : "Test AI Brain Connection"}
                            </button>

                            {saveSuccessMsg && (
                                <span className="text-xs font-semibold text-[#00FFB2] flex items-center gap-1">
                                    <Check size={14} /> {saveSuccessMsg}
                                </span>
                            )}
                        </div>

                        {/* AI Test Result Notification */}
                        {aiTestStatus && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2 ${aiTestStatus.type === 'success'
                                    ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                                    : 'bg-red-500/10 border border-red-500/20 text-red-300'
                                    }`}
                            >
                                {aiTestStatus.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                                <span>{aiTestStatus.message}</span>
                            </motion.div>
                        )}
                    </form>
                </section>

                {/* Local Data Management */}
                <section className="glass-panel p-6 md:p-8 rounded-3xl">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="font-syne text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <Database size={18} className="text-[#FF6B6B]" />
                                Local Data Management
                            </h2>
                            <p className="text-sm text-[var(--text-muted)] mt-1">Manage candidate history stored in your browser session</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-[rgba(255,255,255,0.02)] rounded-2xl border border-[rgba(255,255,255,0.05)]">
                        <div>
                            <p className="font-syne font-bold text-xl text-[var(--text-primary)]">{candidates.length}</p>
                            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold">Candidates Stored</p>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            disabled={candidates.length === 0}
                            className="flex items-center gap-2 text-sm font-medium text-[#FF6B6B] hover:bg-[#FF6B6B]/10 px-4 py-2 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                            <Trash2 size={16} /> Clear My History
                        </button>
                    </div>
                </section>

                {/* About */}
                <section className="glass-panel p-6 md:p-8 rounded-3xl">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="font-syne text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <Info size={18} className="text-[var(--text-muted)]" />
                                About Platform
                            </h2>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00FFB2] to-[#00D4FF] p-[1px]">
                                <div className="w-full h-full bg-[var(--surface)] rounded-xl flex items-center justify-center">
                                    <span className="font-syne font-bold text-lg text-transparent bg-clip-text bg-gradient-to-br from-[#00FFB2] to-[#00D4FF]">T</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-syne font-bold text-[var(--text-primary)]">TalentAI Platform</h3>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">Version 1.2.0 • AI Recruitment Engine</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <span className="px-3 py-1.5 rounded-md bg-[rgba(255,255,255,0.05)] text-xs text-[var(--text-muted)] font-medium flex items-center gap-1">
                                Powered by Llama 3.3 & Groq Cloud
                            </span>
                            <a
                                href="https://github.com/Janarthanang-10/TalentAI"
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-md hover:bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)] transition-colors hover:text-white flex items-center justify-center"
                                title="TalentAI GitHub"
                            >
                                <Github size={18} />
                            </a>
                        </div>
                    </div>
                </section>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={clearAll} />
        </div>
    );
}

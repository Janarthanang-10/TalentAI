import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Trash2, Info, Github, Key, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useCandidateStore } from '../store/useCandidateStore';
import { getApiKey, callAI } from '../api/ai';

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
                        This will permanently delete all candidate profiles and history. This action cannot be undone.
                    </p>
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.1)] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors"
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

    // API Key State
    const [apiKey, setApiKey] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState(null); // { success: boolean, message: string }

    useEffect(() => {
        setApiKey(getApiKey());
    }, []);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') setIsModalOpen(false);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const handleSaveKey = (newKey) => {
        setApiKey(newKey);
        if (newKey.trim()) {
            localStorage.setItem('talentai_groq_key', newKey.trim());
        } else {
            localStorage.removeItem('talentai_groq_key');
        }
        setTestStatus(null);
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        setTestStatus(null);
        try {
            const response = await callAI("Respond with test status JSON.", "Test connection", true);
            const data = JSON.parse(response);
            if (data) {
                setTestStatus({
                    success: true,
                    message: "AI Engine operational & connected!"
                });
            } else {
                setTestStatus({
                    success: false,
                    message: "Connected via local evaluation fallback."
                });
            }
        } catch (err) {
            setTestStatus({
                success: false,
                message: err.message || "Failed to reach AI service."
            });
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-3xl mx-auto hidden-scrollbar pb-24">
            {/* Header */}
            <div className="mb-10 relative z-10">
                <h1 className="font-syne text-3xl font-extrabold text-[var(--text-primary)] mb-2">Settings</h1>
                <p className="text-[var(--text-muted)]">Manage your preferences, API integration, and platform data</p>
                <div className="absolute top-0 right-0 w-64 h-64 bg-[rgba(0,212,255,0.06)] blur-3xl rounded-full pointer-events-none -z-10" />
            </div>

            <div className="space-y-8 relative z-10">
                {/* AI Configuration Section */}
                <section className="glass-panel p-6 md:p-8 rounded-3xl">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="font-syne text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <Key size={18} className="text-[var(--accent-blue)]" />
                                Groq API Configuration
                            </h2>
                            <p className="text-sm text-[var(--text-muted)] mt-1">Configure your Groq API Key for resume scanning and copilot AI</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2 ml-1">
                                Groq API Key
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => handleSaveKey(e.target.value)}
                                    placeholder="gsk_..."
                                    className="flex-1 glass-panel px-4 py-3 rounded-xl text-sm transition-all text-[var(--text-primary)] placeholder-[var(--text-dim)] font-mono"
                                />
                                <button
                                    onClick={handleTestConnection}
                                    disabled={isTesting}
                                    className="px-5 py-3 rounded-xl bg-[rgba(0,212,255,0.15)] text-[var(--accent-blue)] font-syne font-bold text-sm hover:bg-[rgba(0,212,255,0.25)] transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isTesting ? (
                                        <RefreshCw size={16} className="animate-spin" />
                                    ) : (
                                        <CheckCircle2 size={16} />
                                    )}
                                    Test API
                                </button>
                            </div>
                            <p className="text-xs text-[var(--text-dim)] mt-2 ml-1">
                                Saved locally in your browser. Leave blank to use default environment configuration.
                            </p>
                        </div>

                        {testStatus && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
                                    testStatus.success
                                        ? 'bg-[rgba(0,255,178,0.1)] border border-[#00FFB2]/30 text-[#00FFB2]'
                                        : 'bg-[rgba(0,212,255,0.1)] border border-[var(--accent-blue)]/30 text-[var(--accent-blue)]'
                                }`}
                            >
                                {testStatus.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                                <span>{testStatus.message}</span>
                            </motion.div>
                        )}
                    </div>
                </section>

                {/* Data Management */}
                <section className="glass-panel p-6 md:p-8 rounded-3xl">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="font-syne text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <Database size={18} className="text-[#FF6B6B]" />
                                Data Management
                            </h2>
                            <p className="text-sm text-[var(--text-muted)] mt-1">Manage local candidate data</p>
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
                            <Trash2 size={16} /> Clear All
                        </button>
                    </div>
                </section>

                {/* About */}
                <section className="glass-panel p-6 md:p-8 rounded-3xl">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="font-syne text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <Info size={18} className="text-[var(--text-muted)]" />
                                About
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
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">Version 1.0.0-beta</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <span className="px-3 py-1.5 rounded-md bg-[rgba(255,255,255,0.05)] text-xs text-[var(--text-muted)] font-medium flex items-center gap-1">
                                Powered by Groq AI
                            </span>
                            <a href="#" className="p-1.5 rounded-md hover:bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)] transition-colors hover:text-white flex items-center justify-center">
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

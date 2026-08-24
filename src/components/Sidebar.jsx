import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Hexagon,
    LayoutDashboard,
    FileSearch,
    MessageSquare,
    ShieldAlert,
    Bot,
    Settings,
    Sun,
    Moon,
    Zap,
    Users,
    Lock,
    Unlock
} from 'lucide-react';
import { useCandidateStore } from '../store/useCandidateStore';

const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: '#00FFB2' },
    { id: 'resume', label: 'Resume Screener', icon: FileSearch, color: '#00D4FF' },
    { id: 'candidates', label: 'Candidates', icon: Users, color: '#FFD166' },
    { id: 'interview', label: 'Interview Coach', icon: MessageSquare, color: '#818CF8' },
    { id: 'bias', label: 'Bias Detector', icon: ShieldAlert, color: '#FFD166' },
    { id: 'copilot', label: 'HR Copilot', icon: Bot, color: '#F472B6' },
    { id: 'settings', label: 'Settings', icon: Settings, color: '#FF6B6B' },
];

const ThemeToggle = () => {
    const { theme, setTheme } = useCandidateStore();

    const themes = [
        { id: 'dark', icon: Moon, label: 'Dark' },
        { id: 'light', icon: Sun, label: 'Light' },
        { id: 'cyber', icon: Zap, label: 'Cyber' }
    ];

    return (
        <div className="flex bg-[rgba(0,0,0,0.2)] p-1 rounded-xl gap-1 border border-[rgba(255,255,255,0.05)]">
            {themes.map((t) => (
                <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`flex-1 flex items-center justify-center p-2 rounded-lg transition-all ${theme === t.id ? 'bg-[var(--surface)] text-[var(--accent-blue)] shadow-lg' : 'text-[var(--text-dim)] hover:text-[var(--text-muted)]'}`}
                    title={t.label}
                >
                    <t.icon size={16} />
                </button>
            ))}
        </div>
    );
};

export default function Sidebar({ activeTab, setActiveTab }) {
    const candidates = useCandidateStore(state => state.candidates);
    const { isAdmin, logoutAdmin, isAdminProtected } = useCandidateStore();

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden md:flex flex-col w-[240px] fixed left-0 top-0 bottom-0 glass-panel z-50 rounded-none border-y-0 border-l-0">

                {/* Logo */}
                <div className="flex items-center gap-3 p-6 mb-2">
                    <Hexagon className="text-[var(--accent-green)]" fill="currentColor" size={28} />
                    <span className="font-syne font-extrabold text-2xl tracking-tight text-[var(--text-primary)]">TalentAI</span>
                </div>

                {/* Admin Mode Badge */}
                {isAdminProtected && (
                    <div className="px-6 mb-3">
                        <button
                            onClick={() => {
                                if (isAdmin) {
                                    logoutAdmin();
                                } else {
                                    setActiveTab('candidates');
                                }
                            }}
                            className={`w-full py-1.5 px-3 rounded-lg text-xs font-syne font-bold flex items-center justify-between transition-all ${
                                isAdmin
                                    ? 'bg-[rgba(0,255,178,0.1)] border border-[#00FFB2]/30 text-[#00FFB2] hover:bg-[rgba(0,255,178,0.2)]'
                                    : 'bg-[rgba(255,107,107,0.1)] border border-[#FF6B6B]/30 text-[#FF6B6B] hover:bg-[rgba(255,107,107,0.2)]'
                            }`}
                        >
                            <span className="flex items-center gap-1.5">
                                {isAdmin ? <Unlock size={14} /> : <Lock size={14} />}
                                {isAdmin ? 'Admin Unlocked' : 'Admin Locked'}
                            </span>
                            <span className="text-[10px] opacity-70">{isAdmin ? 'Click to Lock' : 'Unlock'}</span>
                        </button>
                    </div>
                )}

                {/* Nav Items */}
                <div className="flex-1 px-3 space-y-1.5 overflow-y-auto hidden-scrollbar">
                    {NAV_ITEMS.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.03)]'}`}
                            >
                                {isActive && (
                                    <>
                                        <motion.div
                                            layoutId="active-bg"
                                            className="absolute inset-0 clay-card rounded-xl -z-10 bg-[rgba(255,255,255,0.05)]"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                        <motion.div
                                            layoutId="active-indicator"
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                                            style={{ backgroundColor: item.color }}
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    </>
                                )}

                                <item.icon size={20} style={{ color: isActive ? item.color : undefined }} className="shrink-0" />
                                <span className="font-syne font-bold text-sm tracking-wide">
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Footer Controls */}
                <div className="p-4 mt-auto border-t border-[rgba(255,255,255,0.05)] space-y-3">
                    <ThemeToggle />

                    <div className="px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full relative flex shrink-0">
                            <span className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: '#00FFB2', opacity: 0.4 }}></span>
                            <span className="relative block w-2 h-2 rounded-full" style={{ backgroundColor: '#00FFB2' }}></span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
                            {candidates.length} Screened
                        </span>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 glass-panel z-50 flex items-center justify-around px-2 border-x-0 border-b-0 rounded-t-2xl rounded-b-none overflow-hidden">
                {NAV_ITEMS.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className="relative p-3 min-w-[50px] flex items-center justify-center transition-transform active:scale-90"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="mobile-active-bg"
                                    className="absolute inset-0 clay-card rounded-xl -z-10 bg-[rgba(255,255,255,0.05)]"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <item.icon size={22} style={{ color: isActive ? item.color : 'var(--text-muted)' }} />
                        </button>
                    );
                })}
            </div>
        </>
    );
}

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';
import { useCandidateStore } from '../store/useCandidateStore';

export default function AdminLockGate({ children, title = "Admin Access Required" }) {
    const { isAdmin, isAdminProtected, loginAdmin } = useCandidateStore();
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    if (!isAdminProtected || isAdmin) {
        return children;
    }

    const handleUnlock = (e) => {
        e.preventDefault();
        setError('');
        const success = loginAdmin(pin.trim());
        if (!success) {
            setError('Incorrect Admin PIN. Please try again.');
            setPin('');
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-panel p-8 md:p-10 rounded-3xl max-w-md w-full text-center relative overflow-hidden border-[rgba(0,212,255,0.2)] shadow-[0_0_50px_rgba(0,212,255,0.1)]"
            >
                <div className="absolute top-0 right-0 w-48 h-48 bg-[rgba(0,212,255,0.1)] blur-3xl rounded-full pointer-events-none" />

                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00D4FF]/20 to-[#00FFB2]/20 text-[var(--accent-blue)] flex items-center justify-center mx-auto mb-6 border border-[rgba(0,212,255,0.3)] shadow-[0_0_20px_rgba(0,212,255,0.2)]">
                    <Lock size={32} />
                </div>

                <h2 className="font-syne text-2xl font-extrabold text-[var(--text-primary)] mb-2">
                    {title}
                </h2>
                <p className="text-sm text-[var(--text-muted)] mb-8">
                    Candidate metrics, records, and administrative controls are protected. Enter your Admin PIN to unlock.
                </p>

                <form onSubmit={handleUnlock} className="space-y-4">
                    <div className="relative">
                        <input
                            type="password"
                            maxLength={6}
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="Enter Admin PIN"
                            autoFocus
                            className="w-full glass-panel px-4 py-3.5 rounded-xl text-center font-mono text-xl tracking-[0.5em] transition-all text-[var(--text-primary)] placeholder-[var(--text-dim)] placeholder:tracking-normal focus:border-[var(--accent-blue)]"
                        />
                        <KeyRound size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                    </div>

                    {error && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-[#FF6B6B] flex items-center justify-center gap-1.5 font-medium">
                            <ShieldAlert size={14} />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        disabled={!pin.trim()}
                        className="clay-btn w-full py-3.5 rounded-xl font-syne font-bold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                        style={{
                            background: 'linear-gradient(135deg, rgba(0,212,255,0.8), rgba(0,163,255,0.8))',
                            boxShadow: '0 8px 24px rgba(0,212,255,0.3)'
                        }}
                    >
                        <span>Unlock Admin Access</span>
                        <ArrowRight size={16} />
                    </button>
                </form>

                <p className="text-xs text-[var(--text-dim)] mt-6">
                    Default PIN: <code className="text-[var(--accent-blue)] font-mono">1234</code> (Configurable in Settings)
                </p>
            </motion.div>
        </div>
    );
}

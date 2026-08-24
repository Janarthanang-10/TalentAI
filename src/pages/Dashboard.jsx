import React from 'react';
import { useCandidateStore } from '../store/useCandidateStore';
import { getTimeSaved } from '../utils/helpers';
import StatCard from '../components/StatCard';
import ScoreRing from '../components/ScoreRing';
import EmptyState from '../components/EmptyState';
import TagBadge from '../components/TagBadge';
import { Users, Star, TrendingUp, Clock, LayoutDashboard, Lock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

export default function Dashboard() {
    const candidates = useCandidateStore(state => state.candidates);
    const { isAdmin, isAdminProtected } = useCandidateStore();

    const isLocked = isAdminProtected && !isAdmin;

    if (candidates.length === 0) {
        return (
            <div className="p-8 h-full flex items-center justify-center">
                <EmptyState
                    icon={LayoutDashboard}
                    heading="Welcome to TalentAI"
                    sub="No candidates screened yet. Go to Resume Screener to start analyzing candidates."
                    accent="#00FFB2"
                />
            </div>
        );
    }

    const topCandidates = candidates.filter(c => c.score >= 80).length;
    const avgScore = Math.round(candidates.reduce((acc, c) => acc + c.score, 0) / candidates.length);
    const timeSaved = getTimeSaved(candidates.length);

    // Prepare data for chart
    const chartData = [...candidates].slice(-10).map((c, i) => ({
        name: isLocked ? `Cand-${i + 1}` : (c.name || 'Unknown').split(' ')[0],
        score: c.score,
        index: i
    }));

    const recentCandidates = [...candidates].reverse().slice(0, 5);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="glass-panel p-3 rounded-lg text-sm border-[rgba(0,255,178,0.2)] shadow-[0_0_15px_rgba(0,255,178,0.1)]">
                    <p className="font-syne font-bold text-[var(--accent-green)]">{payload[0].payload.name}</p>
                    <p className="text-[var(--text-primary)]">Score: <span className="font-mono">{payload[0].value}</span></p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto hidden-scrollbar pb-24">
            {/* Page Header */}
            <div className="mb-8 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="font-syne text-3xl font-extrabold text-[var(--text-primary)] mb-2">Dashboard</h1>
                    <p className="text-[var(--text-muted)]">Platform overview & candidate metrics</p>
                </div>
                {isLocked && (
                    <div className="px-4 py-2 rounded-xl bg-[rgba(255,107,107,0.1)] border border-[#FF6B6B]/30 text-[#FF6B6B] text-xs font-syne font-bold flex items-center gap-2">
                        <Lock size={14} /> Candidate details masked (Admin Lock Active)
                    </div>
                )}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[rgba(0,255,178,0.06)] blur-3xl rounded-full pointer-events-none -z-10" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard label="Total Screened" value={candidates.length} accent="#00FFB2" Icon={Users} delay={0} />
                <StatCard label="Top Candidates" value={topCandidates} sub="Score ≥ 80" accent="#00FFB2" Icon={Star} delay={0.08} />
                <StatCard label="Average Score" value={avgScore} accent="#00FFB2" Icon={TrendingUp} delay={0.16} />
                <StatCard label="Time Saved" value={timeSaved} sub="Automated screening" accent="#00FFB2" Icon={Clock} delay={0.24} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Area */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="lg:col-span-2 glass-panel p-6 rounded-2xl relative"
                >
                    <h2 className="font-syne text-lg font-bold mb-6 text-[var(--text-primary)] flex items-center gap-2">
                        <TrendingUp size={18} className="text-[var(--accent-green)]" />
                        Recent Scores
                    </h2>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#00FFB2' : entry.score >= 60 ? '#FFD166' : '#FF6B6B'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Recent Candidates List */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="flex flex-col gap-4"
                >
                    <h2 className="font-syne text-lg font-bold mb-2 text-[var(--text-primary)]">Recent Screenings</h2>
                    {recentCandidates.map((candidate, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + (i * 0.1) }}
                            whileHover={{ y: -2, scale: 1.01 }}
                            className="clay-card p-4 flex items-center gap-4 cursor-pointer"
                        >
                            <div className="scale-75 origin-left -my-4">
                                <ScoreRing score={candidate.score} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-syne font-bold text-sm truncate">
                                    {isLocked ? `Candidate #${candidate.id?.toString().slice(-4) || (i + 1)}` : candidate.name}
                                </h4>
                                <p className="text-xs text-[var(--text-muted)] truncate">{candidate.role}</p>
                            </div>
                            <TagBadge label={candidate.recommendation} />
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
}

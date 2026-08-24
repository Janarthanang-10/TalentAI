import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    Users, 
    FileText, 
    Calendar, 
    ArrowRight, 
    Trash2, 
    X,
    CheckCircle2,
    XCircle,
    User
} from 'lucide-react';
import { useCandidateStore } from '../store/useCandidateStore';
import ScoreRing from '../components/ScoreRing';
import EmptyState from '../components/EmptyState';
import TagBadge from '../components/TagBadge';

export default function Candidates() {
    const { candidates, deleteCandidate } = useCandidateStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCandidate, setSelectedCandidate] = useState(null);

    const filteredCandidates = candidates.filter(c => 
        (c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         c.role?.toLowerCase().includes(searchTerm.toLowerCase()))
    ).reverse(); // Newest first

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown Date';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (candidates.length === 0) {
        return (
            <div className="p-8 h-full flex items-center justify-center">
                <EmptyState
                    icon={Users}
                    heading="No Candidates Yet"
                    sub="Start by scanning resumes in the Resume Screener."
                    accent="#00D4FF"
                />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto hidden-scrollbar pb-24">
            {/* Page Header */}
            <div className="mb-8 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="font-syne text-3xl font-extrabold text-[var(--text-primary)] mb-2">Candidates</h1>
                    <p className="text-[var(--text-muted)]">Manage and review your candidate resume screenings</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" size={18} />
                        <input 
                            type="text"
                            placeholder="Search name or role..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="glass-panel pl-10 pr-4 py-2 rounded-xl text-sm w-full md:w-64 focus:border-[var(--accent-blue)] font-sans"
                        />
                    </div>
                </div>
            </div>

            {/* Candidates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                {filteredCandidates.map((candidate, idx) => (
                    <motion.div
                        key={candidate.id || idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        onClick={() => setSelectedCandidate(candidate)}
                        className="glass-panel p-5 rounded-2xl cursor-pointer hover:border-[var(--accent-blue)] transition-all group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="scale-90 origin-top-left -ml-1">
                                <ScoreRing score={candidate.score} />
                            </div>
                            <div className="flex items-center gap-2">
                                <TagBadge label={candidate.recommendation} />
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm('Are you sure you want to delete this candidate?')) {
                                            deleteCandidate(candidate.id);
                                        }
                                    }}
                                    className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-dim)] hover:text-red-500 transition-colors"
                                    title="Delete Candidate"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        
                        <h3 className="font-syne font-bold text-lg text-[var(--text-primary)] mb-1 group-hover:text-[var(--accent-blue)] transition-colors">
                            {candidate.name}
                        </h3>
                        <p className="text-sm text-[var(--text-muted)] mb-4">{candidate.role}</p>
                        
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[rgba(255,255,255,0.05)]">
                            <div className="flex items-center gap-2 text-xs text-[var(--text-dim)]">
                                <Calendar size={14} />
                                {formatDate(candidate.scannedAt)}
                            </div>
                            <div className="flex items-center gap-1 text-[var(--accent-blue)] text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                                View Profile <ArrowRight size={14} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Candidate Detail Modal */}
            <AnimatePresence>
                {selectedCandidate && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedCandidate(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl relative z-10 shadow-2xl hidden-scrollbar"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button 
                                onClick={() => setSelectedCandidate(null)}
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X size={24} className="text-[var(--text-muted)]" />
                            </button>

                            <div className="p-8 md:p-12">
                                {/* Modal Header */}
                                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between mb-10 pb-10 border-b border-[rgba(255,255,255,0.1)]">
                                    <div className="flex items-center gap-8">
                                        <div className="scale-[1.5] origin-left">
                                            <ScoreRing score={selectedCandidate.score} />
                                        </div>
                                        <div>
                                            <h2 className="font-syne text-3xl font-extrabold text-[var(--text-primary)] mb-2">
                                                {selectedCandidate.name}
                                            </h2>
                                            <div className="flex flex-wrap gap-4 items-center">
                                                <div className="flex items-center gap-2 text-[var(--accent-blue)] font-medium">
                                                    <User size={16} />
                                                    {selectedCandidate.role}
                                                </div>
                                                <div className="flex items-center gap-2 text-[var(--text-dim)] text-sm">
                                                    <Calendar size={16} />
                                                    {formatDate(selectedCandidate.scannedAt)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-3">
                                        <TagBadge label={selectedCandidate.recommendation} />
                                        <div className="text-sm font-mono text-[var(--text-muted)]">
                                            Confidence: <span className="text-[var(--accent-green)]">{selectedCandidate.confidence}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    {/* Left Column: Analysis */}
                                    <div className="space-y-8">
                                        <div>
                                            <h3 className="font-syne font-bold text-lg text-[var(--text-primary)] mb-4 flex items-center gap-2">
                                                <FileText size={20} className="text-[var(--accent-blue)]" />
                                                Executive Summary
                                            </h3>
                                            <p className="text-[var(--text-muted)] leading-relaxed italic">
                                                "{selectedCandidate.summary}"
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div>
                                                <h4 className="flex items-center gap-2 text-sm font-syne font-bold text-[#00FFB2] mb-4 uppercase tracking-wider">
                                                    <CheckCircle2 size={16} /> Key Strengths
                                                </h4>
                                                <ul className="space-y-3">
                                                    {selectedCandidate.strengths?.map((s, i) => (
                                                        <li key={i} className="flex gap-2 text-sm text-[var(--text-primary)]">
                                                            <span className="text-[#00FFB2] opacity-50 shrink-0">•</span> 
                                                            <span>{s}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="flex items-center gap-2 text-sm font-syne font-bold text-[#FF6B6B] mb-4 uppercase tracking-wider">
                                                    <XCircle size={16} /> Potential Gaps
                                                </h4>
                                                <ul className="space-y-3">
                                                    {selectedCandidate.gaps?.map((g, i) => (
                                                        <li key={i} className="flex gap-2 text-sm text-[var(--text-primary)]">
                                                            <span className="text-[#FF6B6B] opacity-50 shrink-0">•</span> 
                                                            <span>{g}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Resume Text */}
                                    <div className="glass-panel p-6 rounded-2xl bg-black/20 border-[rgba(255,255,255,0.05)]">
                                        <h3 className="font-syne font-bold text-sm text-[var(--text-dim)] mb-4 uppercase tracking-widest flex items-center justify-between">
                                            Original Resume Text
                                            <FileText size={16} />
                                        </h3>
                                        <div className="text-xs text-[var(--text-muted)] leading-relaxed h-[300px] overflow-y-auto hidden-scrollbar pr-2 font-mono whitespace-pre-wrap">
                                            {selectedCandidate.resumeText || "No original resume text was stored for this candidate."}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

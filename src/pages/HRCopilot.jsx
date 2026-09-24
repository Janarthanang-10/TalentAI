import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Bot, Trash2, Users, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { callAI } from '../api/ai';
import { useCandidateStore } from '../store/useCandidateStore';

const QUICK_PROMPTS = [
    { label: "Top Candidate", prompt: "Who is the best candidate and why?" },
    { label: "Summarize All", prompt: "Summarize all candidates in my database." },
    { label: "Offer Letter", prompt: "Draft a formal offer letter for the highest scored candidate." },
    { label: "Rejection Email", prompt: "Draft a polite and constructive candidate rejection email." },
    { label: "Interview Questions", prompt: "Suggest key technical interview questions for our top candidate." },
    { label: "Compare Scores", prompt: "Compare candidate scores and highlight their strengths and gaps." }
];

const TypingIndicator = () => (
    <div className="flex gap-1 items-center px-4 py-3 glass-panel w-16 h-10 rounded-2xl rounded-tl-none">
        {[0, 1, 2].map(i => (
            <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#F472B6]"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
        ))}
    </div>
);

export default function HRCopilot() {
    const candidates = useCandidateStore(state => state.candidates);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleCopy = (id, text) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleSend = async (textToSend) => {
        const text = (typeof textToSend === 'string' ? textToSend : input).trim();
        if (!text) return;

        const newMsg = { id: Date.now(), role: 'user', content: text };
        const updatedMessages = [...messages, newMsg];
        setMessages(updatedMessages);
        setInput('');
        setIsTyping(true);

        const stringifiedContext = candidates.length
            ? JSON.stringify(candidates.map(c => ({
                name: c.name,
                role: c.role,
                score: c.score,
                rec: c.recommendation,
                strengths: c.strengths,
                gaps: c.gaps,
                summary: c.summary
            })))
            : "No candidates screened yet in database.";

        const systemPrompt = `You are an expert HR Copilot assistant and technical recruiter.
You help hiring managers review candidates, compare profiles, draft personalized candidate correspondence (offer letters, rejection emails), and recommend next interview steps.
Respond in clear, structured, professional Markdown.

Current Candidate Database Context:
${stringifiedContext}`;

        const conversationHistory = updatedMessages
            .slice(-6)
            .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
            .join('\n\n');

        const finalPrompt = `Conversation History:\n${conversationHistory}\n\nPlease respond to the user's latest query directly and helpfully based on the candidate database.`;

        try {
            const resp = await callAI(systemPrompt, finalPrompt, false);
            setMessages([...updatedMessages, { id: Date.now() + 1, role: 'assistant', content: resp }]);
        } catch (err) {
            console.error("HRCopilot AI Error:", err);
            setMessages([
                ...updatedMessages,
                {
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: `### Copilot Notice\n\nI encountered an issue connecting to the AI inference service (${err.message}).\n\nIf you want cloud model inference, you can configure your Groq API key in **Settings**. In the meantime, I'm ready to answer any questions about your screened candidates!`
                }
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleClearChat = () => {
        if (messages.length === 0) return;
        setMessages([]);
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto h-[calc(100vh-80px)] md:h-screen flex flex-col hidden-scrollbar pb-20 md:pb-8">
            {/* Header */}
            <div className="mb-4 shrink-0 relative z-10 flex items-center justify-between">
                <div>
                    <h1 className="font-syne text-3xl font-extrabold text-[var(--text-primary)] mb-1 flex items-center gap-3">
                        HR Copilot <Sparkles className="text-[#F472B6]" size={24} />
                    </h1>
                    <p className="text-[var(--text-muted)] text-xs md:text-sm">
                        AI recruitment assistant tailored to your candidate pipeline
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="glass-panel px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <Users size={14} className="text-[#F472B6]" />
                        <span className="font-medium text-[var(--text-primary)]">{candidates.length}</span>
                        <span className="hidden sm:inline">in database</span>
                    </div>

                    {messages.length > 0 && (
                        <button
                            onClick={handleClearChat}
                            className="glass-panel p-2 rounded-xl text-[var(--text-dim)] hover:text-red-400 hover:border-red-400/30 transition-colors"
                            title="Clear conversation"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>

                <div className="absolute top-0 right-10 w-48 h-48 bg-[rgba(244,114,182,0.06)] blur-3xl rounded-full pointer-events-none -z-10" />
            </div>

            {/* Chat Area */}
            <div className="flex-1 glass-panel rounded-3xl flex flex-col overflow-hidden relative border-[rgba(244,114,182,0.15)] shadow-[0_8px_32px_rgba(244,114,182,0.05)]">

                {/* Messages Scroll View */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 hidden-scrollbar custom-scrollbar w-full max-w-2xl mx-auto">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center py-8">
                            <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center text-[#F472B6] mb-4 animate-float shadow-[0_0_30px_rgba(244,114,182,0.2)]">
                                <Bot size={32} />
                            </div>
                            <h3 className="font-syne text-xl font-bold text-[var(--text-primary)] mb-2 text-center">
                                How can I assist your hiring today?
                            </h3>
                            <p className="text-xs text-[var(--text-muted)] text-center max-w-sm mb-6">
                                Ask about candidate fit, compare scores, draft custom offer letters, or generate interview questions.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                                {QUICK_PROMPTS.map((item, i) => (
                                    <motion.button
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.05 * i }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleSend(item.prompt)}
                                        className="glass-panel py-3 px-4 rounded-xl text-xs text-[var(--text-primary)] hover:border-[#F472B6] hover:bg-[rgba(244,114,182,0.06)] transition-all text-left flex flex-col gap-0.5"
                                    >
                                        <span className="font-bold text-[#F472B6]">{item.label}</span>
                                        <span className="text-[var(--text-muted)] line-clamp-1">{item.prompt}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {messages.map((msg) => (
                                <motion.div
                                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={msg.id}
                                    className={`flex flex-col w-full ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="flex items-center justify-between w-full max-w-[90%] mb-1 px-1">
                                            <span className="font-syne font-bold text-[10px] text-[#F472B6] tracking-widest uppercase flex items-center gap-1">
                                                <Sparkles size={11} /> Copilot
                                            </span>
                                            <button
                                                onClick={() => handleCopy(msg.id, msg.content)}
                                                className="text-[var(--text-dim)] hover:text-white transition-colors p-1"
                                                title="Copy response"
                                            >
                                                {copiedId === msg.id ? (
                                                    <span className="text-[#00FFB2] text-[10px] flex items-center gap-0.5 font-sans">
                                                        <Check size={11} /> Copied
                                                    </span>
                                                ) : (
                                                    <Copy size={12} />
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    <div
                                        className={`max-w-[90%] px-5 py-3.5 ${msg.role === 'user'
                                            ? 'clay-card rounded-2xl rounded-tr-sm bg-[rgba(244,114,182,0.15)] border border-[#F472B6]/30 text-[var(--text-primary)]'
                                            : 'glass-panel rounded-2xl rounded-tl-sm text-[var(--text-primary)] border border-white/5'
                                            }`}
                                    >
                                        {msg.role === 'assistant' ? (
                                            <div className="text-sm prose-invert max-w-none">
                                                <ReactMarkdown
                                                    components={{
                                                        h3: ({ children }) => <h3 className="font-syne font-bold text-base text-[var(--text-primary)] mt-3 mb-2">{children}</h3>,
                                                        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-[var(--text-primary)]">{children}</p>,
                                                        ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                                                        ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
                                                        li: ({ children }) => <li className="leading-relaxed text-[var(--text-muted)]">{children}</li>,
                                                        strong: ({ children }) => <strong className="font-bold text-[var(--text-primary)]">{children}</strong>,
                                                        code: ({ children }) => <code className="px-1.5 py-0.5 rounded bg-black/30 font-mono text-xs text-[#00FFB2]">{children}</code>,
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            {isTyping && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex flex-col items-start"
                                >
                                    <span className="font-syne font-bold text-[10px] text-[#F472B6] mb-1 tracking-widest uppercase ml-1 flex items-center gap-1">
                                        <Sparkles size={11} /> Copilot
                                    </span>
                                    <TypingIndicator />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>

                {/* Quick Suggestion Chips (when conversation has started) */}
                {messages.length > 0 && (
                    <div className="px-4 py-2 bg-[rgba(17,17,24,0.4)] border-t border-[rgba(255,255,255,0.03)] flex gap-2 overflow-x-auto hidden-scrollbar shrink-0">
                        {QUICK_PROMPTS.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSend(item.prompt)}
                                disabled={isTyping}
                                className="px-3 py-1 rounded-full text-[11px] whitespace-nowrap glass-panel text-[var(--text-muted)] hover:text-white hover:border-[#F472B6]/40 transition-colors disabled:opacity-40"
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input Area */}
                <div className="p-4 border-t border-[rgba(255,255,255,0.05)] bg-[rgba(17,17,24,0.7)] backdrop-blur-md shrink-0">
                    <div className="max-w-2xl mx-auto relative flex items-end gap-2">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask Copilot about candidates, draft emails, compare scores..."
                            className="w-full glass-panel pl-4 pr-12 py-3.5 rounded-2xl text-sm transition-all focus:border-[#F472B6] focus:ring-1 focus:ring-[#F472B6] focus:ring-opacity-20 outline-none resize-none hidden-scrollbar min-h-[50px] max-h-[120px] text-[var(--text-primary)]"
                            rows={1}
                        />
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isTyping}
                            className="absolute right-2.5 bottom-2.5 w-9 h-9 flex items-center justify-center rounded-xl bg-[#F472B6] text-white shadow-[0_0_15px_rgba(244,114,182,0.4)] disabled:opacity-50 disabled:shadow-none"
                            title="Send message"
                        >
                            <Send size={16} className="-ml-0.5" />
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
}

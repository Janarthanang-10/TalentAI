import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileSearch, Hexagon, CheckCircle2, XCircle } from "lucide-react";
import { callAI } from "../api/ai";
import { useCandidateStore } from "../store/useCandidateStore";
import LoadingBeam from "../components/LoadingBeam";
import ScoreRing from "../components/ScoreRing";
import TagBadge from "../components/TagBadge";
import * as mammoth from "mammoth";
import * as pdfjs from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

// Set up PDF worker using Vite-friendly URL
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function ResumeScreener() {
  const [role, setRole] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const addCandidate = useCandidateStore((state) => state.addCandidate);

  const extractTextFromPDF = async (arrayBuffer) => {
    try {
      console.log("Starting PDF extraction...");
      const loadingTask = pdfjs.getDocument({
        data: arrayBuffer,
        useSystemFonts: true,
      });
      const pdf = await loadingTask.promise;
      console.log(`PDF loaded. Pages: ${pdf.numPages}`);

      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ");
        fullText += pageText + "\n";
      }
      console.log("PDF extraction complete. Length:", fullText.length);
      return fullText;
    } catch (err) {
      console.error("Detailed PDF Error:", err);
      if (err.name === "PasswordException") {
        throw new Error("This PDF is password protected and cannot be read.");
      }
      throw new Error(
        `PDF Error: ${err.message || "Unknown error during parsing"}`,
      );
    }
  };

  const extractTextFromDocx = async (arrayBuffer) => {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const processFile = async (file) => {
    if (!file) return;
    setIsExtracting(true);
    setError("");

    try {
      const arrayBuffer = await file.arrayBuffer();
      let text = "";

      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        text = await extractTextFromPDF(arrayBuffer);
      } else if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.endsWith(".docx")
      ) {
        text = await extractTextFromDocx(arrayBuffer);
      } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        text = await file.text();
      } else {
        throw new Error(
          "Unsupported file format. Please use PDF, DOCX, or TXT.",
        );
      }

      if (!text.trim()) {
        throw new Error(
          "Could not extract text from the file. It might be empty or an image-based scan.",
        );
      }

      setResumeText(text);
    } catch (err) {
      console.error("Extraction error:", err);
      setError(err.message || "Failed to extract text from file.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  const handleScan = async () => {
    if (!resumeText.trim()) return;
    setIsScanning(true);
    setResult(null);
    setError("");

    const systemPrompt = `You are an expert HR AI. Evaluate the provided resume against the target role. 
    Return ONLY valid JSON, no markdown, no backticks. The JSON must have this exact shape:
    {
      "name": "Candidate Full Name or Unknown",
      "score": 85,
      "summary": "2 sentences summarizing fit.",
      "strengths": ["strength 1", "strength 2", "strength 3"],
      "gaps": ["gap 1", "gap 2"],
      "recommendation": "Hire",
      "confidence": 90
    }`;

    try {
      const responsePrompt = `Role: ${role || "General"}\nResume:\n${resumeText.substring(0, 5000)}`;
      const rawJson = await callAI(systemPrompt, responsePrompt, true);

      let data;
      try {
        data = JSON.parse(rawJson);
      } catch (pErr) {
        const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          data = JSON.parse(jsonMatch[0]);
        } else {
          throw pErr;
        }
      }

      const candidatePayload = {
        name: data.name || "Candidate",
        score: typeof data.score === "number" ? data.score : 75,
        summary: data.summary || "Resume analysis completed successfully.",
        strengths: Array.isArray(data.strengths)
          ? data.strengths
          : ["Solid background experience"],
        gaps: Array.isArray(data.gaps)
          ? data.gaps
          : ["Verify domain specifics"],
        recommendation: data.recommendation || "Maybe",
        confidence: typeof data.confidence === "number" ? data.confidence : 85,
        id: Date.now(),
        role: role || "General Candidate",
        resumeText: resumeText,
        scannedAt: new Date().toISOString(),
      };
      setResult(candidatePayload);
      addCandidate(candidatePayload);
    } catch (err) {
      console.error("Scan Error:", err);
      setError(err.message || "Failed to analyze resume. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto hidden-scrollbar pb-24">
      {/* Page Header */}
      <div className="mb-8 relative z-10">
        <h1 className="font-syne text-3xl font-extrabold text-[var(--text-primary)] mb-2">
          Resume Screener
        </h1>
        <p className="text-[var(--text-muted)]">
          AI-powered candidate analysis (Supports PDF, DOCX, TXT)
        </p>
        <div className="absolute top-0 right-0 w-64 h-64 bg-[rgba(0,212,255,0.06)] blur-3xl rounded-full pointer-events-none -z-10" />
      </div>

      <div className="space-y-6 relative z-10">
        {/* Role Input */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2 ml-1">
            Target Role
          </label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Senior Frontend Engineer"
            className="w-full glass-panel px-4 py-3 rounded-xl text-sm transition-all text-[var(--text-primary)] placeholder-[var(--text-dim)]"
          />
        </div>

        {/* Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full p-10 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${isDragging ? "border-2 border-solid border-[var(--accent-blue)] bg-[rgba(0,212,255,0.05)] shadow-[0_0_20px_rgba(0,212,255,0.2)]" : "border-2 border-dashed border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.02)]"}`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.docx,.txt"
            className="hidden"
          />
          <Hexagon
            className={`mb-4 w-12 h-12 transition-colors ${isDragging ? "text-[var(--accent-blue)] animate-pulse-glow" : "text-[var(--text-dim)]"}`}
          />
          <p className="font-syne font-medium text-[var(--text-primary)] mb-1">
            Drop PDF, DOCX or TXT resume here
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            or click to browse from your computer
          </p>
        </div>

        {/* Textarea */}
        <div className="relative">
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2 ml-1">
            Extracted Resume Content
          </label>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            className={`w-full glass-panel px-4 py-3 rounded-xl text-sm transition-all focus:border-[var(--accent-blue)] min-h-[120px] resize-y hidden-scrollbar text-[var(--text-primary)] ${isExtracting ? "opacity-50" : ""}`}
            placeholder="Upload a resume — the extracted text will appear here..."
            rows={8}
          />
          {isExtracting && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-blue)]"></div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <motion.button
          whileHover={{ scale: 1.01, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleScan}
          disabled={!resumeText.trim() || isScanning || isExtracting}
          className="clay-btn w-full py-4 font-syne font-bold text-lg text-white"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,212,255,0.8), rgba(0,163,255,0.8))",
            boxShadow: "0 8px 32px rgba(0,212,255,0.3)",
          }}
        >
          {isScanning ? "Executing AI Scan..." : "Scan Resume"}
        </motion.button>

        {(isScanning || isExtracting) && (
          <div className="py-8">
            <LoadingBeam
              accent="#00D4FF"
              text={
                isExtracting
                  ? "Extracting text from document..."
                  : "Analyzing Candidate Fit"
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

        {/* Result Card */}
        <AnimatePresence>
          {result && !isScanning && !isExtracting && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel p-6 md:p-8 rounded-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[rgba(0,212,255,0.1)] blur-3xl rounded-full" />

              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between mb-8">
                <div className="flex items-center gap-6">
                  <div className="scale-125 ml-2 origin-left">
                    <ScoreRing score={result.score} />
                  </div>
                  <div>
                    <h2 className="font-syne text-2xl font-bold text-[var(--text-primary)]">
                      {result.name}
                    </h2>
                    <p className="text-sm text-[var(--accent-blue)] mb-2 font-medium">
                      {role || result.role}
                    </p>
                    <p className="text-sm text-[var(--text-muted)] max-w-md">
                      {result.summary}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0 md:border-l border-[rgba(255,255,255,0.1)] md:pl-6">
                  <TagBadge label={result.recommendation} />
                  <span className="text-xs text-[var(--text-dim)] font-medium">
                    Confidence: {result.confidence}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[rgba(255,255,255,0.06)]">
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-syne font-bold text-[#00FFB2] mb-4">
                    <CheckCircle2 size={16} /> Key Strengths
                  </h4>
                  <ul className="space-y-3">
                    {result.strengths?.map((s, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm text-[var(--text-primary)]"
                      >
                        <span className="text-[#00FFB2] opacity-50">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-syne font-bold text-[#FF6B6B] mb-4">
                    <XCircle size={16} /> Potential Gaps
                  </h4>
                  <ul className="space-y-3">
                    {result.gaps?.map((g, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm text-[var(--text-primary)]"
                      >
                        <span className="text-[#FF6B6B] opacity-50">•</span> {g}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

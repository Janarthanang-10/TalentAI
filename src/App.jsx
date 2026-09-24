import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import Sidebar from "./components/Sidebar";
import PageWrapper from "./components/PageWrapper";
import Dashboard from "./pages/Dashboard";
import ResumeScreener from "./pages/ResumeScreener";
import GithubAnalyser from "./pages/Githubanalyser";
import InterviewCoach from "./pages/InterviewCoach";
import BiasDetector from "./pages/BiasDetector";
import HRCopilot from "./pages/HRCopilot";
import Settings from "./pages/Settings";
import Candidates from "./pages/Candidates";
import { useCandidateStore } from "./store/useCandidateStore";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const theme = useCandidateStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div className="min-h-screen w-full flex text-[var(--text-primary)] transition-colors duration-300">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 md:ml-[240px] w-full min-h-screen relative overflow-x-hidden">
        <AnimatePresence mode="wait">
          <PageWrapper key={activeTab}>
            {activeTab === "dashboard" && <Dashboard />}
            {activeTab === "resume" && <ResumeScreener />}
            {activeTab === "github" && <GithubAnalyser />}
            {activeTab === "candidates" && <Candidates />}
            {activeTab === "interview" && <InterviewCoach />}
            {activeTab === "bias" && <BiasDetector />}
            {activeTab === "copilot" && <HRCopilot />}
            {activeTab === "settings" && <Settings />}
          </PageWrapper>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;

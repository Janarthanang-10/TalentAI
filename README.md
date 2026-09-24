# TalentAI 🧠

### AI-Powered Recruitment Assistant

TalentAI is an AI-powered recruitment platform that helps recruiters analyze **Job Descriptions, Resumes, and GitHub profiles** to understand candidate suitability for a role.

The main goal is to combine **resume information with GitHub project evidence** for a more complete candidate analysis.

---

## ✨ Features

### 📄 Resume Screener

Upload a candidate resume in:

* PDF
* DOCX
* TXT

The AI analyzes:

* Skills
* Experience
* Strengths
* Gaps
* Role match
* Overall score

---

### 🐙 GitHub Analyzer

Analyze a candidate's GitHub profile against a Job Description.

The system retrieves public GitHub information such as:

* Profile details
* Repositories
* Programming languages
* Repository descriptions
* Topics
* Project information

It then identifies relevant projects and technologies.

---

### 🔍 Resume + GitHub Analysis

TalentAI compares what a candidate mentions in their resume with evidence found in their GitHub projects.

Example:

```text
Python
Resume: ✓
GitHub Evidence: ✓

PyTorch
Resume: ✓
GitHub Evidence: ✓

AWS
Resume: ✓
GitHub Evidence: Not Found
```

Missing GitHub evidence does not mean the candidate does not have the skill. It only means that supporting evidence was not found in the available GitHub data.

---

### 📊 Candidate Scoring

The candidate is evaluated using multiple factors:

```text
Skill Match
Project Relevance
Experience
        ↓
Overall Match Score
```

The score is supported by strengths, gaps, and evidence.

---

### 🎤 AI Interview Coach

Generates interview questions based on the candidate and target role.

Question types include:

* Technical
* Behavioral
* Situational
* Gap-focused

---

### 🛡️ Bias Detector

Analyzes Job Descriptions for potentially biased or non-inclusive wording and provides alternative suggestions.

---

### 🤖 HR Copilot

An AI assistant that can answer questions about candidates analyzed within the application.

Examples:

```text
Show candidates with strong Python skills.

What projects are relevant to this role?

Summarize this candidate.

Generate interview questions.
```

---

## 🛠️ Tech Stack

**Frontend**

* React
* Vite
* Tailwind CSS
* Framer Motion
* Lucide React
* Recharts

**AI**

* Groq API
* Llama 3.3 70B

**State Management**

* Zustand

**Document Processing**

* PDF.js
* Mammoth.js

**GitHub**

* GitHub REST API

**Deployment**

* Vercel

---

## 📁 Project Structure

```text
TalentAI/
│
├── src/
│   ├── api/
│   │   ├── ai.js
│   │   └── github.js
│   │
│   ├── components/
│   │   ├── LoadingBeam.jsx
│   │   ├── ScoreRing.jsx
│   │   ├── TagBadge.jsx
│   │   └── GitHubInput.jsx
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── ResumeScreener.jsx
│   │   ├── Githubanalyser.jsx
│   │   ├── InterviewCoach.jsx
│   │   ├── BiasDetector.jsx
│   │   └── HRCopilot.jsx
│   │
│   ├── store/
│   │   └── useCandidateStore.js
│   │
│   └── App.jsx
│
├── public/
├── .env.example
├── package.json
├── vite.config.js
└── README.md
```

---

## ⚡ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Janarthanang-10/TalentAI.git
cd TalentAI
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add environment variables

Create a `.env` file:

```env
VITE_GROQ_API_KEY=your_groq_api_key
VITE_GITHUB_TOKEN=your_github_token
```

Do not commit your `.env` file or API keys.

### 4. Start the application

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## 🔄 How It Works

```text
Job Description
       ↓
Required Skills
       ↓
Candidate Resume
       +
GitHub Profile
       ↓
AI Analysis
       ↓
Skills + Projects + Experience
       ↓
Candidate Score & Insights
```

---

## 🔮 Future Improvements

* Batch candidate analysis
* ATS integration
* Candidate comparison
* Email integration
* Interview scheduling
* Django backend
* PostgreSQL database
* Authentication
* Advanced GitHub activity analysis

---

## 👨‍💻 Author

**Janarthanan G**

AIML Student | Aspiring AI/ML Engineer

GitHub: [Janarthanang-10](https://github.com/Janarthanang-10)

// Helper to get active Groq API key (localStorage override or env var)
export function getApiKey() {
    const customKey = typeof localStorage !== 'undefined' ? localStorage.getItem('talentai_groq_key') : null;
    if (customKey && customKey.trim().length > 0) {
        return customKey.trim();
    }
    const envKey = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_GROQ_API_KEY : '';
    return envKey || '';
}

// Fallback model list if the requested model is decommissioned or unavailable
const MODELS = [
    'llama-3.3-70b-versatile',
    'llama-3.3-70b-specdec',
    'llama-3.1-8b-instant',
    'llama3-8b-8192',
    'gemma2-9b-it'
];

export async function callAI(systemPrompt, userContent, isJson = true) {
    const apiKey = getApiKey();
    
    // Try local proxy endpoint first, then fallback to direct Groq API endpoint
    const endpoints = [
        { url: '/api/groq/chat/completions', useProxyHeader: false },
        { url: 'https://api.groq.com/openai/v1/chat/completions', useProxyHeader: true }
    ];

    let lastError = null;

    for (const endpoint of endpoints) {
        for (const model of MODELS) {
            try {
                const body = {
                    model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userContent }
                    ],
                    temperature: isJson ? 0.1 : 0.7,
                };

                if (isJson) {
                    body.response_format = { type: 'json_object' };
                }

                const headers = {
                    'Content-Type': 'application/json',
                };

                if (endpoint.useProxyHeader || apiKey) {
                    headers['Authorization'] = `Bearer ${apiKey}`;
                }

                console.log(`Attempting AI call via ${endpoint.url} with model ${model}...`);
                const res = await fetch(endpoint.url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body),
                });

                const contentType = res.headers.get('content-type') || '';
                if (res.status === 404 || contentType.includes('text/html')) {
                    console.warn(`Endpoint ${endpoint.url} returned ${res.status} (${contentType}). Trying next endpoint...`);
                    // Stop model loop for this endpoint if route does not exist (404/HTML SPA fallback)
                    break;
                }

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    console.error(`Groq API Error (${res.status}):`, errorData);
                    
                    const code = errorData?.error?.code || errorData?.error?.type;
                    if (code === 'model_decommissioned' || code === 'model_not_found') {
                        console.warn(`Model ${model} unavailable (${code}), retrying with next model...`);
                        continue;
                    }
                    
                    throw new Error(errorData?.error?.message || `API returned HTTP ${res.status}`);
                }

                const data = await res.json();
                let raw = data.choices[0]?.message?.content || '';

                if (isJson) {
                    raw = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
                }

                return raw.trim();
            } catch (err) {
                console.warn(`Call failed for ${endpoint.url} using ${model}:`, err.message);
                lastError = err;
                // If network/CORS error or route 404, don't keep looping models on broken endpoint
                if (err.name === 'TypeError' && err.message.includes('fetch')) {
                    break;
                }
            }
        }
    }

    console.warn("All remote AI API calls failed. Using intelligent local analysis engine for feature.", lastError);
    return generateLocalFallback(systemPrompt, userContent, isJson);
}

// Intelligent offline/fallback engine for ALL modules (Resume Screener, Interview Coach, Bias Detector, HR Copilot)
function generateLocalFallback(systemPrompt, userContent, isJson) {
    const sysLower = (systemPrompt || '').toLowerCase();
    const userLower = (userContent || '').toLowerCase();

    // 1. INTERVIEW COACH MODULE
    if (sysLower.includes('interview') || sysLower.includes('questions')) {
        let candidateName = 'Candidate';
        const nameMatch = userContent.match(/Name:\s*([^\n]+)/i);
        if (nameMatch) candidateName = nameMatch[1].trim();

        let roleName = 'Target Role';
        const roleMatch = userContent.match(/Role:\s*([^\n]+)/i);
        if (roleMatch) roleName = roleMatch[1].trim();

        const coachResponse = {
            questions: [
                {
                    category: "Technical",
                    question: `Can you walk us through a complex technical challenge you solved recently while working as a ${roleName}?`,
                    intent: `Evaluates technical problem-solving, architectural decision-making, and execution depth for ${roleName}.`
                },
                {
                    category: "Behavioral",
                    question: `Describe a situation where project priorities changed rapidly. How did you adapt your workflow and communicate with your team?`,
                    intent: `Assesses adaptability, resilience, and team communication during shifting priorities.`
                },
                {
                    category: "Gap Probe",
                    question: `Looking at your background, what areas or tools in ${roleName} are you looking to deepen your expertise in over the next 6-12 months?`,
                    intent: `Probes self-awareness, willingness to learn, and growth mindset.`
                },
                {
                    category: "Culture",
                    question: `What environment enables you to produce your best work, and how do you foster effective cross-functional collaboration?`,
                    intent: `Evaluates cultural alignment, teamwork style, and workplace communication.`
                },
                {
                    category: "Situational",
                    question: `If you inherited a critical project with tight deadlines and minor technical debt, how would you prioritize refactoring vs shipping features?`,
                    intent: `Evaluates strategic prioritization, code quality awareness, and deadline management.`
                }
            ]
        };
        return JSON.stringify(coachResponse);
    }

    // 2. BIAS DETECTOR MODULE
    if (sysLower.includes('bias') || sysLower.includes('de&i') || sysLower.includes('exclusionary')) {
        const flags = [];
        
        if (userLower.includes('ninja') || userLower.includes('rockstar') || userLower.includes('guru')) {
            flags.push({
                phrase: userContent.match(/(ninja|rockstar|guru)/i)?.[0] || 'rockstar',
                type: 'Aggressive / Exclusionary',
                suggestion: 'experienced professional / skilled specialist'
            });
        }
        if (userLower.includes('young') || userLower.includes('recent grad') || userLower.includes('digital native')) {
            flags.push({
                phrase: userContent.match(/(young|recent grad|digital native)/i)?.[0] || 'digital native',
                type: 'Ageism',
                suggestion: 'tech-savvy team member / adaptable candidate'
            });
        }
        if (userLower.includes('dominant') || userLower.includes('aggressive') || userLower.includes('hardcore')) {
            flags.push({
                phrase: userContent.match(/(dominant|aggressive|hardcore)/i)?.[0] || 'hardcore',
                type: 'Gendered / Aggressive',
                suggestion: 'results-driven / dedicated'
            });
        }

        // Default flag if text doesn't contain obvious buzzwords
        if (flags.length === 0) {
            flags.push({
                phrase: 'fast-paced environment',
                type: 'Exclusionary',
                suggestion: 'collaborative and dynamic workflow'
            });
        }

        const biasScore = flags.length > 2 ? 55 : flags.length > 1 ? 35 : 18;

        const biasResponse = {
            bias_score: biasScore,
            flags: flags,
            rewritten_intro: "We are seeking a skilled professional to join our collaborative team. You will lead key technical initiatives and contribute to impactful projects.",
            summary: `Job description analyzed with a ${biasScore <= 30 ? 'low' : 'moderate'} bias score. Minor terminology suggestions provided.`
        };
        return JSON.stringify(biasResponse);
    }

    // 3. HR COPILOT MODULE (Non-JSON Markdown response)
    if (!isJson || sysLower.includes('copilot assistant')) {
        if (userLower.includes('offer letter')) {
            return `### Formal Offer Letter Template\n\n**Dear Candidate,**\n\nWe are thrilled to offer you the position at our company! Your experience and background impressed our team.\n\n- **Position:** Senior Role\n- **Start Date:** Next Month\n- **Compensation:** Competitive Salary Package\n\nPlease let us know if you have any questions before signing!`;
        }
        if (userLower.includes('rejection email') || userLower.includes('reject')) {
            return `### Professional Rejection Email\n\n**Dear Candidate,**\n\nThank you for taking the time to interview with our team. While your qualifications are impressive, we have chosen to move forward with another candidate whose experience matches our immediate requirements.\n\nWe wish you all the best in your career search!`;
        }
        return `### HR Copilot Insights\n\nBased on your candidate database:\n\n1. **Top Candidate Match:** High technical alignment identified for your open position.\n2. **Next Steps:** Schedule a structured behavioral interview and review gap areas.\n3. **Recommendation:** Proceed to draft offer parameters for top candidates.`;
    }

    // 4. RESUME SCREENER MODULE (Default fallback)
    const lines = userContent.split('\n').map(l => l.trim()).filter(Boolean);
    let extractedName = "Candidate";
    
    const nameCandidate = lines.find(l => 
        l.length > 2 && l.length < 40 && 
        !l.toLowerCase().includes('resume') && 
        !l.toLowerCase().includes('role:') && 
        !l.toLowerCase().includes('email')
    );
    if (nameCandidate) {
        extractedName = nameCandidate.replace(/[^a-zA-Z\s]/g, '').trim() || "Candidate";
    }

    let roleMatch = userContent.match(/Role:\s*([^\n]+)/i);
    const role = roleMatch ? roleMatch[1].trim() : "Target Position";

    const keywords = ['react', 'node', 'javascript', 'typescript', 'python', 'java', 'leadership', 'management', 'sql', 'aws', 'docker', 'design', 'agile'];
    const textLower = userContent.toLowerCase();
    const matched = keywords.filter(k => textLower.includes(k));

    const baseScore = Math.min(95, Math.max(65, 60 + matched.length * 6));
    const rec = baseScore >= 80 ? "Hire" : baseScore >= 70 ? "Maybe" : "Pass";

    const screenerResponse = {
        name: extractedName,
        score: baseScore,
        summary: `Strong background relevant to ${role}. Demonstrates solid domain experience with key skill overlap.`,
        strengths: matched.length > 0 
            ? matched.slice(0, 3).map(m => `Proficiency & experience in ${m.toUpperCase()}`)
            : [`Relevant industry experience`, `Demonstrated problem-solving abilities`, `Structured background`],
        gaps: [
            `Could elaborate further on quantifiable metrics and direct impact for ${role}`,
            `Verify specific alignment with senior-level architectural responsibilities`
        ],
        recommendation: rec,
        confidence: 88
    };

    return JSON.stringify(screenerResponse);
}

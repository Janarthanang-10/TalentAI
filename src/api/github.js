// src/api/github.js
// Fetches real, rich public data from GitHub (profile or repo link)
// Focuses heavily on repositories, tech stacks, languages, metrics, and activity.

const GITHUB_API = "https://api.github.com";

/**
 * Retrieves GitHub token from localStorage or Vite environment variable.
 */
export function getGitHubToken() {
  if (typeof localStorage !== "undefined") {
    const localToken = localStorage.getItem("talentai_github_token");
    if (localToken && localToken.trim().length > 0) {
      return localToken.trim();
    }
  }
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env.VITE_GITHUB_TOKEN || "";
  }
  return "";
}

/**
 * Builds request headers, attaching token if available.
 */
function getHeaders() {
  const h = {
    Accept: "application/vnd.github+json",
  };
  const token = getGitHubToken();
  if (token) {
    h.Authorization = `Bearer ${token}`;
  }
  return h;
}

/**
 * Checks remaining GitHub API rate limit for current IP / Token.
 */
export async function checkGitHubRateLimit() {
  try {
    const res = await fetch(`${GITHUB_API}/rate_limit`, { headers: getHeaders() });
    if (!res.ok) {
      return { limit: 60, remaining: 0, reset: 0, hasToken: !!getGitHubToken() };
    }
    const data = await res.json();
    return {
      limit: data.rate?.limit ?? 60,
      remaining: data.rate?.remaining ?? 0,
      reset: data.rate?.reset ?? 0,
      hasToken: !!getGitHubToken(),
    };
  } catch (err) {
    return { limit: 60, remaining: 0, reset: 0, hasToken: !!getGitHubToken(), error: err.message };
  }
}

/**
 * Low-level GitHub fetch helper with clear error messages.
 */
async function ghFetch(path) {
  const res = await fetch(`${GITHUB_API}${path}`, { headers: getHeaders() });
  
  if (res.status === 404) {
    throw new Error("GitHub user or repository not found. Please check spelling.");
  }
  
  if (res.status === 403) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    const hasToken = !!getGitHubToken();
    if (remaining === "0" || !hasToken) {
      throw new Error(
        "GitHub API rate limit exceeded (60 req/hr unauthenticated limit). Please add a free GitHub Personal Access Token in Settings to get 5,000 requests/hour."
      );
    }
    throw new Error("GitHub API access forbidden (HTTP 403). Check your GitHub token permissions.");
  }
  
  if (!res.ok) {
    throw new Error(`GitHub API error (status ${res.status}).`);
  }
  
  return res.json();
}

/**
 * Accepts full URLs (https://github.com/owner/repo) or short identifiers (owner/repo or owner).
 */
export function parseGitHubUrl(input) {
  if (!input || typeof input !== "string") return null;
  const clean = input.trim().replace(/\/+$/, "").replace(/\.git$/, "");
  
  // If user passed a full URL
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    try {
      const u = new URL(clean);
      if (!u.hostname.includes("github.com")) return null;
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length === 0) return null;
      return {
        owner: parts[0],
        repo: parts.length > 1 ? parts[1] : null,
      };
    } catch {
      return null;
    }
  }

  // If user passed "owner/repo" or "owner" directly
  const parts = clean.split("/").filter(Boolean);
  if (parts.length === 1) {
    return { owner: parts[0], repo: null };
  }
  if (parts.length >= 2) {
    return { owner: parts[0], repo: parts[1] };
  }

  return null;
}

function decodeBase64(b64) {
  try {
    const bin = atob(b64.replace(/\n/g, ""));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return null;
  }
}

async function fetchReadme(owner, repo) {
  try {
    const data = await ghFetch(`/repos/${owner}/${repo}/readme`);
    if (data?.content) {
      return decodeBase64(data.content)?.slice(0, 2500) || null;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchRepoLanguages(owner, repo) {
  try {
    const langs = await ghFetch(`/repos/${owner}/${repo}/languages`);
    return langs || {};
  } catch {
    return {};
  }
}

function normalizeRepo(r, languages = {}) {
  return {
    id: r.id,
    name: r.name,
    fullName: r.full_name,
    htmlUrl: r.html_url,
    description: r.description || "No description provided.",
    language: r.language || "Other",
    languagesBreakdown: languages,
    stars: r.stargazers_count || 0,
    forks: r.forks_count || 0,
    openIssues: r.open_issues_count || 0,
    watchers: r.watchers_count || 0,
    isFork: !!r.fork,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    pushedAt: r.pushed_at,
    homepage: r.homepage || null,
    topics: Array.isArray(r.topics) ? r.topics : [],
    license: r.license?.spdx_id || r.license?.name || null,
    sizeKb: r.size || 0,
    defaultBranch: r.default_branch || "main",
  };
}

/**
 * Builds rich data structure for a user profile and all their public repositories.
 */
async function buildProfileData(owner) {
  const [user, rawRepos] = await Promise.all([
    ghFetch(`/users/${owner}`),
    ghFetch(`/users/${owner}/repos?per_page=100&sort=updated`),
  ]);

  const reposList = Array.isArray(rawRepos) ? rawRepos : [];

  // Separate original repositories from forks to focus on actual code created by candidate
  const originalRepos = reposList.filter((r) => !r.fork);
  const forkedRepos = reposList.filter((r) => r.fork);

  // Compute language frequencies and percentages
  const langCount = {};
  reposList.forEach((r) => {
    if (r.language) {
      langCount[r.language] = (langCount[r.language] || 0) + 1;
    }
  });

  const totalLangTagged = Object.values(langCount).reduce((a, b) => a + b, 0);
  const topLanguages = Object.entries(langCount)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalLangTagged > 0 ? Math.round((count / totalLangTagged) * 100) : 0,
    }));

  const totalStars = reposList.reduce((acc, r) => acc + (r.stargazers_count || 0), 0);
  const totalForks = reposList.reduce((acc, r) => acc + (r.forks_count || 0), 0);

  // Sort: First by original projects sorted by stars & recent push, then others
  const sortedRepos = [...reposList].sort((a, b) => {
    // Prioritize stars first, then recency of updates
    if (b.stargazers_count !== a.stargazers_count) {
      return b.stargazers_count - a.stargazers_count;
    }
    return new Date(b.pushed_at || 0) - new Date(a.pushed_at || 0);
  });

  // Top featured repos (max 6)
  const featured = sortedRepos.slice(0, 6);

  // Fetch READMEs for top 2 repos to minimize rate-limit usage
  const normalizedRepos = [];
  for (let i = 0; i < sortedRepos.length; i++) {
    const r = sortedRepos[i];
    let readme = null;
    let extraLangs = {};
    if (i < 2) {
      readme = await fetchReadme(r.owner?.login || owner, r.name);
    }
    const normalized = normalizeRepo(r, extraLangs);
    normalized.readme = readme;
    normalizedRepos.push(normalized);
  }

  // Format textual representation for AI analysis
  const profileSummaryLines = [
    `Candidate GitHub Profile: ${user.login}`,
    user.name ? `Full Name: ${user.name}` : null,
    [user.company ? `Company: ${user.company}` : null, user.location ? `Location: ${user.location}` : null].filter(Boolean).join(" | "),
    user.bio ? `Bio: ${user.bio}` : null,
    user.blog ? `Website/Portfolio: ${user.blog}` : null,
    `Total Public Repositories: ${reposList.length} (${originalRepos.length} original, ${forkedRepos.length} forks)`,
    `Total Stars: ${totalStars} | Total Forks: ${totalForks} | Followers: ${user.followers}`,
    topLanguages.length ? `Primary Languages: ${topLanguages.slice(0, 5).map(l => `${l.name} (${l.percentage}%)`).join(", ")}` : null,
    "",
    `Featured Repositories (Analyzed in Depth):`,
  ].filter((l) => l !== null);

  normalizedRepos.slice(0, 6).forEach((r, idx) => {
    profileSummaryLines.push(
      `--- [Repo ${idx + 1}] ${r.name} (${r.language}) ---`,
      `Description: ${r.description}`,
      `Stars: ${r.stars} | Forks: ${r.forks} | Open Issues: ${r.openIssues} | Fork: ${r.isFork ? "Yes" : "No (Original)"}`,
      `Last Push: ${r.pushedAt ? r.pushedAt.slice(0, 10) : "N/A"}`,
      r.topics?.length ? `Topics: ${r.topics.join(", ")}` : null,
      r.readme ? `README Excerpt:\n${r.readme.slice(0, 600)}...` : null,
      ""
    );
  });

  return {
    type: "profile",
    summaryText: profileSummaryLines.filter(Boolean).join("\n"),
    user: {
      login: user.login,
      name: user.name || user.login,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      company: user.company,
      location: user.location,
      blog: user.blog,
      htmlUrl: user.html_url,
      followers: user.followers,
      following: user.following,
      publicRepos: user.public_repos,
    },
    repos: normalizedRepos,
    topLanguages,
    stats: {
      totalRepos: reposList.length,
      originalCount: originalRepos.length,
      forkCount: forkedRepos.length,
      totalStars,
      totalForks,
      topLanguage: topLanguages[0]?.name || "N/A",
      latestPush: sortedRepos[0]?.pushed_at ? sortedRepos[0].pushed_at.slice(0, 10) : "N/A",
    },
  };
}

/**
 * Builds rich data structure for a single specific repository URL.
 */
async function buildSingleRepoData(owner, repoName) {
  const [repo, languages, readme] = await Promise.all([
    ghFetch(`/repos/${owner}/${repoName}`),
    fetchRepoLanguages(owner, repoName),
    fetchReadme(owner, repoName),
  ]);

  const normalized = normalizeRepo(repo, languages);
  normalized.readme = readme;

  // Language percentage calculation
  const totalBytes = Object.values(languages).reduce((a, b) => a + b, 0);
  const langBreakdown = Object.entries(languages).map(([name, bytes]) => ({
    name,
    count: bytes,
    percentage: totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 0,
  }));

  const textLines = [
    `GitHub Single Repository Deep Analysis`,
    `Repository: ${repo.full_name}`,
    `URL: ${repo.html_url}`,
    repo.description ? `Description: ${repo.description}` : null,
    `Primary Language: ${repo.language || "Unknown"}`,
    langBreakdown.length ? `Language Breakdown: ${langBreakdown.map(l => `${l.name} (${l.percentage}%)`).join(", ")}` : null,
    `Stars: ${repo.stargazers_count} | Forks: ${repo.forks_count} | Open Issues: ${repo.open_issues_count} | Size: ${repo.size} KB`,
    `Default Branch: ${repo.default_branch} | License: ${repo.license?.name || "Not specified"}`,
    `Created: ${repo.created_at?.slice(0, 10)} | Last Pushed: ${repo.pushed_at?.slice(0, 10)}`,
    repo.topics?.length ? `Topics: ${repo.topics.join(", ")}` : null,
    readme ? `README Overview:\n${readme.slice(0, 1500)}` : "No README available for this repository.",
  ].filter(Boolean);

  return {
    type: "repo",
    summaryText: textLines.join("\n"),
    user: {
      login: repo.owner?.login || owner,
      name: repo.owner?.login || owner,
      avatarUrl: repo.owner?.avatar_url,
      htmlUrl: repo.owner?.html_url,
      bio: `Owner of ${repo.full_name}`,
    },
    repos: [normalized],
    singleRepo: normalized,
    topLanguages: langBreakdown,
    stats: {
      totalRepos: 1,
      originalCount: repo.fork ? 0 : 1,
      forkCount: repo.fork ? 1 : 0,
      totalStars: repo.stargazers_count,
      totalForks: repo.forks_count,
      topLanguage: repo.language || "N/A",
      latestPush: repo.pushed_at ? repo.pushed_at.slice(0, 10) : "N/A",
    },
  };
}

/**
 * Main entry point: accepts any GitHub profile or repository URL.
 * Returns both structured repository objects and textual summary.
 */
export async function fetchGitHubData(url) {
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    throw new Error(
      "Please enter a valid GitHub profile (e.g. github.com/username) or repo link (e.g. github.com/user/repo)."
    );
  }

  if (!parsed.repo) {
    return buildProfileData(parsed.owner);
  }

  return buildSingleRepoData(parsed.owner, parsed.repo);
}

/**
 * Realistic Mock Profile Generator for testing when rate limit is 0 and no token is yet added.
 */
export function getDemoGitHubData(username = "demo-engineer") {
  const repos = [
    {
      id: 101,
      name: "distributed-task-queue",
      fullName: `${username}/distributed-task-queue`,
      htmlUrl: `https://github.com/${username}/distributed-task-queue`,
      description: "High-throughput asynchronous task queue built in Go with Redis streams and worker pools.",
      language: "Go",
      stars: 142,
      forks: 28,
      openIssues: 3,
      watchers: 142,
      isFork: false,
      pushedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      homepage: "https://pkg.go.dev",
      topics: ["golang", "redis", "concurrency", "distributed-systems", "microservices"],
      license: "MIT",
      sizeKb: 1420,
    },
    {
      id: 102,
      name: "ai-code-reviewer",
      fullName: `${username}/ai-code-reviewer`,
      htmlUrl: `https://github.com/${username}/ai-code-reviewer`,
      description: "Automated GitHub Action bot that runs static AST analysis and suggests pull request improvements with LLMs.",
      language: "TypeScript",
      stars: 89,
      forks: 14,
      openIssues: 1,
      watchers: 89,
      isFork: false,
      pushedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      homepage: "https://marketplace.visualstudio.com",
      topics: ["typescript", "github-actions", "ast", "llm", "developer-tools"],
      license: "Apache-2.0",
      sizeKb: 3100,
    },
    {
      id: 103,
      name: "cloud-infrastructure-terraform",
      fullName: `${username}/cloud-infrastructure-terraform`,
      htmlUrl: `https://github.com/${username}/cloud-infrastructure-terraform`,
      description: "Multi-region AWS EKS Kubernetes clusters provisioned with Terraform, Helm, and Cilium CNI.",
      language: "HCL",
      stars: 34,
      forks: 7,
      openIssues: 0,
      watchers: 34,
      isFork: false,
      pushedAt: new Date(Date.now() - 25 * 86400000).toISOString(),
      homepage: null,
      topics: ["terraform", "aws", "kubernetes", "devops", "eks"],
      license: "MIT",
      sizeKb: 890,
    },
    {
      id: 104,
      name: "fullstack-analytics-dashboard",
      fullName: `${username}/fullstack-analytics-dashboard`,
      htmlUrl: `https://github.com/${username}/fullstack-analytics-dashboard`,
      description: "Real-time recruitment analytics dashboard built with Next.js 14, Tailwind CSS, PostgreSQL, and D3.",
      language: "TypeScript",
      stars: 52,
      forks: 11,
      openIssues: 2,
      watchers: 52,
      isFork: false,
      pushedAt: new Date(Date.now() - 40 * 86400000).toISOString(),
      homepage: "https://demo-analytics.vercel.app",
      topics: ["nextjs", "react", "tailwindcss", "postgresql", "dashboard"],
      license: "MIT",
      sizeKb: 5400,
    }
  ];

  return {
    type: "profile",
    summaryText: `Candidate GitHub Profile: ${username}\nName: Alex Chen\nBio: Staff Software Engineer & Open Source Contributor\nPublic Repos: 4 | Total Stars: 317 | Followers: 85\nPrimary Languages: Go (35%), TypeScript (35%), HCL (20%), Python (10%)`,
    user: {
      login: username,
      name: "Alex Chen",
      avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
      bio: "Staff Software Engineer & Systems Architect. Passionate about distributed systems, developer tooling, and cloud automation.",
      company: "Tech Architecture Lab",
      location: "San Francisco, CA",
      blog: "https://alexchen.dev",
      htmlUrl: `https://github.com/${username}`,
      followers: 85,
      following: 42,
      publicRepos: 4,
    },
    repos,
    topLanguages: [
      { name: "Go", count: 1420, percentage: 38 },
      { name: "TypeScript", count: 1200, percentage: 35 },
      { name: "HCL", count: 890, percentage: 18 },
      { name: "Python", count: 400, percentage: 9 },
    ],
    stats: {
      totalRepos: 4,
      originalCount: 4,
      forkCount: 0,
      totalStars: 317,
      totalForks: 60,
      topLanguage: "Go",
      latestPush: new Date().toISOString().slice(0, 10),
    }
  };
}

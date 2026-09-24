// src/api/github.js
const GITHUB_API = "https://api.github.com";

function headers() {
  const h = { Accept: "application/vnd.github+json" };
  const token = import.meta.env.VITE_GITHUB_TOKEN; // optional
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function ghFetch(path) {
  const res = await fetch(`${GITHUB_API}${path}`, { headers: headers() });
  if (res.status === 404)
    throw new Error("GitHub user or repository not found.");
  if (res.status === 403)
    throw new Error("GitHub API rate limit exceeded. Please try again later.");
  if (!res.ok) throw new Error(`GitHub API error (status ${res.status}).`);
  return res.json();
}

/** Accepts any github.com URL and returns { owner, repo? } or null if invalid. */
export function parseGitHubUrl(url) {
  try {
    const u = new URL(url.trim());
    if (u.hostname !== "github.com" && u.hostname !== "www.github.com")
      return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length === 0) return null;
    return { owner: parts[0], repo: parts.length > 1 ? parts[1] : null };
  } catch {
    return null;
  }
}

function decodeBase64(b64) {
  const bin = atob(b64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

async function fetchReadme(owner, repo) {
  try {
    const data = await ghFetch(`/repos/${owner}/${repo}/readme`);
    return decodeBase64(data.content).slice(0, 3000);
  } catch {
    return null; // no README — not fatal
  }
}

function buildRepoBlock(repo, readme) {
  return [
    `Project: ${repo.name}${repo.language ? ` (${repo.language})` : ""}`,
    repo.description ? `Description: ${repo.description}` : null,
    `Stars: ${repo.stargazers_count} | Forks: ${repo.forks_count} | Updated: ${repo.pushed_at?.slice(0, 10)}`,
    repo.topics?.length ? `Topics: ${repo.topics.join(", ")}` : null,
    readme ? `README excerpt:\n${readme}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

async function buildProfileText(owner) {
  const [user, repos] = await Promise.all([
    ghFetch(`/users/${owner}`),
    ghFetch(`/users/${owner}/repos?per_page=100&sort=updated`),
  ]);

  const langCount = {};
  repos.forEach((r) => {
    if (r.language) langCount[r.language] = (langCount[r.language] || 0) + 1;
  });
  const topLangs = Object.entries(langCount)
    .sort((a, b) => b[1] - a[1])
    .map(([l]) => l);
  const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const featured = [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 5);

  const sections = [
    `Candidate GitHub Profile: ${user.login}`,
    user.name ? `Name: ${user.name}` : null,
    [user.company, user.location].filter(Boolean).join(" | "),
    user.bio ? `Bio: ${user.bio}` : null,
    `Public repositories: ${repos.length} | Total stars: ${totalStars} | Followers: ${user.followers}`,
    topLangs.length
      ? `Top languages: ${topLangs.slice(0, 6).join(", ")}`
      : null,
    ``,
    `Featured Projects (top ${featured.length} by stars):`,
  ].filter((s) => s !== null);

  // READMEs for top 3 repos only, to stay within rate limits
  for (const repo of featured.slice(0, 3)) {
    const readme = await fetchReadme(repo.owner.login, repo.name);
    sections.push(buildRepoBlock(repo, readme), ``);
  }
  featured
    .slice(3)
    .forEach((repo) => sections.push(buildRepoBlock(repo, null), ``));

  return sections.join("\n");
}

/** Main entry point — accepts a GitHub profile OR repository URL. */
export async function fetchGitHubData(url) {
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    throw new Error(
      "Please enter a valid GitHub link, e.g. https://github.com/username",
    );
  }

  if (!parsed.repo) return buildProfileText(parsed.owner);

  // Single repository link
  const repo = await ghFetch(`/repos/${parsed.owner}/${parsed.repo}`);
  const readme = await fetchReadme(parsed.owner, parsed.repo);
  return [
    `GitHub Repository Analysis`,
    `Repository: ${repo.full_name}`,
    repo.description ? `Description: ${repo.description}` : null,
    `Language: ${repo.language || "Not specified"}`,
    `Stars: ${repo.stargazers_count} | Forks: ${repo.forks_count}`,
    ``,
    buildRepoBlock(repo, readme),
  ]
    .filter((s) => s !== null)
    .join("\n");
}

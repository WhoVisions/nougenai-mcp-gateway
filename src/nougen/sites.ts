export const SITES = [
  { name: "WhoVisions", url: "whovisions.com", role: "Creative Services & Production" },
  { name: "WhoVisions Presents", url: "whovisionspresents.com", role: "Cinematic Hub" },
  { name: "Ai with Dav3", url: "aiwithdav3.com", role: "Builder Lab & AI Experiments" },
  { name: "NouGenAI", url: "nougenai.com", role: "AI Ecosystem & Gateway" },
  { name: "Learn with Mrs B", url: "learnwithmrsb.com", role: "Education" },
  { name: "Goddexx Snow", url: "goddexxsnow.com", role: "Artist/Creator Profile" },
  { name: "Liv The Moment", url: "livthemoment.com", role: "Lifestyle/Community" }
];

export function getSiteContext(query: string) {
  const normalizedQuery = query.toLowerCase();
  return SITES.find(
    site => site.name.toLowerCase().includes(normalizedQuery) || site.url.includes(normalizedQuery)
  );
}

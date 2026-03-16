(function initBlacklist() {
  const RAW_BLACKLIST = [
    "fuck", "fucking", "fucker", "motherfucker",
    "shit", "shitty", "bullshit",
    "bitch", "bastard", "asshole", "dick", "dickhead", "cock",
    "pussy", "cunt", "slut", "whore",
    "retard", "idiot", "moron", "stupid",
    "nigga", "nigger", "faggot", "kike", "spic", "chink",
    "pedo", "rapist", "rape", "kill yourself", "kys", "die"
  ];

  const LEET_MAP = {
    "0": "o",
    "1": "i",
    "3": "e",
    "4": "a",
    "5": "s",
    "7": "t",
    "8": "b",
    "@": "a",
    "$": "s",
    "!": "i"
  };

  function normalizeText(value) {
    const lower = String(value || "").toLowerCase();
    const replaced = lower
      .split("")
      .map((ch) => LEET_MAP[ch] || ch)
      .join("");

    return replaced
      .normalize("NFKD")
      .replace(/[^a-z\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function collapsedText(value) {
    return normalizeText(value).replace(/\s+/g, "");
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  const UNIQUE_WORDS = [...new Set(RAW_BLACKLIST.map((w) => normalizeText(w)).filter(Boolean))];

  const PATTERNS = UNIQUE_WORDS.map((word) => {
    const condensed = word.replace(/\s+/g, "");
    const spacerPattern = condensed
      .split("")
      .map((ch) => escapeRegExp(ch))
      .join("[^a-z0-9]*");

    return {
      word,
      condensed,
      boundary: new RegExp(`(^|[^a-z])${escapeRegExp(word)}([^a-z]|$)`, "i"),
      spaced: new RegExp(spacerPattern, "i")
    };
  });

  function containsBlacklistedWords(input) {
    const original = String(input || "");
    const normalized = normalizeText(original);
    const collapsed = collapsedText(original);

    for (const pattern of PATTERNS) {
      if (
        pattern.boundary.test(normalized) ||
        pattern.spaced.test(normalized) ||
        collapsed.includes(pattern.condensed)
      ) {
        return { flagged: true, word: pattern.word };
      }
    }

    return { flagged: false, word: "" };
  }

  window.BLACKLISTED_WORDS = UNIQUE_WORDS;
  window.containsBlacklistedWords = containsBlacklistedWords;
})();

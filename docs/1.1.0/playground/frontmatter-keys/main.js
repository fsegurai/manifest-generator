import { ALLOWED_FRONTMATTER_KEYS, diceSimilarity, parseFrontmatter } from '@fsegurai/manifest-generator';

// `manifest-generator validate` (validateDocs) reports unknown keys as "possible typo" for every file of a folder,
// reading it with node:fs. Here the same key list checks one in-memory page, and diceSimilarity (the score the
// generator uses to drop near-duplicate headings) suggests the closest allowed key.
const allowed = [...ALLOWED_FRONTMATTER_KEYS];
const frontmatter = parseFrontmatter(window.playgroundFiles['page.md']);

/** The allowed key most similar to `key`, when it is similar enough to be a likely typo. */
function closestKey(key) {
  const [best] = allowed
    .map((candidate) => ({ candidate, score: diceSimilarity(key.toLowerCase(), candidate.toLowerCase()) }))
    .sort((a, b) => b.score - a.score);
  return best && best.score >= 0.5 ? best.candidate : undefined;
}

const rows = Object.entries(frontmatter).map(([key, value]) => {
  const known = ALLOWED_FRONTMATTER_KEYS.has(key);
  const suggestion = known ? undefined : closestKey(key);
  return { key, value, known, suggestion };
});

const tbody = document.querySelector('#keys');
for (const { key, value, known, suggestion } of rows) {
  const row = tbody.insertRow();
  const keyCell = document.createElement('th');
  keyCell.scope = 'row';
  keyCell.innerHTML = '<code></code>';
  keyCell.firstChild.textContent = key;
  row.append(keyCell);
  // The value as parseFrontmatter read it from the YAML block (lists become arrays).
  row.insertCell().textContent = JSON.stringify(value);
  const result = row.insertCell();
  result.className = known ? 'ok' : 'warn';
  result.textContent = known
    ? 'Allowed'
    : `Unknown key — possible typo${suggestion ? ` (did you mean "${suggestion}"?)` : ''}`;
}

const unknown = rows.filter((row) => !row.known);
document.querySelector('#summary').textContent =
  rows.length === 0
    ? 'No frontmatter found: add a --- block at the top of page.md.'
    : `${rows.length} keys, ${unknown.length} unknown.`;
document.querySelector('#allowed').textContent = allowed.join(', ');

for (const { key, suggestion } of unknown) {
  console.warn(`Unknown frontmatter key "${key}"${suggestion ? ` — did you mean "${suggestion}"?` : ''}`);
}

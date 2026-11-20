import { cleanItem, generateManifestFromFiles } from '@fsegurai/manifest-generator/core';

// generateManifestFromFiles() runs the same walker as the CLI over in-memory files, so it works in a browser.
// This sample turns on every opt-in output option of 1.2.0:
// - prevNext: `prev` / `next` links on page items, in reading order
// - headingAnchors: `sections` ({ text, id, level }) on search entries, with GitHub-style ids for deep links
// - extraFrontmatter: unknown frontmatter keys (`owner`, `reviewedAt`) copied into `meta`
// - readingTime: `wordCount` and `readingTime` (minutes, 200 words per minute) on page items
// changelog.md has `hidden: true`: it is left out of the navigation but stays in the search index.
const files = Object.entries(window.playgroundFiles)
  .filter(([name]) => /\.(md|mdx)$/.test(name))
  .map(([path, content]) => ({ path, content }));

const { manifest, searchIndex } = generateManifestFromFiles(files, {
  prevNext: true,
  headingAnchors: true,
  extraFrontmatter: true,
  readingTime: true,
});
const cleaned = manifest.map(cleanItem);
const sectionsByRoute = new Map(searchIndex.map((entry) => [entry.route, entry.sections ?? []]));

/** Renders the manifest as a sidebar: reading time, meta, and the heading anchors of each page. */
function renderList(items) {
  const list = document.createElement('ul');
  for (const item of items) {
    const entry = document.createElement('li');
    const label = document.createElement('span');
    label.className = 'page';
    label.textContent = item.label;
    entry.append(label);

    const details = [];
    if (item.readingTime !== undefined) details.push(`${item.readingTime} min · ${item.wordCount} words`);
    if (item.next) details.push(`next: ${item.next.label}`);
    if (item.meta) details.push(`meta: ${JSON.stringify(item.meta)}`);
    if (details.length > 0) {
      const small = document.createElement('small');
      small.className = 'meta';
      small.textContent = details.join(' · ');
      entry.append(small);
    }

    const sections = sectionsByRoute.get(item.route) ?? [];
    if (sections.length > 0) {
      const anchors = document.createElement('ul');
      anchors.className = 'sections';
      for (const section of sections) {
        const anchor = document.createElement('li');
        const link = document.createElement('a');
        link.href = `#${section.id}`;
        link.textContent = `${section.text} (#${section.id})`;
        anchor.append(link);
        anchors.append(anchor);
      }
      entry.append(anchors);
    }

    if (item.children) entry.append(renderList(item.children));
    list.append(entry);
  }
  return list;
}

const hidden = searchIndex.filter((entry) => entry.hidden).map((entry) => entry.label);
document.querySelector('#nav').replaceChildren(renderList(cleaned));
document.querySelector('#manifest-json').textContent = JSON.stringify(cleaned, null, 2);
document.querySelector('#search-json').textContent = JSON.stringify(searchIndex, null, 2);
document.querySelector('#summary').textContent =
  hidden.length > 0 ? `Hidden (search only): ${hidden.join(', ')}` : 'No hidden pages.';

console.log(`${cleaned.length} navigation items, ${searchIndex.length} search entries`);

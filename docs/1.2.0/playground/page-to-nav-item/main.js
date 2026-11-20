import {
  cleanItem,
  extractHeadings,
  formatTitle,
  makeBreadcrumb,
  makeExcerpt,
  parseFrontmatter,
} from '@fsegurai/manifest-generator/core';

// walkDocs() reads a folder with node:fs, so it cannot run in a browser. The exported helpers it is built on can:
// this sample applies them to one in-memory page the same way the generator does for each Markdown file.
const source = window.playgroundFiles['page.md'];
const fileInput = document.querySelector('#file-name');

/** The page body without its frontmatter block (the part headings and the excerpt come from). */
const bodyOf = (markdown) => markdown.replace(/^---\s*\n[\s\S]*?\n\s*---\n*/, '');

function render() {
  const fileName = fileInput.value.trim() || 'untitled.md';
  const frontmatter = parseFrontmatter(source);
  const body = bodyOf(source);
  const route = fileName.replace(/\.(md|mdx)$/, '');

  // Label from the frontmatter, or derived from the file name ("my-page.md" -> "My Page").
  const label = frontmatter.label || formatTitle(fileName);
  const breadcrumb = makeBreadcrumb([], { label: frontmatter.breadcrumbTitle || label, route });

  // cleanItem() drops empty values (null, false, '', undefined), as in the written manifest.json.
  const item = cleanItem({
    label,
    description: frontmatter.description || '',
    route,
    tags: frontmatter.tags || [],
    order: frontmatter.order,
    icon: frontmatter.icon || null,
    badge: frontmatter.badge || null,
    badgeColor: frontmatter.badgeColor || null,
    breadcrumb,
  });

  // extractHeadings() keeps h2/h3 titles and drops near-duplicates; makeExcerpt() strips Markdown to ~150 chars.
  const headings = extractHeadings(body);
  const searchEntry = {
    label: item.label,
    description: item.description,
    route,
    tags: item.tags,
    headings: headings.length > 0 ? headings : undefined,
    excerpt: makeExcerpt(body) || undefined,
    breadcrumb,
  };

  const preview = document.querySelector('#nav-preview');
  preview.replaceChildren();
  const link = document.createElement('span');
  link.className = 'nav-link';
  link.textContent = item.label;
  preview.append(link);
  if (item.badge) {
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.dataset.color = item.badgeColor ?? '';
    badge.textContent = item.badge;
    preview.append(badge);
  }
  const routeText = document.createElement('code');
  routeText.textContent = `/${route}`;
  preview.append(routeText);

  document.querySelector('#nav-json').textContent = JSON.stringify(item, null, 2);
  document.querySelector('#search-json').textContent = JSON.stringify(searchEntry, null, 2);
  console.log(
    `"${item.label}": ${headings.length} search headings, excerpt of ${searchEntry.excerpt?.length ?? 0} chars`,
  );
}

fileInput.addEventListener('input', render);
render();

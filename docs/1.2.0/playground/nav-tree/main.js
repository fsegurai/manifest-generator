import {
  cleanItem,
  extractHeadings,
  formatTitle,
  makeBreadcrumb,
  makeExcerpt,
  parseFrontmatter,
  sortItems,
} from '@fsegurai/manifest-generator/core';

// This sample rebuilds one "guides" folder from the in-memory .md files with the helpers the walker is made of:
// drafts are skipped, hidden pages stay searchable but leave the navigation, items are sorted by `order` then label,
// and every item gets its breadcrumb. To do all of it in one call, see the "1.2.0 features" sample
// (generateManifestFromFiles).
const folder = { name: 'guides', label: formatTitle('guides') };
const parent = [{ label: folder.label, route: folder.name }];
const bodyOf = (markdown) => markdown.replace(/^---\s*\n[\s\S]*?\n\s*---\n*/, '');

const pages = Object.entries(window.playgroundFiles).filter(([name]) => /\.(md|mdx)$/.test(name));
const searchIndex = [];
const skipped = [];

const children = pages.flatMap(([fileName, source]) => {
  const frontmatter = parseFrontmatter(source);
  if (frontmatter.draft) {
    skipped.push(fileName);
    return [];
  }
  const route = `${folder.name}/${fileName.replace(/\.(md|mdx)$/, '')}`;
  const label = frontmatter.label || formatTitle(fileName);
  const body = bodyOf(source);
  const item = {
    label,
    description: frontmatter.description || '',
    route,
    tags: frontmatter.tags || [],
    order: frontmatter.order,
    badge: frontmatter.badge || null,
    badgeColor: frontmatter.badgeColor || null,
    breadcrumb: makeBreadcrumb(parent, { label: frontmatter.breadcrumbTitle || label, route }),
  };
  const headings = extractHeadings(body);
  searchIndex.push({
    label,
    description: item.description,
    route,
    tags: item.tags,
    headings: headings.length > 0 ? headings : undefined,
    excerpt: makeExcerpt(body) || undefined,
    breadcrumb: item.breadcrumb,
    ...(frontmatter.hidden ? { hidden: true } : {}),
  });
  if (frontmatter.hidden) {
    skipped.push(`${fileName} (hidden: search only)`);
    return [];
  }
  return [item];
});

const section = { label: folder.label, route: folder.name, isParent: true, breadcrumb: parent, children };
const manifest = sortItems([section]).map(cleanItem);

/** Renders the manifest as the nested list a docs sidebar would show. */
function renderList(items) {
  const list = document.createElement('ul');
  for (const item of items) {
    const entry = document.createElement('li');
    const label = document.createElement('span');
    label.className = item.isParent ? 'section' : 'page';
    label.textContent = item.label;
    entry.append(label);
    if (item.badge) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = item.badge;
      entry.append(' ', badge);
    }
    if (!item.isParent) {
      const crumbs = document.createElement('small');
      crumbs.textContent = item.breadcrumb.map((segment) => segment.label).join(' › ');
      entry.append(crumbs);
    }
    if (item.children) entry.append(renderList(item.children));
    list.append(entry);
  }
  return list;
}

document.querySelector('#nav').replaceChildren(renderList(manifest));
document.querySelector('#manifest-json').textContent = JSON.stringify(manifest, null, 2);
document.querySelector('#search-json').textContent = JSON.stringify(searchIndex, null, 2);
document.querySelector('#skipped').textContent =
  skipped.length > 0 ? `Not in the navigation: ${skipped.join(', ')}` : 'No draft or hidden pages.';

console.log(
  `${children.length} pages in the manifest, ${searchIndex.length} search entries, ${skipped.length} skipped`,
);

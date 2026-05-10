# Installation

Use one of these paths depending on how you want to run the generator.

## Option 1: `npx` (no install)

```bash
npx @fsegurai/manifest-generator --help
```

Best when you want to try the tool quickly or use it occasionally.

## Option 2: Add to your project

```bash
npm install --save-dev @fsegurai/manifest-generator
# or
bun add -d @fsegurai/manifest-generator
```

Best for teams and CI/CD because the version is pinned in your project.

## Option 3: Global install

```bash
npm install -g @fsegurai/manifest-generator
manifest-generator --help
```

Best when you use it often across many repositories.

## Requirements

- Node.js 22+
- Markdown docs in `.md` files

## Verify installation

```bash
npx @fsegurai/manifest-generator --version
npx @fsegurai/manifest-generator --discover --docs-root ./docs
```

## Add scripts to your project

```json
{
  "scripts": {
    "docs:manifest": "manifest-generator --route ./docs",
    "docs:manifest:all": "manifest-generator --all --docs-root ./packages"
  }
}
```

## Next step

Continue to [First Steps](first-steps.md) for a full end-to-end example.

# Help & Support

Use this page when CLI runs fail, when no docs are discovered, or when output files are missing.

## Quick checks

- Confirm the docs path exists.
- Run `--discover` before full generation.
- Verify your docs contain `.md` files.

## Common fixes

### Missing docs root

```bash
npx @fsegurai/manifest-generator --docs-root ./docs --all
```

If `./docs` does not exist, create it or point to the correct directory.

### See what will be processed

```bash
npx @fsegurai/manifest-generator --discover --docs-root ./projects
```

### Generate to a fresh output folder

```bash
npx @fsegurai/manifest-generator --route ./docs --output ./tmp/docs-data
```

The output folder is created automatically.

## More help

- [FAQ](faq.md)
- [Troubleshooting](troubleshooting.md)
- [Getting Started](../getting-started/README.md)

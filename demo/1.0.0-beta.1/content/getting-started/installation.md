# Installation

This guide covers all the different ways to install and set up the Manifest Generator.

## Installation Methods

### Using npx (Recommended)

The fastest way to get started - no installation required:

```bash
npx @fsegurai/manifest-generator --help
```

**Advantages:**
- ✅ Always uses the latest version
- ✅ No global installation needed
- ✅ Works in any project immediately
- ✅ No maintenance required

**Usage:**
```bash
# Generate manifests for current directory docs
npx @fsegurai/manifest-generator --route ./docs

# Process all projects in workspace
npx @fsegurai/manifest-generator --all
```

### Global Installation

Install once and use anywhere on your system:

```bash
npm install -g @fsegurai/manifest-generator
```

**Advantages:**
- ✅ Shorter command (`manifest-generator` instead of `npx @fsegurai/manifest-generator`)
- ✅ Works offline after installation
- ✅ Consistent version across projects

**Usage:**
```bash
# After global installation
manifest-generator --help
manifest-generator --route ./docs
```

**Update global installation:**
```bash
npm update -g @fsegurai/manifest-generator
```

### Project Dependency

Add to your specific project:

```bash
# As a dev dependency (recommended)
npm install --save-dev @fsegurai/manifest-generator

# As a regular dependency
npm install @fsegurai/manifest-generator
```

**Advantages:**
- ✅ Version pinned to your project
- ✅ Team members get same version
- ✅ Works with package-lock.json
- ✅ Integrates with npm scripts

**Package.json integration:**
```json
{
  "scripts": {
    "docs:build": "manifest-generator --all",
    "docs:dev": "manifest-generator --route ./docs",
    "prebuild": "npm run docs:build"
  },
  "devDependencies": {
    "@fsegurai/manifest-generator": "^0.0.0-alpha.2"
  }
}
```

**Usage:**
```bash
# Run via npm script
npm run docs:build

# Or run directly
npx manifest-generator --route ./docs
```

## System Requirements

### Node.js Version
- **Minimum:** Node.js 16.0.0
- **Recommended:** Node.js 18.0.0 or higher
- **LTS versions** are preferred for stability

**Check your Node.js version:**
```bash
node --version
```

**Update Node.js:**
- Visit [nodejs.org](https://nodejs.org) for the latest version
- Or use a version manager like `nvm`:
  ```bash
  nvm install --lts
  nvm use --lts
  ```

### Operating System Support
- ✅ **Windows** 10/11
- ✅ **macOS** 10.15+
- ✅ **Linux** (Ubuntu, Debian, CentOS, etc.)

### Disk Space
- **Installation size:** ~5MB
- **Runtime requirements:** Minimal (depends on documentation size)

## Verification

After installation, verify everything works:

```bash
# Check version
npx @fsegurai/manifest-generator --version

# Check help
npx @fsegurai/manifest-generator --help

# Test with sample documentation
mkdir test-docs
echo "# Test" > test-docs/README.md
npx @fsegurai/manifest-generator --route ./test-docs
```

## Troubleshooting Installation

### Permission Errors (Global Installation)

**On macOS/Linux:**
```bash
# Use sudo (not recommended)
sudo npm install -g @fsegurai/manifest-generator

# Better: Configure npm to use different directory
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

**On Windows:**
- Run PowerShell/Command Prompt as Administrator
- Or use `npx` instead of global installation

### Network Issues

**Behind corporate firewall:**
```bash
# Configure npm proxy
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Or install from tarball
npm install -g https://registry.npmjs.org/@fsegurai/manifest-generator/-/manifest-generator-0.0.0-alpha.2.tgz
```

### Version Conflicts

**Clear npm cache:**
```bash
npm cache clean --force
```

**Reinstall:**
```bash
npm uninstall -g @fsegurai/manifest-generator
npm install -g @fsegurai/manifest-generator
```

## Next Steps

After successful installation:

1. 👶 Continue to [First Steps](first-steps.md) for your first manifest
2. 📚 Read the [CLI Usage Guide](../guides/cli-usage.md) for all commands
3. ⚙️ Check [Configuration](../guides/configuration.md) for customization options

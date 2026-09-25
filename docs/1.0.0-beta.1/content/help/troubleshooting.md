# Troubleshooting

Common issues and their solutions when using the Manifest Generator.

## Installation Issues

### Command Not Found

**Problem**: Getting "command not found" error when running `manifest-generator`.

**Solutions:**
1. **Use npx** (recommended - no installation required):
   ```bash
   npx @fsegurai/manifest-generator --help
   ```

2. **Install globally**:
   ```bash
   npm install -g @fsegurai/manifest-generator
   manifest-generator --help
   ```

3. **Check PATH** if globally installed:
   ```bash
   npm list -g @fsegurai/manifest-generator
   which manifest-generator  # Linux/macOS
   where manifest-generator  # Windows
   ```

### Permission Denied Errors

**Problem**: Getting permission errors when trying to write files.

**Solutions:**
1. **Check output directory permissions**:
   ```bash
   ls -la ./output-directory  # Linux/macOS
   dir /a ./output-directory  # Windows
   ```

2. **Use different output locations**:
   ```bash
   npx @fsegurai/manifest-generator --route ./docs --output ./tmp
   ```

3. **Fix permissions** (Linux/macOS):
   ```bash
   chmod 755 ./output-directory
   ```

4. **Run as administrator** (Windows):
   - Right-click Command Prompt/PowerShell
   - Select "Run as administrator"

### Network/Proxy Issues

**Problem**: Cannot download the package due to network restrictions.

**Solutions:**
1. **Configure npm proxy**:
   ```bash
   npm config set proxy http://proxy.company.com:8080
   npm config set https-proxy http://proxy.company.com:8080
   ```

2. **Use different registries**:
   ```bash
   npm install --registry https://registry.npmjs.org/ @fsegurai/manifest-generator
   ```

3. **Clear npm cache**:
   ```bash
   npm cache clean --force
   ```

## Generation Issues

### No Projects or Files Found

**Problem**: The tool reports "No projects found" or generates empty manifests.

**Diagnosis Steps:**
1. **Check what would be discovered**:
   ```bash
   npx @fsegurai/manifest-generator --discover
   ```

2. **Verify directory structure**:
   ```bash
   ls -la ./docs  # Linux/macOS
   dir ./docs     # Windows
   ```

**Solutions:**
1. **Check file extensions**:
   - Ensure files have `.md` extension
   - Verify files aren't hidden (starting with `.`)

2. **Verify frontmatter**:
   ```markdown
   ---
   draft: false  # Remove draft: true
   hidden: false # Remove hidden: true
   ---
   ```

3. **Use the correct subfolder name**:
   ```bash
   npx @fsegurai/manifest-generator --all --docs-subfolder your-folder-name
   ```

4. **Check directory exists**:
   ```bash
   # Make sure docs directory exists
   mkdir docs
   echo "# Test" > docs/README.md
   ```

### Invalid JSON Output

**Problem**: Generated JSON files are invalid or corrupted.

**Diagnosis:**
```bash
# Validate JSON files
node -e "JSON.parse(require('fs').readFileSync('./docs/manifest.json', 'utf8'))"
node -e "JSON.parse(require('fs').readFileSync('./docs/search-index.json', 'utf8'))"
```

**Solutions:**
1. **Check frontmatter syntax**:
   ```yaml
   ---
   # Good: proper array syntax
   tags: [guide, tutorial]
   
   # Good: quoted strings with special characters
   label: "API: Getting Started"
   
   # Good: boolean values
   draft: false
   ---
   ```

2. **Avoid problematic frontmatter**:
   ```yaml
   ---
   # Bad: unclosed array
   tags: [guide, tutorial
   
   # Bad: unquoted string with colons
   label: API: Getting Started
   
   # Bad: invalid boolean
   draft: yes
   ---
   ```

3. **Re-generate manifests**:
   ```bash
   rm manifest.json search-index.json
   npx @fsegurai/manifest-generator --route ./docs
   ```

### Empty or Incomplete Results

**Problem**: Generated manifests are empty or missing expected content.

**Common Causes:**
1. **Draft/Hidden Content**:
   ```markdown
   ---
   draft: true    # This excludes the file
   hidden: true   # This also excludes the file
   ---
   ```

2. **Incorrect File Extensions**:
   - Only `.md` files are processed
   - `.txt`, `.html`, and other formats are ignored

3. **Wrong Directory Structure**:
   ```bash
   # Check current structure
   find . -name "*.md" -type f
   ```

**Solutions:**
1. **Remove exclusion flags**:
   ```markdown
   ---
   label: "My Page"
   tags: [guide]
   # Remove or set to false: draft: true
   # Remove or set to false: hidden: true
   ---
   ```

2. **Verify file paths**:
   ```bash
   npx @fsegurai/manifest-generator --route ./correct/path/to/docs
   ```

3. **Test with a simple example**:
   ```bash
   mkdir test-docs
   echo "# Test Page" > test-docs/README.md
   npx @fsegurai/manifest-generator --route ./test-docs
   ```

## Configuration Issues

### Wrong Documentation Folder

**Problem**: Tool doesn't find documentation in custom folder names.

**Solutions:**
1. **Specify custom subfolder**:
   ```bash
   npx @fsegurai/manifest-generator --all --docs-subfolder documentation
   npx @fsegurai/manifest-generator --all --docs-subfolder guides
   ```

2. **Use direct route**:
   ```bash
   npx @fsegurai/manifest-generator --route ./my-custom-docs-folder
   ```

3. **Check discovered projects**:
   ```bash
   npx @fsegurai/manifest-generator --discover --docs-subfolder your-folder-name
   ```

### Output Files Not Created

**Problem**: No manifest.json or search-index.json files are generated.

**Diagnosis:**
1. **Check write permissions**:
   ```bash
   touch ./docs/test-file.txt  # Should succeed
   rm ./docs/test-file.txt
   ```

2. **Verify output directory**:
   ```bash
   ls -la ./docs/  # Look for manifest.json and search-index.json
   ```

**Solutions:**
1. **Use custom output directory**:
   ```bash
   npx @fsegurai/manifest-generator --route ./docs --output ./tmp
   ```

2. **Create output directory**:
   ```bash
   mkdir -p ./public/data
   npx @fsegurai/manifest-generator --route ./docs --output ./public/data
   ```

3. **Check for error messages**:
   ```bash
   # Run with verbose output
   npx @fsegurai/manifest-generator --route ./docs 2>&1 | tee generation.log
   ```

## Performance Issues

### Slow Generation

**Problem**: Manifest generation takes too long.

**Solutions:**
1. **Process specific projects instead of --all**:
   ```bash
   npx @fsegurai/manifest-generator --project specific-project
   ```

2. **Use specific routes**:
   ```bash
   npx @fsegurai/manifest-generator --route ./docs/specific-section
   ```

3. **Remove unnecessary files**:
   - Delete draft files if not needed
   - Remove hidden files from processing

4. **Check file sizes**:
   ```bash
   find ./docs -name "*.md" -exec wc -l {} \;  # Check line counts
   ```

### Memory Issues

**Problem**: Process runs out of memory with large documentation sets.

**Solutions:**
1. **Increase Node.js memory limit**:
   ```bash
   node --max-old-space-size=4096 $(which npx) @fsegurai/manifest-generator --all
   ```

2. **Process in smaller batches**:
   ```bash
   # Process each project separately
   for project in packages/*/; do
     npx @fsegurai/manifest-generator --route "$project/docs"
   done
   ```

3. **Split large documentation**:
   - Break large files into smaller sections
   - Use nested directory structures

## Build Integration Issues

### Build Failures

**Problem**: Manifest generation fails in CI/CD pipelines.

**Common Causes:**
1. **Node.js version mismatch**
2. **Missing dependencies**
3. **Permission issues in containers**
4. **Path differences between environments**

**Solutions:**
1. **Specify Node.js version**:
   ```yaml
   # GitHub Actions
   - uses: actions/setup-node@v4
     with:
       node-version: '18'
   ```

2. **Use absolute paths**:
   ```bash
   npx @fsegurai/manifest-generator --route /github/workspace/docs
   ```

3. **Install dependencies**:
   ```bash
   npm ci  # Before running manifest generator
   ```

4. **Check container permissions**:
   ```dockerfile
   RUN chown -R node:node /app
   USER node
   ```

### Watch Mode Issues

**Problem**: File watcher not detecting changes.

**Solutions:**
1. **Use proper file watcher**:
   ```bash
   npm install -g chokidar-cli
   chokidar 'docs/**/*.md' -c 'npx @fsegurai/manifest-generator --route ./docs'
   ```

2. **Check file system events**:
   ```bash
   # Test if files are being watched
   chokidar 'docs/**/*.md' -c 'echo "File changed: {{path}}"'
   ```

3. **Use polling for network drives**:
   ```bash
   chokidar 'docs/**/*.md' --polling -c 'npx @fsegurai/manifest-generator --route ./docs'
   ```

## Debugging Tips

### Enable Verbose Output

```bash
# Add debugging to your commands
DEBUG=* npx @fsegurai/manifest-generator --route ./docs

# Or capture output
npx @fsegurai/manifest-generator --route ./docs > generation.log 2>&1
```

### Test with Minimal Example

```bash
# Create minimal test case
mkdir test-minimal
echo "# Test" > test-minimal/README.md
echo "---\nlabel: Test\n---\n# Content" > test-minimal/test.md

# Test generation
npx @fsegurai/manifest-generator --route ./test-minimal

# Check results
cat test-minimal/manifest.json
cat test-minimal/search-index.json
```

### Validate Environment

```bash
# Check Node.js version
node --version  # Should be 16+

# Check npm configuration
npm config list

# Check global packages
npm list -g --depth=0

# Test basic functionality
npx @fsegurai/manifest-generator --version
```

## Getting Additional Help

If you're still experiencing issues:

1. **Check existing issues**: Search [GitHub Issues](https://github.com/fsegurai/manifest-generator/issues)
2. **Create a detailed bug report** with:
   - Command used
   - Directory structure
   - Error messages
   - Environment details (OS, Node.js version)
3. **Provide minimal reproduction case**
4. **Include generated log files**

Remember to check the [FAQ](faq.md) for additional common questions and answers.

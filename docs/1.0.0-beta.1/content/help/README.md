# Help & Support

Get help with common issues, troubleshooting tips, and answers to frequently asked questions.

## 📚 Help Resources

- [❓ FAQ—](faq.md)Frequently asked questions and quick answers
- [🔧 Troubleshooting—](troubleshooting.md)Common issues and their solutions

## Quick Help

### Common Issues
- **No files found**: Check file extensions (`.md` required) and frontmatter flags
- **Permission errors**: Verify write permissions to output directories
- **Command isn't found**: Use `npx @fsegurai/manifest-generator` instead

### Getting Support
- 📖 **Documentation**: Start with [Getting Started](../getting-started/)
- 🐛 **Bug Reports**: Open issues on GitHub with detailed information
- 💬 **Questions**: Check existing GitHub issues or open a new discussion

## Quick Troubleshooting

### Installation Issues
```bash
# Use npx (no installation required)
npx @fsegurai/manifest-generator --help

# Or install globally
npm install -g @fsegurai/manifest-generator
```

### Generation Problems
```bash
# Check what would be processed
npx @fsegurai/manifest-generator --discover

# Verify file structure
ls -la docs/

# Test with simple example
mkdir test-docs && echo "# Test" > test-docs/README.md
npx @fsegurai/manifest-generator --route ./test-docs
```

## Support Channels

- 📖 **Documentation**: Complete guides and references
- 🐛 **GitHub Issues**: Bug reports and feature requests
- 💬 **Discussions**: Community help and questions
- 📧 **Direct Contact**: Maintainer contact through GitHub

## Contributing Help

If you'd like to help improve the documentation or fix issues:
- 🔧 **Bug Fixes**: Submit pull requests for issues
- 📖 **Documentation**: Improve guides and examples
- 🧪 **Testing**: Help test new features and report issues

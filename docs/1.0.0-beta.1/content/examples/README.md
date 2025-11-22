# Examples

Real-world examples and practical scenarios for using the Manifest Generator across different project types and workflows.

## 📚 Example Categories

- [🚀 Basic Usage](basic-usage.md) - Simple examples for getting started
- [🔧 Framework Examples](frameworks.md) - React, Vue, Angular, Next.js implementations
- [⚡ Advanced Usage](advanced.md) - Complex scenarios and custom workflows

## Quick Examples

### Single Project
```bash
# Generate for current project's docs
npx @fsegurai/manifest-generator --route ./docs
```

### Multiple Projects (Monorepo)
```bash
# Process all projects in packages directory
npx @fsegurai/manifest-generator --all --docs-root ./packages
```

### Custom Output Location
```bash
# Save manifests to specific location
npx @fsegurai/manifest-generator --route ./docs --output ./public/data
```

## Use Case Examples

### Documentation Sites
- Static site generators (Gatsby, Next.js, Hugo)
- Documentation platforms (Docusaurus, VitePress)
- Custom documentation websites

### API Documentation
- REST API references
- GraphQL schema documentation
- SDK and library documentation

### Knowledge Bases
- Internal company wikis
- Product documentation
- Technical guides and tutorials

### Multi-Project Documentation
- Monorepo documentation management
- Microservices documentation
- Multi-language documentation

## Getting Started

1. 🚀 **Simple Examples**: Start with [Basic Usage](basic-usage.md)
2. 🔧 **Framework Specific**: Check [Framework Examples](frameworks.md)
3. ⚡ **Complex Scenarios**: Explore [Advanced Usage](advanced.md)

## Example Categories by Use Case

### Development Workflows
- Local development setup
- Hot reload integration
- Build system automation

### Production Deployments
- CI/CD pipeline integration
- Static site generation
- Content delivery networks

### Team Collaboration
- Shared documentation standards
- Multi-contributor workflows
- Version control integration

## Next Steps

- 📚 **Detailed Guides**: Read the [Guides](../guides/) for comprehensive instructions
- 🔗 **Integration**: Check [Integration](../integration/) for build system setup
- ❓ **Troubleshooting**: Visit [FAQ](../help/faq.md) for common issues

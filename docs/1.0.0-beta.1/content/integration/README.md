# Integration

Learn how to integrate the Manifest Generator into your development workflows, build systems, and CI/CD pipelines.

## 📚 Integration Guides

- [🔧 Build Systems—](build-systems.md)Webpack, Vite, Rollup, and other build tool integration
- [🚀 Frameworks—](frameworks.md)React, Vue, Angular, Next.js, and framework-specific integration
- [⚙️ CI/CD](ci-cd.md) - GitHub Actions, GitLab CI, Azure DevOps pipeline integration

## Integration Categories

### Build Systems
- **Webpack**: Custom plugins and loader integration
- **Vite**: Plugin development and build hooks
- **Rollup**: Build process integration
- **npm Scripts**: Package.json automation

### Frontend Frameworks
- **React**: Hooks, components, and build integration
- **Vue.js**: Composable, plugins, and CLI integration
- **Angular**: Services, modules, and build pipeline
- **Next.js**: API routes and build-time generation

### Static Site Generators
- **Gatsby**: Plugin development and GraphQL integration
- **Hugo**: Template integration and build processes
- **Jekyll**: Liquid template integration
- **Astro**: Island architecture and build hooks

### CI/CD Platforms
- **GitHub Actions**: Workflow automation
- **GitLab CI**: Pipeline integration
- **Azure DevOps**: Build pipeline setup
- **Jenkins**: Job configuration

## Integration Patterns

### Development Workflow
- **Watch Mode**: Automatic regeneration during development
- **Hot Reload**: Integration with development servers
- **Pre-commit Hooks**: Ensure manifests are always current

### Production Builds
- **Build-time Generation**: Create manifests during compilation
- **Asset Pipeline**: Include manifests in build output
- **CDN Integration**: Deploy manifests to content delivery networks

### Deployment
- **Static Hosting**: Deploy to GitHub Pages, Netlify, Vercel
- **Server Integration**: Dynamic manifest serving
- **Microservices**: Documentation service architecture

## Getting Started

1. 🚀 **Quick Setup**: Start with [Getting Started](../getting-started/)
2. 🔧 **Build Tools**: Configure your [Build Systems](build-systems.md)
3. 🚀 **Framework**: Set up your [Framework](frameworks.md) integration
4. ⚙️ **Automation**: Implement [CI/CD](ci-cd.md) workflows

## Best Practices

- **Version Control**: Don't commit generated files in development
- **Caching**: Cache node_modules and generated files when possible
- **Error Handling**: Always include error handling in integration scripts
- **Validation**: Test generated JSON files are valid
- **Documentation**: Document your integration setup for team members

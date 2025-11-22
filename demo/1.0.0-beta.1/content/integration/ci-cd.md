# CI/CD Integration

Automate manifest generation in your continuous integration and deployment pipelines for seamless documentation workflows.

## GitHub Actions

### Basic Workflow

```yaml
# .github/workflows/documentation.yml
name: Documentation Pipeline

on:
  push:
    paths:
      - 'docs/**'
      - 'packages/*/docs/**'
  pull_request:
    paths:
      - 'docs/**'
      - 'packages/*/docs/**'

jobs:
  generate-manifests:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Generate documentation manifests
        run: |
          npx @fsegurai/manifest-generator --all --docs-root ./packages
          
      - name: Validate generated files
        run: |
          # Check that manifest files exist
          find . -name "manifest.json" -type f
          find . -name "search-index.json" -type f
          
      - name: Upload manifests as artifacts
        uses: actions/upload-artifact@v3
        with:
          name: documentation-manifests
          path: |
            **/manifest.json
            **/search-index.json
```

### Advanced GitHub Actions Workflow

```yaml
# .github/workflows/docs-deploy.yml
name: Documentation Build and Deploy

on:
  push:
    branches: [main]
    paths: ['docs/**', 'packages/*/docs/**']

jobs:
  build-docs:
    runs-on: ubuntu-latest
    outputs:
      docs-changed: ${{ steps.changes.outputs.docs }}
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - name: Check for documentation changes
        uses: dorny/paths-filter@v2
        id: changes
        with:
          filters: |
            docs:
              - 'docs/**'
              - 'packages/*/docs/**'
              
      - name: Setup Node.js
        if: steps.changes.outputs.docs == 'true'
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        if: steps.changes.outputs.docs == 'true'
        run: npm ci
        
      - name: Generate manifests
        if: steps.changes.outputs.docs == 'true'
        run: |
          npx @fsegurai/manifest-generator --all --docs-root ./packages --output ./dist/manifests
          
      - name: Test manifests
        if: steps.changes.outputs.docs == 'true'
        run: |
          # Validate JSON structure
          for file in $(find ./dist/manifests -name "*.json"); do
            echo "Validating $file"
            node -e "JSON.parse(require('fs').readFileSync('$file', 'utf8'))"
          done
          
      - name: Upload documentation artifacts
        if: steps.changes.outputs.docs == 'true'
        uses: actions/upload-artifact@v3
        with:
          name: documentation-manifests
          path: ./dist/manifests/
          
  deploy-docs:
    needs: build-docs
    if: needs.build-docs.outputs.docs-changed == 'true'
    runs-on: ubuntu-latest
    
    steps:
      - name: Download manifests
        uses: actions/download-artifact@v3
        with:
          name: documentation-manifests
          path: ./manifests/
          
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./manifests/
          destination_dir: docs/manifests/
```

### Matrix Strategy for Multiple Projects

```yaml
# .github/workflows/multi-project-docs.yml
name: Multi-Project Documentation

on:
  push:
    paths: ['projects/*/docs/**']

jobs:
  detect-projects:
    runs-on: ubuntu-latest
    outputs:
      projects: ${{ steps.projects.outputs.matrix }}
    steps:
      - uses: actions/checkout@v4
      - name: Detect changed projects
        id: projects
        run: |
          PROJECTS=$(find projects -name "docs" -type d | jq -R -s -c 'split("\n")[:-1] | map(split("/")[0:2] | join("/"))')
          echo "matrix=$PROJECTS" >> $GITHUB_OUTPUT

  build-project-docs:
    needs: detect-projects
    runs-on: ubuntu-latest
    strategy:
      matrix:
        project: ${{ fromJson(needs.detect-projects.outputs.projects) }}
    
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Generate manifests for ${{ matrix.project }}
        run: |
          npx @fsegurai/manifest-generator --route ./${{ matrix.project }}/docs
          
      - name: Upload ${{ matrix.project }} manifests
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.project }}-manifests
          path: ${{ matrix.project }}/docs/*.json
```

## GitLab CI

### Basic Pipeline

```yaml
# .gitlab-ci.yml
stages:
  - generate
  - test
  - deploy

variables:
  NODE_VERSION: "18"

generate_manifests:
  stage: generate
  image: node:${NODE_VERSION}
  script:
    - npm install -g @fsegurai/manifest-generator
    - manifest-generator --all --docs-root ./packages
  artifacts:
    paths:
      - "**/manifest.json"
      - "**/search-index.json"
    expire_in: 1 hour
  only:
    changes:
      - docs/**/*
      - packages/*/docs/**/*

test_manifests:
  stage: test
  image: node:${NODE_VERSION}
  dependencies:
    - generate_manifests
  script:
    - |
      # Validate JSON files
      find . -name "manifest.json" -exec node -e "JSON.parse(require('fs').readFileSync('{}', 'utf8'))" \;
      find . -name "search-index.json" -exec node -e "JSON.parse(require('fs').readFileSync('{}', 'utf8'))" \;

deploy_docs:
  stage: deploy
  image: alpine:latest
  dependencies:
    - generate_manifests
  script:
    - apk add --no-cache rsync
    - rsync -av --include="*/" --include="*.json" --exclude="*" ./ ./public/
  artifacts:
    paths:
      - public/
  only:
    - main
```

### Advanced GitLab Pipeline

```yaml
# .gitlab-ci.yml
include:
  - template: 'Workflows/Branch-Pipelines.gitlab-ci.yml'

stages:
  - validate
  - generate
  - test
  - deploy

variables:
  NODE_VERSION: "18"
  DOCS_OUTPUT_DIR: "dist/manifests"

.node_template: &node_template
  image: node:${NODE_VERSION}
  before_script:
    - npm ci --cache .npm --prefer-offline

validate_docs_structure:
  stage: validate
  <<: *node_template
  script:
    - |
      # Check for required documentation files
      for project in packages/*/; do
        if [ -d "$project/docs" ]; then
          echo "✓ Found docs in $project"
          if [ ! -f "$project/docs/README.md" ]; then
            echo "⚠ Missing README.md in $project/docs"
          fi
        fi
      done
  only:
    changes:
      - packages/*/docs/**/*

generate_documentation:
  stage: generate
  <<: *node_template
  script:
    - npm install -g @fsegurai/manifest-generator
    - mkdir -p $DOCS_OUTPUT_DIR
    - manifest-generator --all --docs-root ./packages --output ./$DOCS_OUTPUT_DIR
    - |
      # Generate summary
      echo "Generated manifests for the following projects:" > manifest-summary.txt
      find $DOCS_OUTPUT_DIR -name "manifest.json" | xargs -I {} dirname {} | xargs basename | sort >> manifest-summary.txt
  artifacts:
    paths:
      - $DOCS_OUTPUT_DIR/
      - manifest-summary.txt
    reports:
      artifacts:
        paths:
          - $DOCS_OUTPUT_DIR/**/*.json
    expire_in: 1 week
  only:
    changes:
      - packages/*/docs/**/*

test_manifest_quality:
  stage: test
  <<: *node_template
  dependencies:
    - generate_documentation
  script:
    - |
      # Test manifest structure and content quality
      for manifest in $(find $DOCS_OUTPUT_DIR -name "manifest.json"); do
        echo "Testing $manifest"
        
        # Validate JSON
        node -e "JSON.parse(require('fs').readFileSync('$manifest', 'utf8'))"
        
        # Check for minimum content
        ITEMS=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$manifest', 'utf8')).length)")
        if [ "$ITEMS" -eq 0 ]; then
          echo "❌ Empty manifest: $manifest"
          exit 1
        fi
        
        echo "✅ $manifest has $ITEMS items"
      done

deploy_to_pages:
  stage: deploy
  image: alpine:latest
  dependencies:
    - generate_documentation
  script:
    - mkdir -p public/docs
    - cp -r $DOCS_OUTPUT_DIR/* public/docs/
    - |
      # Create index page
      cat > public/index.html << EOF
      <!DOCTYPE html>
      <html>
      <head><title>Documentation Manifests</title></head>
      <body>
        <h1>Generated Documentation Manifests</h1>
        <ul>
      EOF
      
      find public/docs -name "manifest.json" | sed 's|public/||' | while read file; do
        project=$(dirname "$file" | xargs basename)
        echo "<li><a href=\"$file\">$project Manifest</a></li>" >> public/index.html
      done
      
      echo "</ul></body></html>" >> public/index.html
  artifacts:
    paths:
      - public/
  only:
    - main
```

## Azure DevOps

### Basic Pipeline

```yaml
# azure-pipelines.yml
trigger:
  branches:
    include:
      - main
  paths:
    include:
      - docs/*
      - packages/*/docs/*

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '18.x'

stages:
  - stage: GenerateManifests
    displayName: 'Generate Documentation Manifests'
    jobs:
      - job: Generate
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: $(nodeVersion)
            displayName: 'Install Node.js'
            
          - script: |
              npx @fsegurai/manifest-generator --all --output $(Build.ArtifactStagingDirectory)/manifests
            displayName: 'Generate Manifests'
            
          - task: PublishBuildArtifacts@1
            inputs:
              pathToPublish: '$(Build.ArtifactStagingDirectory)'
              artifactName: 'documentation-manifests'
            displayName: 'Publish Manifests'

  - stage: Deploy
    displayName: 'Deploy Documentation'
    dependsOn: GenerateManifests
    condition: succeeded()
    jobs:
      - deployment: DeployDocs
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                - download: current
                  artifact: documentation-manifests
                  
                - script: |
                    echo "Deploying documentation manifests..."
                    # Add your deployment commands here
```

### Multi-Environment Azure Pipeline

```yaml
# azure-pipelines.yml
trigger:
  branches:
    include: ['main', 'develop']
  paths:
    include: ['docs/**', 'packages/*/docs/**']

variables:
  - name: nodeVersion
    value: '18.x'
  - name: isMain
    value: $[eq(variables['Build.SourceBranch'], 'refs/heads/main')]

stages:
  - stage: Build
    displayName: 'Build Documentation'
    jobs:
      - job: BuildDocs
        displayName: 'Generate Manifests'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: $(nodeVersion)
              
          - task: Cache@2
            inputs:
              key: 'npm | "$(Agent.OS)" | package-lock.json'
              restoreKeys: |
                npm | "$(Agent.OS)"
              path: ~/.npm
            displayName: 'Cache npm'
            
          - script: npm ci
            displayName: 'Install dependencies'
            
          - script: |
              OUTPUT_DIR="staging"
              if [ "$(isMain)" = "True" ]; then
                OUTPUT_DIR="production"
              fi
              
              npx @fsegurai/manifest-generator --all --output $(Build.ArtifactStagingDirectory)/$OUTPUT_DIR
            displayName: 'Generate Documentation Manifests'
            
          - task: PublishBuildArtifacts@1
            inputs:
              pathToPublish: '$(Build.ArtifactStagingDirectory)'
              artifactName: 'docs-$(Build.SourceBranchName)'
              
  - stage: DeployStaging
    displayName: 'Deploy to Staging'
    condition: and(succeeded(), ne(variables.isMain, true))
    jobs:
      - deployment: StagingDeploy
        environment: 'staging'
        strategy:
          runOnce:
            deploy:
              steps:
                - script: echo "Deploy to staging environment"
                
  - stage: DeployProduction
    displayName: 'Deploy to Production'
    condition: and(succeeded(), eq(variables.isMain, true))
    jobs:
      - deployment: ProductionDeploy
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                - script: echo "Deploy to production environment"
```

## Jenkins

### Declarative Pipeline

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        DOCS_OUTPUT = 'dist/manifests'
    }
    
    triggers {
        pollSCM('H/5 * * * *') // Poll every 5 minutes
    }
    
    stages {
        stage('Setup') {
            steps {
                script {
                    def nodeHome = tool name: "NodeJS-${NODE_VERSION}", type: 'nodejs'
                    env.PATH = "${nodeHome}/bin:${env.PATH}"
                }
                sh 'node --version'
                sh 'npm --version'
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Generate Documentation') {
            when {
                changeset "docs/**/*"
            }
            steps {
                sh """
                    mkdir -p ${DOCS_OUTPUT}
                    npx @fsegurai/manifest-generator --all --output ${DOCS_OUTPUT}
                """
            }
        }
        
        stage('Test Manifests') {
            when {
                changeset "docs/**/*"
            }
            steps {
                sh '''
                    for file in $(find ${DOCS_OUTPUT} -name "*.json"); do
                        echo "Validating $file"
                        node -e "JSON.parse(require('fs').readFileSync('$file', 'utf8'))"
                    done
                '''
            }
        }
        
        stage('Archive Artifacts') {
            when {
                changeset "docs/**/*"
            }
            steps {
                archiveArtifacts artifacts: "${DOCS_OUTPUT}/**/*.json", allowEmptyArchive: true
            }
        }
        
        stage('Deploy') {
            when {
                allOf {
                    branch 'main'
                    changeset "docs/**/*"
                }
            }
            steps {
                sh 'echo "Deploying documentation manifests..."'
                // Add deployment commands here
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            emailext (
                subject: "Documentation Build Successful: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Documentation manifests have been generated successfully.",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
        failure {
            emailext (
                subject: "Documentation Build Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
                body: "Documentation manifest generation failed. Check the build logs for details.",
                to: "${env.CHANGE_AUTHOR_EMAIL}"
            )
        }
    }
}
```

## CircleCI

### Basic Configuration

```yaml
# .circleci/config.yml
version: 2.1

orbs:
  node: circleci/node@5.0.2

workflows:
  documentation:
    jobs:
      - generate-manifests:
          filters:
            branches:
              only: [main, develop]
      - deploy-docs:
          requires:
            - generate-manifests
          filters:
            branches:
              only: main

jobs:
  generate-manifests:
    docker:
      - image: cimg/node:18.0
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: Generate Documentation Manifests
          command: |
            npx @fsegurai/manifest-generator --all --output ./dist/manifests
      - run:
          name: Validate Generated Files
          command: |
            find ./dist/manifests -name "*.json" -exec node -e "JSON.parse(require('fs').readFileSync('{}', 'utf8'))" \;
      - persist_to_workspace:
          root: ./dist
          paths:
            - manifests
      - store_artifacts:
          path: ./dist/manifests
          destination: documentation-manifests

  deploy-docs:
    docker:
      - image: cimg/base:stable
    steps:
      - attach_workspace:
          at: ./dist
      - run:
          name: Deploy Documentation
          command: |
            echo "Deploying documentation manifests..."
            ls -la ./dist/manifests
```

## Travis CI

### Configuration

```yaml
# .travis.yml
language: node_js
node_js:
  - "18"

cache:
  directories:
    - node_modules

branches:
  only:
    - main
    - develop

env:
  - DOCS_OUTPUT_DIR=dist/manifests

script:
  - |
    if git diff --name-only $TRAVIS_COMMIT_RANGE | grep -qE '^docs/|/docs/'; then
      echo "Documentation changes detected, generating manifests..."
      mkdir -p $DOCS_OUTPUT_DIR
      npx @fsegurai/manifest-generator --all --output $DOCS_OUTPUT_DIR
      
      # Validate generated files
      find $DOCS_OUTPUT_DIR -name "*.json" -exec node -e "JSON.parse(require('fs').readFileSync('{}', 'utf8'))" \;
    else
      echo "No documentation changes detected, skipping manifest generation"
    fi

deploy:
  provider: pages
  skip_cleanup: true
  github_token: $GITHUB_TOKEN
  local_dir: $DOCS_OUTPUT_DIR
  on:
    branch: main
    condition: git diff --name-only $TRAVIS_COMMIT_RANGE | grep -qE '^docs/|/docs/'
```

## Docker Integration

### Multi-stage Docker Build

```dockerfile
# Dockerfile
FROM node:18-alpine AS docs-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy documentation
COPY docs/ ./docs/
COPY packages/*/docs/ ./packages/

# Generate manifests
RUN npx @fsegurai/manifest-generator --all --output ./generated

# Production stage
FROM nginx:alpine

# Copy generated manifests
COPY --from=docs-builder /app/generated /usr/share/nginx/html/docs

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose for CI

```yaml
# docker-compose.ci.yml
version: '3.8'

services:
  docs-generator:
    image: node:18-alpine
    working_dir: /workspace
    volumes:
      - .:/workspace
    command: >
      sh -c "
        npm ci &&
        npx @fsegurai/manifest-generator --all --output ./dist/manifests
      "
    
  docs-validator:
    image: node:18-alpine
    working_dir: /workspace
    volumes:
      - .:/workspace
    depends_on:
      - docs-generator
    command: >
      sh -c "
        find ./dist/manifests -name '*.json' -exec node -e 'JSON.parse(require(\"fs\").readFileSync(\"{}\", \"utf8\"))' \\;
      "
```

## Performance Optimization

### Parallel Processing

```yaml
# GitHub Actions with matrix strategy
strategy:
  matrix:
    docs-path: 
      - './docs'
      - './packages/frontend/docs'
      - './packages/backend/docs'
      - './packages/shared/docs'

steps:
  - name: Generate manifests for ${{ matrix.docs-path }}
    run: |
      npx @fsegurai/manifest-generator --route ${{ matrix.docs-path }}
```

### Conditional Execution

```yaml
# Only run when documentation changes
- name: Check for doc changes
  uses: dorny/paths-filter@v2
  id: changes
  with:
    filters: |
      docs:
        - 'docs/**'
        - 'packages/*/docs/**'

- name: Generate manifests
  if: steps.changes.outputs.docs == 'true'
  run: npx @fsegurai/manifest-generator --all
```

## Next Steps

- 🔧 **Build Systems**: Check [Build Systems](build-systems.md) for local development integration
- 🚀 **Frameworks**: See [Frameworks](frameworks.md) for application-specific integration
- 💡 **Examples**: Browse [Examples](../examples/) for complete CI/CD workflow examples

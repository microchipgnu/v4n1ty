# Publishing Guide for v4n1ty

## Prerequisites

1. **NPM Account**: Create an account at [npmjs.com](https://www.npmjs.com/)
2. **NPM CLI**: Install npm CLI globally: `npm install -g npm`
3. **Authentication**: Login to npm: `npm login`

## Before Publishing

### 1. Update Package Metadata

Edit `package.json` and update these fields with your information:

```json
{
  "author": {
    "name": "Your Name",
    "email": "your.email@example.com"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/yourusername/v4n1ty.git"
  },
  "homepage": "https://github.com/yourusername/v4n1ty#readme",
  "bugs": {
    "url": "https://github.com/yourusername/v4n1ty/issues"
  }
}
```

### 2. Check Package Name Availability

```bash
npm view v4n1ty
```

If the package name is already taken, you'll need to:
- Choose a different name (e.g., `@yourusername/v4n1ty`)
- Update the `name` field in `package.json`

### 3. Version Management

Follow [Semantic Versioning](https://semver.org/):
- `1.0.0` - Initial release
- `1.0.1` - Bug fixes
- `1.1.0` - New features (backward compatible)
- `2.0.0` - Breaking changes

Update version using:
```bash
npm version patch   # 1.0.0 → 1.0.1
npm version minor   # 1.0.0 → 1.1.0
npm version major   # 1.0.0 → 2.0.0
```

## Publishing Steps

### 1. Build the Package

```bash
bun run build
```

This will:
- Create the `dist/` directory
- Bundle all dependencies
- Make the CLI executable

### 2. Test the Built Package

```bash
# Test the help command
./dist/index.js --help

# Test the estimate command
./dist/index.js estimate dead

# Test with Node.js (if you have it)
node dist/index.js --help
```

### 3. Verify Package Contents

```bash
# See what files will be included
npm pack --dry-run

# Or create a test package
npm pack
```

### 4. Publish to NPM

```bash
# For first-time publishing
npm publish

# For scoped packages (if using @username/v4n1ty)
npm publish --access public
```

### 5. Verify Publication

```bash
# Check if package is available
npm view v4n1ty

# Install globally to test
npm install -g v4n1ty
v4n1ty --help
```

## Post-Publishing

### 1. Create a Git Tag

```bash
git tag v1.0.0
git push origin v1.0.0
```

### 2. Create a GitHub Release

1. Go to your GitHub repository
2. Click "Releases" → "Create a new release"
3. Tag version: `v1.0.0`
4. Release title: `v1.0.0 - Initial Release`
5. Add release notes describing features

### 3. Update Documentation

- Update README.md with installation instructions
- Add badges for npm version, downloads, etc.

## NPM Package Badges

Add these to your README.md:

```markdown
[![npm version](https://badge.fury.io/js/v4n1ty.svg)](https://badge.fury.io/js/v4n1ty)
[![npm downloads](https://img.shields.io/npm/dm/v4n1ty.svg)](https://www.npmjs.com/package/v4n1ty)
[![license](https://img.shields.io/npm/l/v4n1ty.svg)](https://github.com/yourusername/v4n1ty/blob/main/LICENSE)
```

## Troubleshooting

### Package Name Already Taken

Use a scoped package name:
```json
{
  "name": "@yourusername/v4n1ty"
}
```

### Build Issues

- Ensure all dependencies are installed: `bun install`
- Check TypeScript compilation: `bun run build`
- Verify Node.js compatibility: `node dist/index.js --help`

### Permission Issues

- Make sure you're logged in: `npm whoami`
- Check if you have publishing rights: `npm owner ls v4n1ty`

## Best Practices

1. **Test thoroughly** before publishing
2. **Use semantic versioning** consistently
3. **Write good release notes** for each version
4. **Keep dependencies up to date**
5. **Monitor package security** with `npm audit`
6. **Consider using `npm ci`** for reproducible builds

## Updating the Package

For future updates:

```bash
# Make changes to src/
# Update version
npm version patch

# Build and test
bun run build
./dist/index.js --help

# Publish update
npm publish
```

## Support

If you encounter issues:
- Check [npm documentation](https://docs.npmjs.com/)
- Visit [npm support](https://www.npmjs.com/support)
- Ask on [Stack Overflow](https://stackoverflow.com/questions/tagged/npm) 
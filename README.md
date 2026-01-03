<p align="center">
  <img src="public/logo.svg" width="80">
</p>

<h1 align="center">gitstack</h1>

<p align="center">
  <a href="https://github.com/kiritocode1/gitstack/releases">
    <img src="https://img.shields.io/badge/version-1.1.0-blue.svg" alt="Version">
  </a>
</p>

<p align="center">
  Detect technology stacks on GitHub repositories. Automatically.
</p>

<br>

<!-- Add demo video/gif here once compressed -->

![profile-gif](result.gif)

<br>

## Why?

Ever landed on a GitHub repo and wondered what stack they're using? You scroll through files, check `package.json`, look for config files...

This extension does that for you. Instantly.

## Features

- 🔍 **Deep scanning** - Fetches full repository tree via GitHub API, not just visible files
- 👤 **Profile tech stack** - Aggregates technologies across all public repos on profile pages
- 📦 **100+ signatures** - Frameworks, languages, databases, build tools, and more
- 🎨 **Native UI** - Injects directly into GitHub's sidebar, respects dark/light mode
- ⚡️ **Fast** - Results cached locally, instant on repeat visits
- 🖼️ **Logos** - Fetches official logos via [SVGL](https://svgl.app)
- 🔑 **GitHub Token Support** - Add your Personal Access Token to avoid rate limits

## Install

```bash
# clone
git clone https://github.com/kiritocode1/gitstack.git
cd gitstack

# install
pnpm install

# build
pnpm build
```

### Load into Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select `.output/chrome-mv3` folder
5. Done. Pin it if you want.

### Development

```bash
pnpm dev
```

Opens browser with hot reload. Changes reflect instantly.

### Pre-built

Don't want to build? Grab a zip from [Releases](https://github.com/kiritocode1/gitstack/releases), unzip, load the folder. See [DISTRIBUTION.md](./DISTRIBUTION.md).

## How it works

1. Detects repo context from URL (`owner/repo`)
2. Fetches repository tree via GitHub API
3. Matches against signature patterns (files, extensions, dependencies)
4. Renders categorized results in sidebar

```
Scanned files: package.json, Cargo.toml, go.mod, pyproject.toml, ...
Detected: React, TypeScript, Tailwind CSS, Prisma, ...
```

## Stack

- [WXT](https://wxt.dev) - Web Extension Framework
- [React](https://react.dev) - UI
- [TypeScript](https://typescriptlang.org) - Because types

## Adding signatures

Edit `utils/signatures.ts`:

```ts
{
  name: 'Your Tech',
  files: ['config.file'],
  extensions: ['.ext'],
  packageJSONDependencies: ['package-name']
}
```

## Firefox

```bash
pnpm dev:firefox
pnpm build:firefox
```

## License

MIT

---

> Built by [BLANK](https://aryank.space)

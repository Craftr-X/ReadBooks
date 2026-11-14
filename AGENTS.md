# Repository Guidelines

## Project Structure & Module Organization

This repository is a VitePress books site. Main site content lives in `docs/`, with the homepage at `docs/index.md`. Book chapters are grouped by slug under `docs/books/<book-slug>/`; each book should include an `index.md` plus numbered chapter Markdown files. VitePress configuration and theme customizations live in `docs/.vitepress/`. Static public assets belong in `docs/public/`; book-specific images should stay beside the book content, commonly under `images/` or `_assets/`. Helper scripts live in `scripts/`. Generated build output in `dist/`, dependencies, caches, logs, and IDE files should not be edited manually.

## Build, Test, and Development Commands

- `npm install`: install dependencies for local development.
- `npm run dev`: start the VitePress dev server for `docs/`.
- `npm run build`: run prebuild (regenerate gitignored `sidebar-generated.json` and `content-stats.json`) and build the static site to `dist/`. The build does not modify source Markdown.
- `npm run preview`: preview the built site locally.
- `npm run generate:sidebar`: regenerate `sidebar-generated.json` after content structure changes. This file is gitignored (a build-time artifact); `config.mts` regenerates it on demand if missing, and `prebuild` refreshes it before every build.
- `npm run import:book -- ./path/to/book --slug my-book`: import a Markdown folder or EPUB into `docs/books/`.
- `npm run check:deadlinks`: scan all internal markdown links and image references under `docs/` for broken targets (external http(s) links are not checked).
- `npm run lint`: check all Markdown formatting via markdownlint-cli2 (configured in `.markdownlint-cli2.yaml`; runs in CI). Structural rules for the EPUB/juejin book sources are intentionally disabled.
- `npm run lint:fix`: auto-fix Markdown formatting issues (trailing spaces, blank lines, newlines). Run independently of `prebuild`; do not wire it into the build flow.
- `npm test`: run the Node test suite (`node --test scripts/*.test.mjs`) for import, sidebar, deadlinks, reading-time/progress, and codeblock-lang logic.
- `node scripts/verify-import.mjs <slug>`: run post-import verification (pass/fail JSON report).
- `npm run audit:content -- <slug> <source.epub>`: reconcile the source EPUB against the imported Markdown (total visible-character delta + per-spine-file sample matching) to prove no content was silently dropped. Run while the source EPUB is still at hand.

## Coding Style & Naming Conventions

Use two-space indentation in JavaScript, TypeScript, Vue, JSON, and Markdown-adjacent config files. Scripts use ES modules (`.mjs`) and Node built-ins where possible. Keep Markdown filenames readable and ordered, for example `01-开篇.md`. Use lowercase kebab-case for book slugs such as `typescript-intro`. Preserve existing Chinese punctuation and titles.

## Testing Guidelines

There is no full site test framework; the required validation is `npm run build`. For script logic, add focused tests with Node’s built-in `node:test` and `node:assert/strict`, following `scripts/import-book.test.mjs`. Run script tests when changing import or normalization behavior, and run a full build before opening a PR.

## Book Import Spec

Use this spec whenever importing a technical booklet, Markdown source, or EPUB ebook. The goal is a complete VitePress reading experience without regressions to existing books or shared site behavior.

**Input type**

- EPUB file → run `npm run import:book` to convert EPUB HTML to Markdown, then import.
- Markdown folder → import `.md` pages and required image assets directly.
- Mixed folder → copy Markdown pages and required assets to a temp source, excluding PDFs, audio, TXT sidecars, logs, caches, and unrelated source files.

**Scope and boundaries**

- Keep the scope to one book slug unless explicitly asked otherwise. Normal imports should only change `docs/books/<slug>/`, `books.json`, `README.md`, and narrowly scoped importer/test files when needed. (`sidebar-generated.json` is a gitignored build artifact; do not commit it.)
- Do not edit existing book content, site theme, VitePress config, deploy settings, comments, search, or `dist/` unless the user explicitly asks or the import cannot work without a narrowly scoped fix.
- Do not overwrite an existing `docs/books/<slug>/` unless the user explicitly requests replacement and `--force` is appropriate.
- Use `npm run import:book -- <source> --slug <slug> --title "<title>" --desc "<desc>"` for Markdown folders and EPUB files. Use `--force` only for an intentional replacement.

**Required output**

- `docs/books/<slug>/` must contain an `index.md` and numbered chapter Markdown files. Chapter filenames should be readable and ordered, for example `01-开篇.md`.
- `books.json` is the source registry. Use `category: "booklet"` for Markdown folders and `category: "ebook"` for EPUBs unless the user says otherwise. Use stable lowercase kebab-case slugs. Optionally pass `--genre <key>` (registry: `docs/.vitepress/genres-registry.mjs`) to assign the display category used by nav/homepage grouping; unassigned books fall back to category-based groups.
- `sidebar-generated.json` (gitignored, regenerated on build) must resolve `/books/<slug>/` so the left chapter sidebar shows all chapters in reading order. The import flow updates it in place via `updateSidebarForBook`; `prebuild` and `config.mts` keep it fresh.
- Each book's `index.md` should keep a `## 目录` block linking to its chapters. `npm run generate:sidebar` (run by `prebuild`) refreshes this block idempotently alongside the sidebar, preserving any hand-written display text and chapter order; do not hand-edit chapter links inside it.
- Chapter Markdown should render as normal VitePress Markdown, not raw EPUB HTML fragments. Preserve meaningful headings so the right page outline can work. Do not disable `aside` on chapter pages; a book `index.md` may use `aside: false`.
- All local images referenced by Markdown must exist beside the book, usually in `_assets/` or `images/`, and render in VitePress.
- EPUB internal links rewritten from source paths like `text00000.html#filepos...` to generated Markdown links like `./05-章节.md`, or removed if they cannot be resolved safely.
- Add the new book to the correct `README.md` table with title, short description, and `./docs/books/<slug>/` link.

**EPUB conversion rules**

- Prefer EPUB nav/NCX titles over generic spine filenames.
- Split one HTML spine file into multiple Markdown chapters when the TOC points to anchors inside that file.
- If TOC anchors are missing in HTML, do not drop content; import the full spine file as one chapter and report a warning.
- Decode HTML entities in titles, links, and alt text.
- After final Markdown filenames are known, rewrite EPUB internal links to those generated files, or remove them if they cannot be resolved safely.
- Never leave source `.html` links or `filepos` anchors in generated Markdown.

**Validation checklist**

- Run a residual scan and fix every match:

  ```bash
  rg -n "\\[图片：|\\[缺失资源：|缺失资源|图片未找到|text[0-9]+\\.html|filepos" docs/books/<slug>
  ```

- Validate local Markdown links and image references from each imported Markdown file. Build success alone is not enough because `ignoreDeadLinks: true` is enabled.
- Run `npm run audit:content -- <slug> <source.epub>` when importing from an EPUB to confirm no content was silently dropped (structural checks cannot detect content loss).
- If importer logic changes, add focused tests in `scripts/import-book.test.mjs` and run `node --test scripts/import-book.test.mjs`.
- Always run `npm run build`; existing code-block language warnings are non-blocking only when the build exits successfully.
- Run `npm run check:deadlinks` to confirm no internal links or image references are broken across the site.

**Completion criteria**

The import is complete only when all are true:

- `docs/books/<slug>/index.md` exists and links to all chapters.
- `books.json` and `README.md` include the new book, and `sidebar-generated.json` resolves `/books/<slug>/` (regenerated automatically; no commit needed).
- No missing-resource placeholders, unresolved local images, source EPUB HTML links, or broken local Markdown links remain in the imported book.
- `node scripts/verify-import.mjs <slug>` reports all checks passed.
- `node --test scripts/import-book.test.mjs` passes if import code changed.
- `npm run check:deadlinks` reports no dead links across the site.
- `npm run audit:content -- <slug> <source.epub>` reports zero missing samples for EPUB imports.
- `npm run build` passes.
- Existing books and shared site behavior were not changed outside the documented scope.

## Book Removal Spec

Use this spec whenever removing a book from the site, for example on a user instruction like 删除<分类>标签下的<书名>. The goal is complete removal with zero residual references and no regression to other books or shared site behavior.

**Input mapping**

- Map the natural-language instruction to a slug with `npm run remove:book -- --find <书名关键词>` (matches title/desc/slug, case-insensitive). Never guess a slug.
- Cross-check the user-named 分类 against the registry `genre` of the matched entry; if they do not match, confirm with the user before deleting.
- Always start with `--dry-run` and show the preview (书名/slug/分类/章节数/外部引用) to the user for a real removal.

**Scope and boundaries**

- Keep the scope to one book slug per run. Only these may change: `docs/books/<slug>/`, `books.json`, `README.md`, and — only when the script blocks on hardcoded references — the few referencing files under `docs/` (currently at most `docs/index.md`).
- The script automatically removes the README table row and the registry entry, deletes the content directory, and regenerates `sidebar-generated.json` / `content-stats.json`. Do not hand-edit those generated artifacts or the script's outputs afterwards.
- Do not edit other books, site theme, VitePress config, deploy settings, comments, search, or `dist/`.
- Branch: `docs/remove-<slug>`. Commit message: `docs: 移除《书名》（slug）`.

**Safety rails (built into the script)**

- Refuses unknown slugs; refuses when `books.json`, `README.md`, or `docs/books/<slug>/` have uncommitted changes (git history is the recovery path; `--force` overrides).
- Blocks deletion while `docs/` still references the book (e.g. hardcoded homepage links). Fix those references first, or pass `--force` deliberately knowing the built-in self-check will then report the residue.
- `--dry-run` performs the full validation and preview with zero writes.

**Validation checklist**

- The script's built-in self-check reports all six checks passed (registry / book-dir / sidebar / content-stats / readme / docs-references).
- Residual scan; every hit must be intentional (e.g. history docs):

  ```bash
  rg -n "<slug>" docs README.md books.json
  ```

- `npm run check:deadlinks` reports no dead links across the site.
- `npm test` passes (all suites, including `scripts/remove-book.test.mjs`).
- `npm run build` passes.
- Optional: `npm run preview` and visually check the homepage (cards, nav, 继续阅读卡) and one remaining book page.

**Completion criteria**

The removal is complete only when all are true:

- The script's self-check passed and `books.json` / `README.md` no longer list the book; `docs/books/<slug>/` is gone.
- Nav, homepage cards and genre groups no longer show the book; other books are untouched.
- Residual scan hits are all intentional; deadlinks, tests and build are green.
- The PR mentions the slug and lists the validation commands run.

**Known tolerated behaviors (no action needed)**

- The homepage 继续阅读 card filters out reading progress of removed books (`continueReadingCore.mjs`); stale localStorage entries are harmless.
- The search index and `sitemap.xml` drop the book automatically on the next build.
- Restoring a removed book from git may produce a one-time benign diff in `sidebar-generated.json` display texts (the text-preservation cache converges back to the `index.md` TOC block; verified idempotent).

## Branch & Workflow Guidelines

This project follows a **branch-based workflow**. Never commit directly to `main`.

1. **Create a feature branch** from `main` before making changes. Use descriptive branch names:
   - `feat/xxx` for new features
   - `fix/xxx` for bug fixes
   - `docs/xxx` for documentation or content updates
   - `chore/xxx` for maintenance tasks
2. **Commit and push** to the feature branch. Run `npm run build` locally to validate before pushing.
3. **Open a Pull Request** targeting `main`. The CI workflow will automatically run build validation and tests.
4. **After review and CI pass**, merge the PR into `main`. The deploy workflow will automatically build and publish to GitHub Pages.

## Commit & Pull Request Guidelines

Recent commits follow Conventional Commit-style prefixes such as `docs:`, `fix:`, and `feat:`. Use concise subject lines, for example `fix: normalize missing image assets`. Pull requests should describe the change, list validation commands run, link related issues when available, and include screenshots for visible site or theme changes. For new books, mention the slug and confirm `books.json` and the README book list were updated when applicable.

## Security & Configuration Tips

Do not commit private source books, credentials, local logs, or generated `dist/` artifacts. Giscus and GitHub Pages settings are repository-level configuration; change them only with a clear deployment reason.

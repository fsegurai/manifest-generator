# GitHub workflows aligned with Arkenda

Objective: fix, update and refactor `.github` (workflows, dependabot, labeler, templates) in the 7 libraries following
Arkenda's conventions. Branch: current `development` checkouts, uncommitted (the user commits manually). Delivery:
none by the agent (no commit, push or publish). Checks: actionlint (Docker `rhysd/actionlint:1.7.7`) and zizmor (`uvx
zizmor --offline`), plus running every referenced script locally.

## Specs

- S1 (L1): "just like arkenda, fix, update and refactor .github workflows on all libraries". Libraries:
  codemirror-themes, manifest-generator, marked-extensions, ngx-codemirror, ngx-markdown, ngx-sidenav, scrollspy.
- S2 Arkenda conventions (reference: `/home/gaxes/Documents/Codex/NodeJS/ARK/Arkenda/.github/workflows/{checks,
  dependency-audit,security-scan,release-docs}.yml` and `.github/dependabot.yml`):
  - a header comment on every workflow: what it does, its triggers, and how it relates to Azure DevOps (ADO is the
    source repo; its build pipeline mirrors to GitHub, so GitHub merges are overwritten by the next push);
  - top-level `permissions: contents: read`; any write scope only on the job that needs it;
  - `concurrency` on pull-request workflows (`cancel-in-progress: true`);
  - `timeout-minutes` on every job;
  - `oven-sh/setup-bun@v2` with `bun-version: ${{ vars.BUN_VERSION || '1.4.3' }}`; `bun install --frozen-lockfile`
    (`--ignore-scripts` where the job still works without lifecycle scripts);
  - weekly dependency audit + on changes to `package.json`/`bun.lock`, `bun audit` reported, not failing;
  - security scan: CodeQL (`github/codeql-action@v4`, public repos so not gated) + Bun audit; the Trivy action is left
    out (Trivy runs in the ADO template's security stage; never `@master`);
  - dependabot: `github-actions` + `bun` ecosystems, monthly, grouped, `commit-message` prefixes `ci` / `build`,
    semver-major ignored, header comment explaining that PRs are notices to apply in ADO.
- S3 Current action majors (checked 2026-11-19 via `gh api .../releases/latest`): `actions/checkout@v7`,
  `actions/github-script@v9`, `actions/labeler@v7` (check its config format against the v6/v7 release notes),
  `actions/upload-artifact@v7`, `actions/setup-node@v7` (only where Node is really needed), `oven-sh/setup-bun@v2`,
  `github/codeql-action/*@v4`.
- S4 Fix: every `bun run <script>`, path, package name, branch and output referenced by a workflow exists in that
  repo (no leftovers copied from another library); actionlint reports 0 issues; zizmor has no high-severity findings
  left (template injection, excessive permissions, unpinned `@master`, `pull_request_target` misuse, credential
  persistence) — remaining informational findings are listed with a reason.
- S5 Refactor: the 4 Bun libraries (codemirror-themes, manifest-generator, marked-extensions, scrollspy) share one
  workflow set and layout; the 3 Angular libraries (ngx-codemirror, ngx-markdown, ngx-sidenav) share theirs. A
  workflow may be removed only when broken beyond repair or fully duplicated by another, with the reason reported.
  Existing behaviour that works (tests, build, docs, triage, labels) is kept.

## Tasks

| ID | Specs | Repo | Route | Status | Evidence |
|---|---|---|---|---|---|
| T1 | S1–S5 | codemirror-themes | delegated (parallel unit) | done (uncommitted) | actionlint 0; 1319 tests, build pass |
| T2 | S1–S5 | manifest-generator | delegated (parallel unit) | done (uncommitted) | actionlint 0; zizmor 0; 250 tests, build, lint pass; docs fence check fails on docs/1.0.0-beta.1 page (pre-existing) |
| T3 | S1–S5 | marked-extensions | delegated (parallel unit) | done (uncommitted) | actionlint 0; all scripts pass; github-package-lists spec 6 pass |
| T4 | S1–S5 | scrollspy | delegated (parallel unit) | done (uncommitted) | actionlint 0; zizmor 33 high tag refs (0 with ref-pin); scripts pass except pre-existing tsc (7 TS4111 in spec) |
| T5 | S1–S5 | ngx-codemirror | delegated (parallel unit) | done (uncommitted) | actionlint 0; zizmor 22 high unpinned-uses (tags), all scripts pass |
| T6 | S1–S5 | ngx-markdown | delegated (parallel unit) | done (uncommitted) | actionlint 0; zizmor 25 high tag refs (0 with zizmor.yml); all 9 scripts pass |
| T7 | S1–S5 | ngx-sidenav | delegated (parallel unit) | done (uncommitted) | actionlint 0; zizmor 0 high (zizmor.yml added); all scripts pass; bun audit 20 pre-existing advisories |
| T8 | S1–S5 | all | independent verifier (Risk item 5: CI) | ran: S1–S3 pass, S4/S5 fail → correction batch T9/T10 | |
| T9 | S2, S4, S5 | Bun group (codemirror-themes, manifest-generator, marked-extensions, scrollspy) | delegated (correction, parallel) | pending | |
| T10 | S2, S4, S5 | Angular group (ngx-codemirror, ngx-markdown, ngx-sidenav) | delegated (correction, parallel) | pending | |

## Log

- L1 (2026-11-19): "just like arkenda, fix, update and refactor .github workflows on all libraries"
- L2: Baseline (actionlint / zizmor findings): codemirror-themes 0/71, manifest-generator 61/88, marked-extensions
  66/90, ngx-codemirror 2/30, ngx-markdown 2/26, ngx-sidenav 2/25, scrollspy 67/90. Drift: checkout v4/v6,
  github-script v6, labeler v5, `aquasecurity/trivy-action@master` (3 repos), `bun-version: latest`. All libraries
  are ADO repos mirrored to GitHub (`pipelines/.ado/build-pipeline.yml` MIRROR stage), like Arkenda.
  codemirror-themes is the most up to date of the Bun group (0 actionlint issues, github-script v9).
- L4 (2026-11-19, user): "all libraries and projects are mirror repos". Verified with `gh api`: the 7 GitHub repos
  are public, default branch `main`. So CodeQL runs ungated (Arkenda gates it only because its mirror is private), and
  every workflow header/dependabot note says changes are applied in ADO, not merged on GitHub.
- L3: Route: 7 independent units with disjoint repos launched together (writer trigger: parallelism); T8 because
  the change touches CI (Task Size item 5).
- L5: T5 done. Open point raised: zizmor `unpinned-uses` flags tag refs. Decision (parent, following Arkenda, which
  references actions by major tag and keeps SHA pins for third-party actions only): a shared `.github/zizmor.yml` with a
  `ref-pin` policy for `actions/*`, `github/*`, `oven-sh/*`, and `hash-pin` for everything else; applied to all 7 repos
  after the writers finish. Found a real bug class: `test.yml` on `workflow_run` tested main, not the PR head.
- L6: T7 done; it already added `.github/zizmor.yml` per L5. Open questions for the human: removing the
  `FSI_DEP_NodeJs` environment from jobs (BUN_VERSION falls back to 1.4.3 if it was only set there); `reviewers.yml`
  is read by no workflow.
- L7: T6 done (no zizmor.yml yet). Seam items for the end: Angular group naming differs (ngx-sidenav keeps the
  "Build PR" name, ngx-codemirror/ngx-markdown renamed to "Checks"; the PR-comment workflow listens by name); status
  check names changed (branch protection?); ngx-markdown dependabot adds `cooldown` 3 days, others may not.
- L8: T4 done. Seam: scrollspy `tsc --noEmit` already failed (7 TS4111 in packages/scrollspy/spec/index.test.ts), hidden
  by a `| head` pipe; writer made it `continue-on-error`. Plan: fix the 7 spec errors at the seam and make it blocking.
  Learned: GitHub's default bash has no pipefail; github-script v9 drops `require('@actions/github')`.
- L9: T2 done. Seam: its zizmor.yml uses `'*': ref-pin` (differs from L5: hash-pin for non-trusted owners) → unify;
  the unclosed fence in docs/1.0.0-beta.1/content/getting-started/getting-started.md (~line 126) keeps the Documentation
  workflow red → fix the page.
- L10: T1, T3 done. Seam (parent, inline):
  - shared `.github/zizmor.yml` (L5 policy) in all 7; unified workflow names — Bun group: Checks, Tests,
    Documentation, Security scan, Dependency audit, Health check, Performance monitor, Pull request triage; Angular
    group: Checks, Build, Tests, Security scan, Dependency audit, Pull request triage, Comment PR artifact links
    (listens to `Checks`); Dependabot `cooldown: default-days: 3` on the bun ecosystem in all 7 (matches bunfig).
  - GitHub (read-only `gh api`): rulesets "Main Merge" require no status checks, so renames are safe;
    `FSI_DEP_NodeJs` holds variables only in ngx-markdown (stale BUN_VERSION=1.1.34, NODE_VERSION=20.11.1), so
    dropping the environment from jobs moves CI to the 1.4.3 default.
  - scrollspy: fixed the 7 TS4111 spec errors (typed `g`), type check blocking again; 62 tests pass.
  - manifest-generator: removed 2 stray merge lines from docs/1.0.0-beta.1 getting-started.md (fence check 0).
  - codemirror-themes: `core` added first to the ADO build pipeline library packages (writer finding: release
    blocker, the themes depend on it).
  - Evidence: actionlint 0, zizmor 0 errors/warnings, Biome clean in all 7.
- L11: T8 verdict. Blocker B1: manifest-generator health-check `cmd | tee` without pipefail reports success on a
  broken build (HEAD used PIPESTATUS). A1: manifest-generator and scrollspy ADO pipelines have `security: false`, so
  "Trivy runs in ADO" is false there and Trivy coverage is gone. S5 fails: layouts diverge inside each group (job ids,
  concurrency groups, `defaults.run.shell`, PR comments, triage event types/permissions, build/audit structure, CodeQL
  `actions: read`). Advisories: labeler cannot create missing labels without `issues: write`; Dependabot
  github-actions majors ignored in 3 repos only; triage `synchronize` + cancel-in-progress can cancel the welcome;
  scrollspy welcome re-fires on reopen and reads 30 comments only; ngx-markdown bot detection by login substring;
  manifest-generator docs broken links/README sections turned from failing to warnings without reason.
- L12: Correction decisions (one batch, then a recheck limited to these items):
  - every workflow gets `defaults: run: shell: bash` (pipefail) in all 7 repos;
  - A1: manifest-generator and scrollspy keep a Trivy filesystem scan in `security-scan.yml`, pinned by verified
    commit SHA `aquasecurity/trivy-action@ed142fd0673e97e23eac54620cfb913e5ce36c25 # v0.36.0` (satisfies the
    hash-pin policy, Arkenda's precondition for using the action); the other 5 keep "Trivy runs in ADO" (true there);
  - S5: one layout per group — same job ids, concurrency `${{ github.workflow }}-${{ github.event.pull_request.number
    || github.ref }}`, same triggers/types and per-job permissions; results go to job summaries, PR comments only in
    `pr_triage.yml` (and the Angular artifact-links comment); repo-specific commands are the only differences;
  - triage: `issues: write` + `pull-requests: write` on the triage job everywhere (labeler can create labels),
    `cancel-in-progress: false` for triage, welcome only on `opened`, paginated comment lookups, bots by
    `user.type === 'Bot'`;
  - CodeQL job: `actions: read`, `contents: read`, `security-events: write` everywhere;
  - Dependabot: majors ignored for `bun` only, not for `github-actions` (as Arkenda) in all 7;
  - manifest-generator docs: broken relative links fail again (HEAD behaviour); README sections stay warnings
    only if HEAD also warned.

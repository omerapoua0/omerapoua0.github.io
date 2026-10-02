# Omar Aboelella portfolio

Clean Claude Code handoff of the active seven-page Astro/React portfolio.
Read [CLAUDE.md](CLAUDE.md) first. The original current project README is preserved
as [OMAR-README.md](OMAR-README.md); historical scenes described there are excluded
from this focused source copy.

The hero is an actual edited 20-second live-action video, with desktop and phone
MP4s, static posters and accessible playback controls. The project wheel adapts
the supplied CrafterUI ring-to-drum interaction. Shared editorial styling uses
charcoal, ivory and oxblood. Enquiry forms create editable email drafts only.

```sh
npx pnpm@11.11.0 install --frozen-lockfile --ignore-scripts
npx pnpm@11.11.0 run check:portfolio
npx pnpm@11.11.0 run build
npx pnpm@11.11.0 run preview --host 0.0.0.0 --port 4174
```

Node >=22.13 is required. Build output is `dist/`; no backend is required.
Build success does not mean publication. Do not deploy without explicit user
authorisation. Preserve copyright notices, source attribution and personal data
boundaries. Browser QA scripts need a Linux-compatible isolated Playwright setup
in Claude cloud before they can be run there.

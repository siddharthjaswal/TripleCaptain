# Triple Captain — FPL Companion

## Overview
Triple Captain is a planned Fantasy Premier League companion application built with Next.js (App Router) and TypeScript. The goal is to let users input an FPL entry ID and instantly see profile details, latest gameweek performance, and league standings with resilient caching and graceful error handling.

## Repository Status
The implementation is not committed yet. This repo currently holds the upstream planning and architecture documentation that will guide development:
| Document | Description |
| --- | --- |
| `plan_md_fpl_next.md` | Delivery roadmap with milestones, detailed tasks, and measurable goals. |
| `architecture_md_fpl_next.md` | System architecture covering routing, data flow, caching, and observability choices. |

## Getting Started
Implementation setup will follow the plan, beginning with creating a Next.js project via `pnpm dlx create-next-app@latest` and layering on Tailwind, Zod, Vitest, and Playwright. Refer to the planning document for the full bootstrap checklist.

## Next Steps
1. Execute **M0 — Project Bootstrap** from `plan_md_fpl_next.md` to scaffold the Next.js codebase.
2. Implement the data layer and entry summary flow (`M1`) using the architecture guide as reference.
3. Keep README updated as milestones land to reflect feature availability and local development instructions.

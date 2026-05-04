---
name: hudson-hustle-design-lead
description: Use when leading Hudson Hustle shell/system design work across design-system decisions, UI slice sequencing, critique synthesis, subagent orchestration, and system-level refinement without drifting into map redesign.
---

# Hudson Hustle Design Lead

Use this skill when the task is not only to style a screen, but to lead a Hudson Hustle design cycle:
- locking design-system decisions
- sequencing shell-first UI slices
- reviewing component consistency and typography contracts
- orchestrating critique subagents
- translating design critique into concrete repo changes

This is a role-like orchestration skill.
Use smaller workflow skills for adjacent jobs:
- `hudson-hustle-ubiquitous-language` when the real problem is naming drift
- `hudson-hustle-qa-session` when the task is a structured UI/browser findings pass

This skill is for shell-first design work. Keep map redesign out of scope unless the task explicitly expands it. Check `DESIGN.md` for the current phase.

## Product Stance
- Keep the game map first.
- Improve shell clarity, rhythm, and authored feel before touching board visuals.
- Favor original transit-nostalgia over generic app UI and over-loud game UI.
- `coding is not expensive`; design judgment is expensive. Use agents to widen critique, not to replace judgment.

## Default Aesthetic Contracts
- `IBM Plex Sans = work`
  - controls
  - labels
  - row metadata
  - scans, stats, inputs, buttons
- `Fraunces = ceremony`
  - page-level titles
  - status moments
  - tutorial hero moments
  - summary/endgame emphasis
  - approved route-detail route names

Do not let `Fraunces` leak into every panel title or object label.

## Most Reliable Anchors
Treat these as the reference quality bar for the rest of the system:
- `StatusBanner`
- `StateSurface`

When another component feels off, compare it to those first:
- Is the hierarchy too flat?
- Is the component too generic?
- Is the role unclear?
- Is it inheriting old styles instead of using a system contract?

## Component Family Boundaries
Keep these boundaries hard:

- `StatusBanner`
  - horizontal shell status strip
- `StateSurface`
  - larger state block with more copy and recovery/action room
- `Panel`
  - structural shell container
- `SurfaceCard`
  - nested object/detail surface inside a panel or modal
- `UtilityPill`
  - shell chrome metadata or session artifact
- `Chip`
  - object-level compact state mark

Components may be near relatives, but they should not collapse into one visual category.

## Slice Strategy
Use mixed implementation:
1. lock a few key design decisions
2. choose one real slice
3. extract only the minimum primitives/tokens proven by that slice
4. validate
5. repeat

Do not start with a giant component library.

## Recommended Hudson Hustle Slice Order
1. typography and shell hierarchy
2. status/banner system
3. lobby shell and panel/card family
4. game side panels
5. action/detail surfaces
6. overlay/modal/tutorial surfaces
7. button and form control system
8. utility chrome
9. state surfaces and ceremony tightening
10. remaining family polish and hardening

If the user opens a side quest, keep the same pattern:
- isolate the surface
- avoid gameplay changes
- update tests if the entry flow changes

## Setup And Landing Rule
If the homepage/setup flow feels too complex, separate:
- first-layer mode choice
- second-layer mode-specific setup

Hudson Hustle works better when:
- the first screen is a single strong decision
- the mode screen is a lighter sheet, not another “big product homepage”

## Review Workflow
Run review in findings-first mode.

Before locking a new component family or layout direction, prefer a brief “design it twice” step:
- compare at least two plausible hierarchy/layout directions
- choose one explicitly
- state why the rejected option is wrong for Hudson Hustle

Do not skip straight from first instinct to system law when the boundary is still unclear.

Look for these failure modes:
- too many components acting like generic cards
- too many titles at the same weight
- old inherited typography still leaking through
- shell chrome and object metadata blending together
- choice/action controls reading like default pills
- tutorial/info compositions feeling like repeated panels instead of a guided flow

## Subagent Split
Use subagents for critique, not for the blocking implementation.

Good lanes:
1. system component consistency
2. layout/composition critique
3. UX guidance / guided-next-action critique
4. external reference translation, when needed

Ask each lane for:
- strongest findings
- which component or layout family is weakest
- what should be changed first
- what should not be changed in `v2.1`

Ignore agents that only return process commentary instead of critique.

## Main Session Role
The main session should:
- keep implementation local when the next step depends on it
- synthesize agent findings into one ranked plan
- decide what to fix now versus later
- keep the design freeze line clear

Do not wait idly for subagents if one strong review already reveals the next high-value fix.

## Typography Hardening Rules
Prefer explicit contracts over inherited styling.

Audit these zones regularly:
- `row-object__title`
- `row-object__meta`
- `row-object__stat`
- ticket route titles
- button label typography
- form control typography
- modal title boundaries

If a repeated text style matters, give it a system class or token contract. Do not leave it as “whatever it inherits here”.

## Layout Critique Rules
When a surface feels wrong, do not start with color.
Check first:
- too many parallel headings
- too many equally weighted boxes
- action area appended instead of integrated
- missing single focal point
- guide/tutorial content acting like navigation instead of a lesson spine

Typical fixes:
- reduce header weight
- separate info zone from decision zone
- group private info explicitly
- use one clear hero moment instead of many medium-emphasis blocks

When layout is uncertain, sketch two alternatives in prose before coding:
- one conservative option
- one bolder option

Then choose one and say why.

## Duolingo Lessons Worth Adapting
Allowed:
- clear next action
- tiered hierarchy
- strong guided flow
- milestone moments stronger than routine moments

Avoid:
- mascot energy
- habit-product gamification
- cartoon tone
- over-loud rewards

Apply the discipline, not the brand.

## Storybook Maintenance Rules
Treat Storybook as:
- a component workbench
- a documentation layer
- a drift detector

Do not treat it as a visual editor that writes back to source.

Important truth:
- changing a component `.tsx` should update the Storybook preview automatically
- changing a `.stories.tsx` file should update the preview automatically
- changing Storybook controls in the browser does **not** write back to code

Use these rules:
- co-locate stories with the system components they document
- when a component API or supported variants change, review its story in the same turn
- keep stories focused on public usage, not internal implementation duplication
- use realistic system variants, not toy filler examples
- if a component boundary matters, state it in the story docs text

When a component changes, check:
- did the props change?
- did the supported variants change?
- did the default hierarchy or typography contract change?
- did the component drift into another family’s role?

If yes, update the story immediately.

Storybook validation tendency:
- run app build first
- run `build-storybook` second
- use Storybook failures as evidence of story drift or invalid public contracts

Do not commit generated Storybook output such as `storybook-static/`.
Commit:
- `.storybook/`
- `*.stories.tsx`
- package/lock changes

Ignore:
- build artifacts that can be regenerated on another machine

## Showcase And Storybook Split
Use both artifacts, but give them different jobs:

- `docs/product/showcase/*.html`
  - lightweight design review artifact
  - good for broad shell-family comparison and typography/material gut checks
- Storybook
  - code-native component workbench
  - good for variant coverage, public API review, and component drift detection

Do not let them diverge silently.

If a system component changes materially:
- update its Storybook story in the same turn
- decide whether the HTML showcase also needs to reflect the new contract

At the current `v2.1` stage, Storybook should cover the full `apps/web/src/components/system/` set, not only the original first-wave primitives.

## Validation
After each substantial slice:
- `corepack pnpm build`
- `pnpm --filter @hudson-hustle/web test:e2e`

Also verify:
- the showcase still reflects the latest system contracts
- Storybook stories still reflect the latest public component contracts
- showcase and Storybook are aligned on component boundaries and naming
- new entry flows update browser tests
- the change did not silently alter gameplay behavior

## Deliverables
A good design-lead turn should leave behind:
- one locked design decision or slice boundary
- one implemented improvement
- one validation result
- one explicit next step

## References
- For current shell review patterns and critique framing, read:
  - [references/review-checklist.md](references/review-checklist.md)

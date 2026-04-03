# Hudson Hustle Shell Review Checklist

Use this when auditing a shell/system surface.

## First Questions
- What is the focal point?
- What is structural container vs nested object vs decision control?
- Which text is work, and which text is ceremony?
- Which styles are system-level, and which are accidental inheritance?

## Typography
- Does `Fraunces` appear only in approved ceremony zones?
- Are repeated labels and object rows using explicit contracts?
- Is any component still relying on generic inherited `h2/h3` styling?

## Components
- Does `Panel` feel structural, not decorative?
- Does `SurfaceCard` feel nested and object-like, not like another panel?
- Does `UtilityPill` read as shell metadata?
- Does `Chip` read as compact object state?
- Do buttons feel like authored controls instead of generic app CTAs?
- Do Storybook stories still match the component’s real public API and variants?
- Does the HTML showcase still represent the same component boundaries and naming as Storybook?

## Layout
- Is there one clear next action?
- Are information and decisions separated clearly?
- Are tutorial steps arranged like a guide spine, not generic nav?
- Are repeated panels creating sameness?

## Drift Signals
- “This looks vibe-coded”
- “Everything looks like a card”
- “There are too many headings”
- “This still feels inherited from the old shell”
- “The map is being crowded by shell styling”

## Priority Order For Fixes
1. hierarchy
2. component role clarity
3. typography contracts
4. action clarity
5. color/material polish

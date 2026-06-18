# Visual Algorithms Review Standard

This standard defines the minimum bar for visual algorithm pages in this blog.
It is intentionally stricter than "the page renders" because these pages are
intended to teach an algorithm or simulation through interaction.

## Required Review Gates

1. Algorithm identity
   - The title, category, summary, controls, and output must describe the same
     algorithmic idea.
   - If a page is a graphics demo rather than an algorithm, it must be labeled
     as a graphics or simulation demo, not as a data-structure or learning
     algorithm.

2. Trace quality
   - Visual algorithms must expose execution frames with a phase, explanation,
     and relevant metrics.
   - A frame must represent a meaningful algorithm state, not just a delayed
     reveal of a final result.
   - Search algorithms should expose current node, frontier, visited set, and
     path reconstruction where applicable.
   - Simulation algorithms should expose per-round state and final aggregate
     metrics.

3. Interaction model
   - Parameter-only algorithms should redraw automatically after input changes.
   - Text or matrix editing workflows should use an explicit run action to avoid
     noisy validation while the user is still editing.
   - Every animated result with frames must support replay, pause/resume,
     previous step, next step, speed, and progress scrubbing.
   - Controls must be domain-specific where possible: sliders for bounded
     numeric parameters, segmented numeric entry for IPv4 addresses, coordinate
     inputs for points, and matrix editors for grid problems.

4. Visual explanation
   - The canvas must show final output and the current execution state clearly.
   - Legends or labels must identify non-obvious colors and symbols.
   - Overlays must not hide the primary visualization.
   - Important metrics must be visible without reading raw debug text.

5. Layout and accessibility
   - Desktop layout must keep the canvas, controls, playback, and result summary
     visible without awkward scrolling for common viewport sizes.
   - Mobile layout must keep controls readable and avoid horizontal overflow.
   - Buttons need accessible names; icon-only buttons require aria-label.
   - Canvas output must be paired with textual summaries for non-visual users.

6. Verification
   - Unit tests must cover algorithm correctness or trace shape for each
     algorithm module.
   - E2E tests must cover page load, primary interactions, reset, reload, and
     canvas frame changes for animated views.
   - Content checks must confirm existing blog article content is unchanged.
   - Visual review should include at least one desktop and one mobile screenshot
     for changed visual-algorithm surfaces.

## Current Priority Rubric

- P0: Fix concept mismatches, broken interaction affordances, missing playback,
  and misleading labels.
- P1: Replace thin final-result reveals with semantic traces.
- P2: Improve algorithm fidelity to the original or rename the page honestly.
- P3: Polish layout, typography, legends, and mobile density.
- P4: Add optional presets, comparison modes, and deep explanatory panels.

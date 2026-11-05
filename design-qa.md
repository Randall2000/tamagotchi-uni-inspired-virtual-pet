# Device Shell Design QA

**Source visual:** `/Users/randallhs_1/.cache/claude-tmp/codex-clipboard-aa3057f4-a42c-4f39-9dc5-2fe9aa79e352.png` (1121 × 1403 px; technical board with front, side, back, top, and bottom views).

**Implementation:** `/tmp/pet-shell-desktop-final.png` (1280 × 1000 CSS px, full-page browser capture at 1× density); focused device capture: `/tmp/pet-shell-device-region-final.png` (500 × 619 CSS px). Mobile capture: `/tmp/pet-shell-mobile-final.png` (375 px viewport width, full page).

**Combined visual comparison:** `/tmp/pet-shell-combined-comparison-final.png` displays the source board and rendered implementation together. The comparison uses the front view as the matching reference surface; source and implementation are both displayed at 1× browser capture density, with the implementation device crop also reviewed separately.

**State:** Home screen, kitten idle, feed shortcut focused. No touch interaction on the display. A/B/C hardware controls are active.

## Findings

- No remaining P0, P1, or P2 visual or interaction issues found in the final comparison.
- The device case is a single raster illustration layer. The live 240 × 240 logical game screen is layered into its square display area, and the A/B/C hit areas align with the three pink caps.
- The editable MOMO wordmark replaces the Pokegotchi wordmark shown in the reference; this preserves the existing product identity while keeping the same upper-front placement.
- The reference is a technical board while the implementation is the operating device screen, so labels and alternate device views from the board are intentionally not included in the app.

## Comparison history

1. Initial implementation capture showed the shell constrained to 360 px and therefore smaller than the target composition. Removed the inherited width cap; the desktop case now renders at 500 × 619 CSS px.
2. Hit-area inspection found the three transparent button targets were positioned against the page instead of the case. Made the case the positioning reference. Final desktop targets are 70 × 70 px and centered over their respective pink caps; mobile targets are 47 × 47 px and similarly aligned. Final captures are the paths listed above.

## Required fidelity surfaces

- **Typography:** Shell wordmark is blue, bold, centered, and clear of the blue bezel. The app title, status text, and helper copy remain legible at desktop and mobile widths.
- **Spacing and layout:** Egg-shaped case, antenna, centered display, lower control row, and broad margins follow the reference's front-view hierarchy. The mobile case scales to 339 × 420 CSS px at a 375 px viewport.
- **Color and tokens:** Cream shell, burgundy outline, blue display surround, pink buttons, and pastel side accents follow the reference palette.
- **Image quality and asset fidelity:** The case is raster art, not CSS geometry. The source art has a uniform blank display panel; the live screen covers it cleanly. The image loaded at 1127 px intrinsic width without a missing-asset error.
- **Copy and content:** Existing MOMO identity and virtual-pet content remain in the live display. Reference-sheet labels and technical dimensions are not part of the device UI.

## Verification

- Existing automated suite: 21/21 passed.
- Browser: desktop 1280 × 1000 and mobile 375 × 812 inspected.
- Manual control check: A moved selection from feed to play; B activated play. Button accessible names remain A, B, and C actions.
- Browser console: no app errors observed on the final local page. Earlier captures showed only the browser's request for an absent optional favicon.

**final result: passed**

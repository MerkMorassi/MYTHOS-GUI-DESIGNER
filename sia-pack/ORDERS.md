# EXACT ORDERS — AI STUDIO AGENT (MYTHOS-DESIGNER repo)

You are working in the MYTHOS-DESIGNER repo (the app deployed at
https://mythos-uidesigner.vercel.app/). The pack in your hands:
terminal.css, SIA-NOTES.txt, shots/*.png, sia-terminal-board.json,
terminal-surface.json, terminal-bridge.js, siaTerminal.ts,
siaTerminalPreset.ts, PATCH.md. Execute in order. Do not skip the proof
step. Report back receipts, not claims.

## ORDER 1 — FORGE THE SKIN (Theme Forge modal)

1. Run the app locally: `./start-localhost.sh` (Linux/macOS) or
   `start-localhost.bat` (Windows). NOTE: SYNTHESIZE posts to
   `/api/theme/transform`, which exists ONLY on this express server —
   it will fail on the Vercel static deploy. Do forge work locally.
   No API key is required (heuristic fallback synthesizer fires).
2. Open the app, click THEME FORGE in the top header (the SKETCH &
   ASSET-TO-THEME COMPILER modal).
3. Section 1 (SKETCHES, SCREENSHOTS & SWATCHES): upload every PNG in
   shots/ — gallery.png first (canonical look), then msd-board.png,
   theme-panel.png, vox-panel.png, sync-drive.png, stage.png,
   console-main.png.
4. Section 2 (LEGACY CSS & DIRECTIVES): upload terminal.css (or paste
   it), set TARGET THEME NAME to `SIA Terminal`, set DESIGN DIRECTIVES
   to the full text of SIA-NOTES.txt.
5. Press SYNTHESIZE THEME. Wait for COMPILED. If it errors, reply with
   the exact error text and stop — do not invent a theme by hand.
6. Press APPLY & STORE AS SEPARATE THEME. Confirm the app re-skins.
7. Press COPY CODE. Paste the emitted `'sia-terminal'` (or emitted id)
   block into `src/constants/themes.ts` next to the other themes so it
   ships permanently. Commit.

## ORDER 2 — REGISTER THE TEMPLATE (selectable, not import-only)

1. Copy siaTerminalPreset.ts into `src/constants/siaTerminalPreset.ts`.
2. In `src/constants/templates.ts`: import SIA_TERMINAL_MANIFEST, add
   `siaTerminal: SIA_TERMINAL_MANIFEST` to TEMPLATE_PRESETS, and add
   `{ key: "siaTerminal", layoutId: "sia-terminal-surface-01",
   name: "SIA Terminal Surface", themeId: "crt-phosphor",
   archetype: "tactical-hud", category: "Quantum & Subspace Consoles" }`
   to getUnifiedTemplatePresets(). (An IMPORT MANIFEST upload alone
   never registers a picker entry — this edit is the requirement.)
3. The forged `sia-terminal` theme id from ORDER 1 may replace
   `crt-phosphor` in the preset once it exists. Keep `crt-phosphor`
   until then.

## ORDER 3 — WIRE THE LIVE SURFACE (driver + 2 call sites)

Follow PATCH.md exactly:
1. Copy siaTerminal.ts into `src/utils/siaTerminal.ts`.
2. Wrap handleSelectNav + node select in src/App.tsx so any
   `terminal:` target fires via SiaTerminal.fire().
3. Add the LINK SIA button + receipt feed (PATCH.md section 4).
Terminal side is already whitelisted for your deploy origin
(`https://mythos-uidesigner.vercel.app` sits in the console's origin
list). Binding contract: `{ terminal: "<command-text>" }` on node
targetSection, widget data.terminal, or navigation target. Command text
is the VOXCONT repertoire in terminal-surface.json. Unbound sends
nothing; renders/strikes/wipes have no command-text and can never fire;
`mirror the vault` asks YES on the console first.

## ORDER 4 — PROVE IT (do not report done without this)

1. `npm run dev`, pick SIA Terminal Surface from the picker.
2. LINK SIA from a direct click (pop-up blocker eats programmatic
   window.open — allow the pop-up once). Expect READY in the feed.
3. Press the GALLERY node: the terminal's gallery must open for real,
   receipt lands in the feed. Press MIRROR VAULT: the console must ask
   YES first.
4. `npm run build`, redeploy to Vercel, confirm the picker entry + skin
   survive on the live URL.
5. Report: READY receipt text, GALLERY receipt text, screenshot of the
   designer wearing the forged skin with the SIA board loaded.

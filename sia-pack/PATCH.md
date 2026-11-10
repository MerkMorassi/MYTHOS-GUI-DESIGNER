# SIA SURFACE HOOK-UP — 4 drops + redeploy

Terminal side is already whitelisted: `/msd origin add
https://mythos-uidesigner.vercel.app` is live on the console. What follows
makes the designer drive it like a real surface.

## 1. Drop these two files in (exact paths)

- `src/utils/siaTerminal.ts` (this pack) — postMessage driver:
  connect / attach / run / fire / receipts. No dependencies.
- `src/constants/siaTerminalPreset.ts` (this pack) — the SIA Terminal
  manifest, pre-bound with `terminal:` bindings.

## 2. Register the selectable template (2 edits)

`src/constants/templates.ts`:

```ts
import { SIA_TERMINAL_MANIFEST } from "./siaTerminalPreset";
// inside TEMPLATE_PRESETS, add:
siaTerminal: SIA_TERMINAL_MANIFEST,
```

`getUnifiedTemplatePresets()` array, add:

```ts
{
  key: "siaTerminal",
  layoutId: "sia-terminal-surface-01",
  name: "SIA Terminal Surface",
  themeId: "crt-phosphor",
  archetype: "tactical-hud",
  category: "Quantum & Subspace Consoles",
},
```

That is what puts "SIA Terminal Surface" in the picker. Nothing else does —
a JSON import alone never registers a template.

## 3. Fire bindings on node + nav press (2 edits in src/App.tsx)

```tsx
import { SiaTerminal } from "./utils/siaTerminal";

// wrap handleSelectNav:
const handleSelectNav = (id: string) => {
  const item = manifest.navigation.find((n) => n.id === id);
  if (item && item.target.toLowerCase().startsWith("terminal:")) {
    SiaTerminal.fire(item.target); // receipt returns async, selection still applies
  }
  setManifest((prev) => ({
    ...prev,
    navigation: prev.navigation.map((n) => ({ ...n, active: n.id === id })),
  }));
};

// wrap node select where you pass onSelectNode={setSelectedNode}:
const handleSelectNode = (node: MSDNode | null) => {
  if (node && node.targetSection) SiaTerminal.fire(node.targetSection);
  setSelectedNode(node);
};
// then pass onSelectNode={handleSelectNode} in both dashboard branches.
```

Gates stay on the terminal: unbound nodes resolve UNBOUND locally and send
nothing; renders/strikes/wipes have no command-text and can never fire;
`mirror the vault` asks YES on the console before moving.

## 4. LINK SIA button + receipt feed (header or dashboard)

```tsx
const [siaFeed, setSiaFeed] = useState<string[]>([]);
const [siaLinked, setSiaLinked] = useState(false);

useEffect(() => {
  SiaTerminal.receipts((line) =>
    setSiaFeed((f) => [...f, line].slice(-5)));
}, []);

// button:
<button onClick={() => {
  const ok = SiaTerminal.connect(
    "https://perchance.org/mythos-lia-barbelo", "sia_terminal");
  setSiaLinked(ok);
}}>
  {siaLinked && SiaTerminal.linked() ? "SIA LINKED" : "LINK SIA"}
</button>
// feed:
{siaFeed.map((l, i) => <div key={i}>{l}</div>)}
```

Pop-up blockers eat `window.open` — call connect from the click handler
(direct user gesture), then allow the pop-up once. If the terminal tab is
already open, use `SiaTerminal.attach(termWindow, "https://perchance.org")`
with an iframe instead.

## 5. Prove it (60 seconds)

1. `npm run dev`, open the designer, pick SIA Terminal Surface.
2. LINK SIA (terminal answers READY).
3. Press GALLERY node — the terminal's gallery opens for real, receipt lands
   in the feed. Press MIRROR VAULT — the console asks YES first; answer
   yes/no in the terminal.
4. `npm run build`, redeploy to Vercel — the picker entry ships with it.

## Why import alone wasn't enough

IMPORT MSD LAYOUT MANIFEST loads a manifest into state only. Selectable
templates come from TEMPLATE_PRESETS, and live firing needs the driver +
the two call sites above. This pack adds all three.

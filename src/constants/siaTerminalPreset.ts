import type { MSDLayoutManifest } from "../types/msd";

export const SIA_TERMINAL_MANIFEST: MSDLayoutManifest = {
  $schema: "https://mythos.engine/schemas/ui-builder-v1.json",
  layoutId: "sia-terminal-surface-01",
  name: "SIA Terminal Surface",
  theme: "sia-terminal",
  layoutArchetype: "tactical-hud",
  header: {
    title: "SIA TERMINAL // CONSOLE SURFACE",
    authorizationCode: "AUTHORIZED // BARBELO CONSOLE",
    stardate: "BAUD 115200 // PHOSPHOR GREEN",
    subTitle: "BINDINGS RIDE terminal: COMMAND-TEXT - VOXCONT REPERTOIRE",
  },
  navigation: [
    { id: "sec-01", label: "01 - GALLERY", target: "terminal:open gallery", active: true },
    { id: "sec-02", label: "02 - STAGE", target: "terminal:open stage", active: false },
    { id: "sec-03", label: "03 - PULL", target: "terminal:pull the drive", active: false },
    { id: "sec-04", label: "04 - STATUS", target: "terminal:status", active: false },
  ],
  msdCanvas: {
    schematicAsset: "quantum_core",
    schematicType: "quantum_core",
    overlayType: "coherence",
    nodes: [
      { id: "sia-gallery", label: "GALLERY", x: 22, y: 30, metricKey: "coherenceFactor", description: "Works the gallery switch here", status: "nominal", targetSection: "terminal:open gallery" },
      { id: "sia-stage", label: "STAGE", x: 74, y: 30, metricKey: "warpFieldFlux", description: "Works the stage switch here", status: "nominal", targetSection: "terminal:open stage" },
      { id: "sia-pull", label: "PULL DRIVE", x: 24, y: 62, metricKey: "plasmaFlowRate", description: "Linked folder pictures into the vault, new only", status: "nominal", targetSection: "terminal:pull the drive" },
      { id: "sia-mirror", label: "MIRROR VAULT", x: 72, y: 62, metricKey: "coreTemperature", description: "Whole vault onto the drive - ASKS YES FIRST", status: "warning", targetSection: "terminal:mirror the vault" },
      { id: "sia-listen", label: "LISTEN", x: 36, y: 82, metricKey: "subspaceBandwidth", description: "Say again / send / halt - voice lane", status: "nominal", targetSection: "terminal:listen" },
      { id: "sia-status", label: "STATUS", x: 60, y: 82, metricKey: "shieldHarmonics", description: "Printed state + repertoire", status: "standby", targetSection: "terminal:status" },
    ],
  },
  geometryParams: { outerElbowRadius: 0, innerElbowRadius: 0, padding: 8, barGap: 2 },
  kpiCards: [
    { id: "kpi-1", label: "VAULT RECORDS", value: "live feed", unit: "Count", metricKey: "plasmaFlowRate", status: "nominal" },
    { id: "kpi-2", label: "VOICE STATE", value: "live feed", unit: "State", metricKey: "coherenceFactor", status: "nominal" },
  ],
  widgets: [
    { id: "w-1", title: "Receipt Feed", type: "event-log", colSpan: 2, description: "Rolling command receipts from the console" },
    { id: "w-2", title: "Console State", type: "status-grid", colSpan: 2, description: "Vault / panels / voice / skin - read-only paints" },
    { id: "w-3", title: "Status Probe", type: "status-grid", colSpan: 1, description: "Bound widget - RUN fires status here", data: { terminal: "terminal:status" } },
  ],
  designRationale: "SIA TERMINAL console surface - every control carries a terminal: binding. Fires over postMessage via src/utils/siaTerminal.ts.",
};

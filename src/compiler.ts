import * as jsim from "./jsimg.ts"
import * as md from "./mermaid.ts"
import * as fs from "node:fs"
export type NodeKind = "sink" | "source" | "join" | "fork" | "router" | "semaphore" | "scaler" | "delay" | "queue";
interface IndexDef {
  name: string;                 // label shown in the Excel
  scope: "station" | "system";
  appliesTo?: NodeKind[];       // only for scope "station"
  unit?: string;
}
export function nodeKind(node: md.MdNode): NodeKind {
      const l = node.label.toLowerCase();
      if (node.isSink()) {
            return "sink";
      }
      if (node.isSource()) {
            return "source";
      }
      for (const k of ["join", "fork", "router", "semaphore", "scaler", "delay"] as const) {
            if (l.includes(k)) {
                  return k;
            }
      }
      return "queue";
}
export function mermaidNodeToJsim(node: md.MdNode) {
      const map: Map<NodeKind, new() => jsim.Node> = new Map;

      map.set('sink', jsim.Sink)
      map.set('source', jsim.Source)
      map.set('join', jsim.Join)
      map.set('fork', jsim.Fork)
      map.set('router', jsim.Router)
      map.set('semaphore', jsim.Semaphore)
      map.set('scaler', jsim.Scaler)
      map.set('delay', jsim.Delay)
      map.set('queue', jsim.Queue)
      const constructor = map.get(nodeKind(node))!;
      return new constructor().setName(node.label);
}
const SERVICE: NodeKind[] = ["queue", "delay"];
export const INDICES: Record<string, IndexDef> = {
      "utilization":            { name: "Utilization",            scope: "station", appliesTo: ["queue"], unit: "%" },
      "response time":          { name: "Response Time",          scope: "station", appliesTo: SERVICE, unit: "s" },
      "residence time":         { name: "Residence Time",         scope: "station", appliesTo: SERVICE, unit: "s" },
      "throughput":             { name: "Throughput",             scope: "station", appliesTo: SERVICE, unit: "jobs/s" },
      "queue length":           { name: "Number of Customers",    scope: "station", appliesTo: SERVICE, unit: "jobs" },
      "drop rate":              { name: "Drop Rate",              scope: "station", appliesTo: ["queue"], unit: "jobs/s" },
      "system response time":   { name: "System Response Time",   scope: "system", unit: "s" },
      "system throughput":      { name: "System Throughput",      scope: "system", unit: "jobs/s" },
      "system number of customers": { name: "System Number of Customers", scope: "system", unit: "jobs" },
};

function toCsvFile(nodes: md.MdNode[], indices: string[]) {
      const rows: [string,string][] = [];
      for (const index of indices) {
            const description = INDICES[index];
            if (description.scope != 'station') {
                  rows.push([`${description.name} [${description.unit}]`, `0`])
                  continue;
            }

            for (const node of nodes) {
                  const kind = nodeKind(node);
                  if (description.appliesTo!.includes(kind)) {
                        rows.push([`${description.name} for ${node.label} [${description.unit}]`, `0`])
                  }
            }
      }
      return rows.map(row => row.map(v => `"${v}"`).join(',')).join('\n');
}
export function MdToJsimTranslator(text: string, indices: string[]) {
      const ctx = new jsim.JsimContext();
      const nodes = new md.MermaidCompiler(text).getNodes();

      for (const node of nodes) {
            const model = mermaidNodeToJsim(node);
            for (const next of node.getNext()) {
                  new jsim.Arrow(model.name, next.label).append(ctx.document);
            }
            model.append(ctx.document);
      }
      fs.writeFileSync('model.jsimg', ctx.document.toString());
      fs.writeFileSync('model.csv', toCsvFile(nodes, indices));
} 


MdToJsimTranslator(`
---
config:
  layout: elk
  theme: redux
title: Comparison of anoymizers
---
flowchart TB
    n1(["source"]) --> n2["App"]
    n2 --> n3["delay Disk 1"] & n4["disk 2"]
    n3 --> n5(["sink"])
    n4 --> n5

    n2@{ shape: rect}
    n3@{ shape: rect}
    n4@{ shape: proc}
`, ['utilization', 'system response time'])         
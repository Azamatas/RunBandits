const ROUTE_COLORS = [
  "#fc4c02", "#0284c7", "#16a34a", "#9333ea",
  "#e11d48", "#0d9488", "#a16207", "#6d28d9",
];

export function heistColor(id: number): string {
  return ROUTE_COLORS[id % ROUTE_COLORS.length];
}

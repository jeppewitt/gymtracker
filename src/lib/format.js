export function formatKg(weight) {
  const n = Number(weight);
  const str = n.toLocaleString("da-DK", { maximumFractionDigits: 2 });
  return `${str} kg`;
}

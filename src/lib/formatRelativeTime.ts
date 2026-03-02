export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffM = Math.floor(diffMs / 60_000);
  const diffH = Math.floor(diffMs / 3600_000);
  const diffD = Math.floor(diffMs / 86400_000);

  if (diffM < 1) return "gerade eben";
  if (diffM < 60) return `vor ${diffM} Min`;
  if (diffH < 24) return `vor ${diffH} Std`;
  if (diffD === 1) return "gestern";
  if (diffD < 7) return `vor ${diffD} Tagen`;
  if (diffD < 30) return `vor ${Math.floor(diffD / 7)} W`;
  return date.toLocaleDateString("de-DE", { day: "numeric", month: "short" });
}

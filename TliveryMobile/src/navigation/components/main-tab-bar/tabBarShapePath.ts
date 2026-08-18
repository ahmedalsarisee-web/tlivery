/**
 * Shared geometry for the notched bottom tab bar (center FAB hump).
 * Mirrors Synchro mobile tab bar silhouette.
 */
export function buildTabBarShapePath(
  width: number,
  barHeight: number,
  cornerRadius: number,
  humpRise: number,
): string {
  const h = barHeight;
  const r = cornerRadius;
  const humpHalfWidth = 60;
  const yOffset = humpRise;
  const centerX = width / 2;
  const humpStart = centerX - humpHalfWidth;
  const humpEnd = centerX + humpHalfWidth;
  const humpTop = yOffset - humpRise;

  const cp1x = humpStart + 18;
  const cp1y = yOffset;
  const cp2x = centerX - 28;
  const cp2y = humpTop;
  const cp3x = centerX + 28;
  const cp3y = humpTop;
  const cp4x = humpEnd - 18;
  const cp4y = yOffset;

  // Top corners stay rounded; bottom edges are square so the bar sits flush.
  return `
    M 0 ${yOffset + r}
    Q 0 ${yOffset} ${r} ${yOffset}
    H ${humpStart}
    C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${centerX} ${humpTop}
    C ${cp3x} ${cp3y} ${cp4x} ${cp4y} ${humpEnd} ${yOffset}
    H ${width - r}
    Q ${width} ${yOffset} ${width} ${yOffset + r}
    V ${yOffset + h}
    H 0
    V ${yOffset + r}
    Z
  `;
}

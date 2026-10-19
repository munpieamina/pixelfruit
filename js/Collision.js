/** Проверяет пересечение отрезка взмаха с круглой областью объекта. */
export function segmentCircle(x1, y1, x2, y2, centerX, centerY, radius) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;

  if (!lengthSquared) return Math.hypot(centerX - x1, centerY - y1) <= radius;

  const projection = Math.max(0, Math.min(1,
    ((centerX - x1) * dx + (centerY - y1) * dy) / lengthSquared));
  const nearestX = x1 + projection * dx;
  const nearestY = y1 + projection * dy;
  return Math.hypot(centerX - nearestX, centerY - nearestY) <= radius;
}

/** Комбо: +50 очков за каждый фрукт сверх первого, максимум +300. */
export function comboBonus(count) {
  return count < 2 ? 0 : Math.min(300, (count - 1) * 50);
}

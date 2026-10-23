export function getCarouselPage(
  total: number,
  requestedStart: number,
  pageSize: number,
) {
  const lastStart = Math.max(0, Math.floor((total - 1) / pageSize) * pageSize);
  const start = Math.min(
    Math.max(0, Math.floor(requestedStart / pageSize) * pageSize),
    lastStart,
  );
  const end = Math.min(start + pageSize, total);
  return { start, end, hasPrevious: start > 0, hasNext: end < total };
}

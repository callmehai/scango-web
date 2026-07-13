// Collect every page of a skip/limit/total endpoint into a single array.
// Used by the admin pages to (a) drive client-side paging/filtering over a
// small dataset and (b) export the full matching set to Excel. `maxRows` is a
// safety cap so a mistakenly-huge table can't loop forever.
export async function fetchAllPages<T>(
  fetchPage: (
    skip: number,
    limit: number,
  ) => Promise<{ items: T[]; total: number }>,
  opts?: { pageSize?: number; maxRows?: number },
): Promise<T[]> {
  const pageSize = opts?.pageSize ?? 100;
  const maxRows = opts?.maxRows ?? 5000;

  const all: T[] = [];
  let skip = 0;
  let total = Infinity;

  while (all.length < total && all.length < maxRows) {
    const page = await fetchPage(skip, pageSize);
    total = page.total;
    if (page.items.length === 0) break;
    all.push(...page.items);
    skip += pageSize;
  }

  return all;
}

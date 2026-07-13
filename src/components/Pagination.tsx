import Dropdown from "./Dropdown";
import "../styles/Pagination.css";

export interface PaginationLabels {
  nav: string;
  first: string;
  prev: string;
  next: string;
  last: string;
  perPage: string;
  /** e.g. (1, 20, 137) -> "1–20 of 137" */
  showing: (from: number, to: number, total: number) => string;
}

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  disabled?: boolean;
  /** Generic strings — callers pass their own i18n values. */
  labels: PaginationLabels;
}

// Compact page-number window with ellipses: 1 … 4 5 [6] 7 8 … 20
function pageWindow(page: number, totalPages: number): number[] {
  const span = 1; // neighbours shown on each side of the current page
  const wanted = new Set<number>([1, totalPages]);
  for (let p = page - span; p <= page + span; p++) {
    if (p >= 1 && p <= totalPages) wanted.add(p);
  }
  return [...wanted].sort((a, b) => a - b);
}

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  disabled = false,
  labels,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);
  const nums = pageWindow(safePage, totalPages);

  return (
    <nav className="pagination" aria-label={labels.nav}>
      <div className="pagination__summary">
        {labels.showing(from, to, total)}
      </div>

      {totalPages > 1 && (
        <div className="pagination__controls">
          <button
            type="button"
            className="pagination__arrow"
            onClick={() => onPageChange(1)}
            disabled={safePage <= 1 || disabled}
            aria-label={labels.first}
          >
            «
          </button>
          <button
            type="button"
            className="pagination__arrow"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1 || disabled}
            aria-label={labels.prev}
          >
            ‹
          </button>

          {nums.map((n, i) => {
            const gap = i > 0 && n - nums[i - 1] > 1;
            return (
              <span key={n} className="pagination__num">
                {gap && (
                  <span className="pagination__ellipsis" aria-hidden="true">
                    …
                  </span>
                )}
                <button
                  type="button"
                  className={`pagination__page${
                    n === safePage ? " pagination__page--active" : ""
                  }`}
                  onClick={() => onPageChange(n)}
                  disabled={disabled}
                  aria-current={n === safePage ? "page" : undefined}
                >
                  {n}
                </button>
              </span>
            );
          })}

          <button
            type="button"
            className="pagination__arrow"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages || disabled}
            aria-label={labels.next}
          >
            ›
          </button>
          <button
            type="button"
            className="pagination__arrow"
            onClick={() => onPageChange(totalPages)}
            disabled={safePage >= totalPages || disabled}
            aria-label={labels.last}
          >
            »
          </button>
        </div>
      )}

      {onPageSizeChange && (
        <div className="pagination__size">
          <span className="pagination__size-label">{labels.perPage}</span>
          <Dropdown<number>
            value={pageSize}
            onChange={onPageSizeChange}
            ariaLabel={labels.perPage}
            minWidth={80}
            options={pageSizeOptions.map((n) => ({
              value: n,
              label: String(n),
            }))}
          />
        </div>
      )}
    </nav>
  );
}

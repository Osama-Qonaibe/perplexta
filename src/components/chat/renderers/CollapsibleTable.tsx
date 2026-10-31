import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from '@/design-system';
import { Copy, Check, FileSpreadsheet, Maximize2, X, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface CollapsibleTableProps {
  children: React.ReactNode;
  dir: 'ltr' | 'rtl';
  tableKey?: string;
  isStreaming?: boolean;
}

/**
 * Renders a cell string with smart KPI badges, delta trends, or micro progress bars
 * inside the full-screen analytical table modal.
 */
function renderAnalyticalCellContent(val: string) {
  const trimmed = (val || '').trim();
  if (!trimmed) return <span className="text-[var(--text-muted)]/50">—</span>;

  // 1. Positive / Negative Delta (e.g., +14.2%, -3.8%, ▲ 12%, ▼ 4%)
  const deltaMatch = trimmed.match(/^([+▲-▼])\s*(\d+(?:[.,]\d+)?%?)(.*)$/);
  if (deltaMatch) {
    const isPositive = deltaMatch[1] === '+' || deltaMatch[1] === '▲';
    const metric = `${deltaMatch[1]}${deltaMatch[2]}`;
    const rest = deltaMatch[3] || '';
    return (
      <span className="inline-flex items-center gap-1.5 flex-wrap">
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded-shape-xs text-[11px] font-mono font-semibold tabular-nums ${
            isPositive
              ? 'bg-[var(--status-success-subtle)] text-[var(--fg-success)] border border-[var(--fg-success)]/25'
              : 'bg-rose-500/10 text-rose-500 border border-rose-500/25'
          }`}
        >
          {metric}
        </span>
        {rest && <span>{rest}</span>}
      </span>
    );
  }

  // 2. Pure percentage (0% - 100%) -> Show tabular number + delicate micro progress bar
  const pctMatch = trimmed.match(/^(\d{1,3}(?:\.\d+)?)%$/);
  if (pctMatch) {
    const num = parseFloat(pctMatch[1]);
    if (num >= 0 && num <= 100) {
      return (
        <div className="inline-flex items-center gap-2 min-w-[90px]">
          <span className="font-mono tabular-nums font-medium text-[var(--text-primary)]">{trimmed}</span>
          <div className="w-12 h-1.5 rounded-shape-full bg-[var(--surface-subtle)] overflow-hidden border border-[var(--border-default)]/40 shrink-0">
            <div
              className="h-full rounded-shape-full bg-[var(--fg-accent)]/80"
              style={{ width: `${Math.min(100, Math.max(4, num))}%` }}
            />
          </div>
        </div>
      );
    }
  }

  return <span className="tabular-nums">{trimmed}</span>;
}

export const CollapsibleTable: React.FC<CollapsibleTableProps> = ({ children, dir, isStreaming = false }) => {
  const [copied, setCopied] = useState(false);
  const [isExpandedModalOpen, setIsExpandedModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const tableRef = useRef<HTMLTableElement>(null);

  // Close modal on Escape
  useEffect(() => {
    if (!isExpandedModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExpandedModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isExpandedModalOpen]);

  // Extract table matrix accurately for copy, CSV export, and Full-Screen Modal
  const extractTableData = () => {
    if (!tableRef.current) return { csv: '', markdown: '', headers: [] as string[], bodyRows: [] as string[][] };

    const rows = Array.from(tableRef.current.querySelectorAll('tr'));
    const matrix = rows
      .map(row =>
        Array.from(row.querySelectorAll('th, td')).map(cell => {
          const text = (cell as HTMLElement).innerText || cell.textContent || '';
          return text.trim();
        })
      )
      .filter(row => row.length > 0 && row.some(cell => cell.length > 0));

    if (matrix.length === 0) return { csv: '', markdown: '', headers: [] as string[], bodyRows: [] as string[][] };

    const csvLines = matrix.map(row =>
      row.map(val => `"${val.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`).join(',')
    );
    const csv = csvLines.join('\r\n');

    const numCols = Math.max(...matrix.map(r => r.length));
    const colWidths = Array.from({ length: numCols }, (_, colIndex) =>
      Math.max(...matrix.map(row => (row[colIndex] || '').length), 3)
    );

    const headers = matrix[0] || [];
    const bodyRows = matrix.slice(1);

    let markdown = `| ${headers.map((h, i) => (h || '').padEnd(colWidths[i] || 3)).join(' | ')} |\n`;
    markdown += `| ${colWidths.map(w => '-'.repeat(w)).join(' | ')} |\n`;
    bodyRows.forEach(row => {
      markdown += `| ${Array.from({ length: numCols }, (_, i) => (row[i] || '').padEnd(colWidths[i] || 3)).join(' | ')} |\n`;
    });

    return { csv, markdown, headers, bodyRows };
  };

  const handleCopyMarkdown = () => {
    const { markdown } = extractTableData();
    if (!markdown) return;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    toast.success(dir === 'rtl' ? 'تم نسخ الجدول بنجاح' : 'Table copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCSV = () => {
    const { csv } = extractTableData();
    if (!csv) return;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `perplexta-table-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(dir === 'rtl' ? 'تم تنزيل ملف CSV بنجاح' : 'CSV downloaded successfully');
  };

  const modalTableData = useMemo(() => {
    if (!isExpandedModalOpen) return { headers: [] as string[], rows: [] as string[][] };
    const { headers, bodyRows } = extractTableData();
    let filtered = bodyRows;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(row => row.some(cell => cell.toLowerCase().includes(q)));
    }

    if (sortCol !== null) {
      filtered = [...filtered].sort((a, b) => {
        const valA = (a[sortCol] || '').trim();
        const valB = (b[sortCol] || '').trim();
        const numA = parseFloat(valA.replace(/[^0-9.-]+/g, ''));
        const numB = parseFloat(valB.replace(/[^0-9.-]+/g, ''));
        if (!isNaN(numA) && !isNaN(numB) && /\d/.test(valA) && /\d/.test(valB)) {
          return sortAsc ? numA - numB : numB - numA;
        }
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    }

    return { headers, rows: filtered };
  }, [isExpandedModalOpen, searchQuery, sortCol, sortAsc]);

  const handleColumnSort = (colIdx: number) => {
    if (sortCol === colIdx) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(colIdx);
      setSortAsc(true);
    }
  };

  return (
    <>
      <div
        className="my-4 w-full rounded-shape-md border border-[var(--border-default)]/55 bg-transparent overflow-hidden relative group/table transition-colors text-start rtl:text-right ltr:text-left"
        dir={dir}
      >
        {/* Subtle Corner Controls matching reference video (Expand ⤢, Copy, CSV) */}
        {!isStreaming && (
          <div className="absolute top-2 rtl:left-2 ltr:right-2 z-10 flex items-center gap-1 opacity-85 sm:opacity-0 sm:group-hover/table:opacity-100 focus-within:opacity-100 transition-opacity duration-150 pointer-events-auto">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSortCol(null);
                setIsExpandedModalOpen(true);
              }}
              className="w-7 h-7 rounded-shape-xs bg-[var(--surface-card)]/90 backdrop-blur-xs hover:bg-[var(--surface-subtle)] border border-[var(--border-default)]/70 hover:border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer flex items-center justify-center shadow-2xs box-border relative before:absolute before:-inset-2 before:content-['']"
              title={dir === 'rtl' ? 'تكبير الجدول والفرز' : 'Expand & Sort Table'}
              aria-label={dir === 'rtl' ? 'تكبير الجدول والفرز' : 'Expand & Sort Table'}
            >
              <Maximize2 size={12} className="shrink-0" />
            </button>

            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="w-7 h-7 rounded-shape-xs bg-[var(--surface-card)]/90 backdrop-blur-xs hover:bg-[var(--surface-subtle)] border border-[var(--border-default)]/70 hover:border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer flex items-center justify-center shadow-2xs box-border relative before:absolute before:-inset-2 before:content-['']"
              title={dir === 'rtl' ? 'نسخ الجدول' : 'Copy Table'}
              aria-label={dir === 'rtl' ? 'نسخ الجدول' : 'Copy Table'}
            >
              {copied ? <Check size={12} className="text-[var(--fg-success)] shrink-0" /> : <Copy size={12} className="shrink-0" />}
            </button>

            <button
              type="button"
              onClick={handleDownloadCSV}
              className="w-7 h-7 rounded-shape-xs bg-[var(--surface-card)]/90 backdrop-blur-xs hover:bg-[var(--surface-subtle)] border border-[var(--border-default)]/70 hover:border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer flex items-center justify-center shadow-2xs box-border relative before:absolute before:-inset-2 before:content-['']"
              title={dir === 'rtl' ? 'تنزيل CSV' : 'Download CSV'}
              aria-label={dir === 'rtl' ? 'تنزيل CSV' : 'Download CSV'}
            >
              <FileSpreadsheet size={12} className="shrink-0" />
            </button>
          </div>
        )}

        {/* Scrollable Table Viewport */}
        <div className="w-full overflow-x-auto custom-scrollbar">
          <table
            ref={tableRef}
            className="w-full border-collapse text-xs sm:text-[13px] text-start rtl:text-right ltr:text-left"
            dir={dir}
          >
            {children}
          </table>
        </div>
      </div>

      {/* Full-Screen Analytical Table Modal */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isExpandedModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[300] bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
                dir={dir}
                onClick={() => setIsExpandedModalOpen(false)}
              >
                <motion.div
                  initial={{ scale: 0.97, opacity: 0, y: 8 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.97, opacity: 0, y: 8 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-6xl max-h-[88dvh] flex flex-col rounded-shape-lg bg-[var(--surface-card)] border border-[var(--border-default)] shadow-2xl overflow-hidden"
                >
                  {/* Modal Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border-default)]/70 bg-[var(--surface-subtle)]/40 shrink-0">
                    <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                      <div className="relative flex-1 max-w-xs">
                        <Search size={13} className="absolute top-1/2 -translate-y-1/2 start-3 text-[var(--text-muted)] pointer-events-none" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={dir === 'rtl' ? 'بحث وتصفية في الجدول...' : 'Filter table rows...'}
                          className="w-full h-8 ps-8 pe-3 rounded-shape-sm bg-[var(--surface-page)] border border-[var(--border-default)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--border-accent)] transition-colors"
                        />
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)] hidden sm:inline">
                        {modalTableData.rows.length} {dir === 'rtl' ? 'صف' : 'rows'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleCopyMarkdown}
                        className="h-8 px-3 rounded-shape-sm bg-[var(--surface-page)] hover:bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer transition-colors touch-target-44 box-border relative before:absolute before:-inset-1.5 before:content-['']"
                      >
                        {copied ? <Check size={13} className="text-[var(--fg-success)]" /> : <Copy size={13} />}
                        <span>{dir === 'rtl' ? 'نسخ' : 'Copy'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadCSV}
                        className="h-8 px-3 rounded-shape-sm bg-[var(--surface-page)] hover:bg-[var(--surface-subtle)] border border-[var(--border-default)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer transition-colors touch-target-44 box-border relative before:absolute before:-inset-1.5 before:content-['']"
                      >
                        <FileSpreadsheet size={13} />
                        <span>CSV</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsExpandedModalOpen(false)}
                        className="w-8 h-8 rounded-shape-sm bg-[var(--surface-page)] hover:bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center cursor-pointer transition-colors touch-target-44 box-border relative before:absolute before:-inset-1.5 before:content-['']"
                        aria-label={dir === 'rtl' ? 'إغلاق' : 'Close'}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Modal Table Body */}
                  <div className="flex-1 overflow-auto custom-scrollbar p-4">
                    <div className="rounded-shape-md border border-[var(--border-default)]/60 overflow-hidden">
                      <table className="w-full border-collapse text-xs sm:text-[13.5px] text-start">
                        <thead className="bg-[var(--surface-subtle)]/70 border-b border-[var(--border-default)]/60 sticky top-0 z-10">
                          <tr>
                            {modalTableData.headers.map((header, hIdx) => {
                              const isSorted = sortCol === hIdx;
                              return (
                                <th
                                  key={`modal-th-${hIdx}`}
                                  onClick={() => handleColumnSort(hIdx)}
                                  className="py-3 px-4 font-semibold text-[var(--text-primary)] select-none cursor-pointer hover:bg-[var(--surface-subtle)] transition-colors text-start"
                                >
                                  <div className="inline-flex items-center gap-1.5">
                                    <span>{header}</span>
                                    <span className="text-[var(--text-muted)]">
                                      {isSorted ? (
                                        sortAsc ? <ArrowUp size={12} className="text-[var(--fg-accent)]" /> : <ArrowDown size={12} className="text-[var(--fg-accent)]" />
                                      ) : (
                                        <ArrowUpDown size={11} className="opacity-40" />
                                      )}
                                    </span>
                                  </div>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-default)]/35">
                          {modalTableData.rows.length === 0 ? (
                            <tr>
                              <td
                                colSpan={Math.max(1, modalTableData.headers.length)}
                                className="py-8 text-center text-xs text-[var(--text-muted)]"
                              >
                                {dir === 'rtl' ? 'لا توجد نتائج مطابقة للبحث.' : 'No matching rows found.'}
                              </td>
                            </tr>
                          ) : (
                            modalTableData.rows.map((row, rIdx) => (
                              <tr key={`modal-tr-${rIdx}`} className="hover:bg-[var(--surface-subtle)]/35 transition-colors">
                                {modalTableData.headers.map((_, cIdx) => (
                                  <td
                                    key={`modal-td-${rIdx}-${cIdx}`}
                                    className="py-3 px-4 text-[var(--text-secondary)] align-middle leading-relaxed tabular-nums"
                                  >
                                    {renderAnalyticalCellContent(row[cIdx] || '')}
                                  </td>
                                ))}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};

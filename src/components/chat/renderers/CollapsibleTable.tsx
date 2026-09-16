import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from '@/design-system';
import { 
  Table as TableIcon, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Download, 
  FileSpreadsheet, 
  FileText
} from 'lucide-react';

interface CollapsibleTableProps {
  children: React.ReactNode;
  dir: 'ltr' | 'rtl';
  tableKey?: string;
  isStreaming?: boolean;
}

export const CollapsibleTable: React.FC<CollapsibleTableProps> = ({ children, dir, tableKey, isStreaming = false }) => {
  // Session context stored collapse state per table key
  const storageKey = tableKey ? `perplexta_table_collapsed_${tableKey}` : null;

  const [isCollapsed, setIsCollapsed] = useState(() => {
    // When actively streaming, keep table expanded so frame appears calmly and smoothly
    if (isStreaming) {
      return false;
    }
    if (storageKey) {
      try {
        const saved = sessionStorage.getItem(storageKey);
        if (saved !== null) {
          return saved === 'true';
        }
      } catch (e) {
        return false;
      }
    }
    return false; // Expanded by default for serene readability without layout shifts
  });

  const [copied, setCopied] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);

  React.useEffect(() => {
    if (isStreaming) {
      setIsCollapsed(false);
    }
  }, [isStreaming]);

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      if (storageKey) {
        try {
          sessionStorage.setItem(storageKey, String(next));
        } catch (e) {
          // Ignore quota errors
        }
      }
      return next;
    });
  };

  // Extract table matrix accurately for copy/download
  const extractTableData = () => {
    if (!tableRef.current) return { csv: '', markdown: '' };

    const rows = Array.from(tableRef.current.querySelectorAll('tr'));
    const matrix = rows.map(row => 
      Array.from(row.querySelectorAll('th, td')).map(cell => {
        // Clean inner text preserving accuracy without HTML tags or messy whitespace
        const text = (cell as HTMLElement).innerText || cell.textContent || '';
        return text.trim();
      })
    ).filter(row => row.length > 0 && row.some(cell => cell.length > 0));

    if (matrix.length === 0) return { csv: '', markdown: '' };

    // Format as CSV with UTF-8 support and escaped quotes
    const csvLines = matrix.map(row => 
      row.map(val => `"${val.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`).join(',')
    );
    const csv = csvLines.join('\r\n');

    // Format as Markdown Table with padded columns for precision
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

    return { csv, markdown };
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
    a.download = `table-data-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(dir === 'rtl' ? 'تم تنزيل ملف CSV بنجاح' : 'CSV downloaded successfully');
  };

  const handleDownloadMarkdown = () => {
    const { markdown } = extractTableData();
    if (!markdown) return;
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `table-template-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(dir === 'rtl' ? 'تم تنزيل القالب بنجاح' : 'Template downloaded successfully');
  };

  return (
    <div
      className="my-4 w-full rounded-xl sm:rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xs overflow-hidden transition-all text-start rtl:text-right ltr:text-left"
      dir={dir}
    >
      {/* Table Top Toolbar Header */}
      <div className="flex items-center justify-between px-3.5 sm:px-4 py-2.5 bg-[var(--surface-subtle)] border-b border-[var(--border-default)] select-none">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-accent/10 text-accent flex items-center justify-center">
            <TableIcon size={14} />
          </div>
          <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
            {dir === 'rtl' ? 'جدول المقارنة والبيانات' : 'Data & Comparison Table'}
          </span>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleCollapse}
            className="px-2 py-1 rounded-lg text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)] border border-transparent hover:border-[var(--border-default)] flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
            title={isCollapsed ? (dir === 'rtl' ? 'توسيع الجدول' : 'Expand Table') : (dir === 'rtl' ? 'طي الجدول' : 'Collapse Table')}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            <span>
              {isCollapsed 
                ? (dir === 'rtl' ? 'عرض الجدول' : 'Expand') 
                : (dir === 'rtl' ? 'طي' : 'Collapse')
              }
            </span>
          </button>
        </div>
      </div>

      {/* Collapsible Content Area */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            {/* Scrollable Table Viewport */}
            <div className="w-full overflow-x-auto">
              <table 
                ref={tableRef}
                className="w-full border-collapse text-xs sm:text-sm text-start rtl:text-right ltr:text-left" 
                dir={dir}
              >
                {children}
              </table>
            </div>

            {/* Bottom Column Action Bar (Copy / Download Template) */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 sm:px-4 py-2.5 bg-[var(--surface-subtle)]/60 border-t border-[var(--border-default)]">
              <div className="text-[11px] font-medium text-[var(--text-muted)] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>{dir === 'rtl' ? 'قالب جدول تفاعلي موثق' : 'Verified Interactive Data Grid'}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="px-2.5 py-1.5 rounded-lg bg-transparent hover:bg-[var(--surface-card)] border border-transparent hover:border-[var(--border-default)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  title={dir === 'rtl' ? 'نسخ محتوى الجدول' : 'Copy Table'}
                >
                  {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  <span>{copied ? (dir === 'rtl' ? 'تم النسخ' : 'Copied') : (dir === 'rtl' ? 'نسخ الجدول' : 'Copy Table')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  className="px-2.5 py-1.5 rounded-lg bg-transparent hover:bg-[var(--surface-card)] border border-transparent hover:border-[var(--border-default)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  title={dir === 'rtl' ? 'تنزيل كملف CSV' : 'Download CSV'}
                >
                  <FileSpreadsheet size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span>{dir === 'rtl' ? 'تنزيل CSV' : 'Download CSV'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="px-2.5 py-1.5 rounded-lg bg-accent text-white hover:opacity-90 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                  title={dir === 'rtl' ? 'تصدير قالب الجدول' : 'Export Template'}
                >
                  <FileText size={13} />
                  <span>{dir === 'rtl' ? 'تصدير القالب (.md)' : 'Export Template (.md)'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

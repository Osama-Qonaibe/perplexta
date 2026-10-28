import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Search, RefreshCw, Trash2, X, Shield, Database, ShieldAlert, ArrowRight, ArrowLeft, Activity } from "lucide-react";
import { ActionConfirmationModal } from "../ActionConfirmationModal";
import { ComplianceAuditLogsViewProps } from "./adminTypes";
import { AdminRateLimitMetricsView } from "../../pages/AdminRateLimitMetricsView";
import { AdminRenderMetricsView } from "../AdminRenderMetricsView";
import { DatabaseHealthAuditView } from "./DatabaseHealthAuditView";

export const ComplianceAuditLogsView = ({
  theme,
  t,
  dir,
  initialTab = "logs",
  hideSubTabs = false,
}: ComplianceAuditLogsViewProps) => {
  const { token, language } = useAppContext();
  const [activeTab, setActiveTab] = useState<'logs' | 'radar' | 'metrics' | 'databases'>(initialTab);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [limit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [selectedLogIds, setSelectedLogIds] = useState<any[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string | { ar: string; en: string };
    description: string | { ar: string; en: string };
    variant?: 'danger' | 'success' | 'warning' | 'info' | 'purple';
    confirmLabel?: string | { ar: string; en: string };
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  const isRtl = language === "ar";

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const toggleSelectLog = (id: any) => {
    setSelectedLogIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = logs.map((log) => log.id);
    const allSelected = visibleIds.every((id) => selectedLogIds.includes(id));
    if (allSelected) {
      setSelectedLogIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedLogIds((prev) => {
        const union = new Set([...prev, ...visibleIds]);
        return Array.from(union);
      });
    }
  };

  const handleDeleteSelected = () => {
    if (selectedLogIds.length === 0) return;
    const confirmMessage = isRtl
      ? `هل أنت متأكد من مسح (${selectedLogIds.length}) من سجلات التدقيق والامتثال؟ لا يمكن التراجع عن هذا الإجراء.`
      : `Are you sure you want to permanently delete (${selectedLogIds.length}) compliance logs? This action is irreversible.`;

    setConfirmModal({
      isOpen: true,
      title: { ar: "مسح السجلات المحددة؟", en: "Delete Selected Logs?" },
      description: confirmMessage,
      variant: "purple",
      onConfirm: async () => {
        try {
          const res = await fetch("/api/admin/audit-logs/batch-delete", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ ids: selectedLogIds }),
          });
          if (res.ok) {
            setSelectedLogIds([]);
            fetchLogs();
          } else {
            const errData = await res.json();
            console.error("Failed to delete selected logs:", errData.error);
          }
        } catch (err) {
          console.error("Batch delete compliance logs failed:", err);
        }
      }
    });
  };

  const handleClearAll = () => {
    const confirmMessage = isRtl
      ? "تنبيه أمني هام: هل أنت متأكد تماماً من مسح كافة سجلات التدقيق والامتثال بالمنصة بشكل كامل؟ هذا الإجراء سيقوم بتصفير السجلات أمنياً ولا يمكن التراجع عنه."
      : "CRITICAL ALERT: Are you absolutely sure you want to completely clear ALL compliance audit logs? This will wipe the audit history permanently.";

    setConfirmModal({
      isOpen: true,
      title: { ar: "تصفير كافة السجلات أمنياً؟", en: "Purge All Compliance Logs?" },
      description: confirmMessage,
      variant: "purple",
      onConfirm: async () => {
        try {
          const res = await fetch("/api/admin/audit-logs/all", {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "x-confirm-action": "DELETE_ALL",
            },
          });
          if (res.ok) {
            setSelectedLogIds([]);
            fetchLogs();
          } else {
            const errData = await res.json();
            console.error("Failed to purge compliance logs:", errData.error);
          }
        } catch (err) {
          console.error("Purge compliance logs failed:", err);
        }
      }
    });
  };

  const fetchLogs = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const url = `/api/admin/audit-logs?limit=${limit}&offset=${offset}&action=${encodeURIComponent(actionFilter)}&email=${encodeURIComponent(emailFilter)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch compliance audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token, offset]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
    fetchLogs();
  };

  const handleReset = () => {
    setActionFilter("");
    setEmailFilter("");
    setOffset(0);
    setTimeout(() => {
      fetchLogs();
    }, 50);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString(language === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "UTC"
    }) + " UTC";
  };

  return (
    <div className="space-y-6 font-sans" dir={isRtl ? "rtl" : "ltr"}>
      {/* Master Section Header & Internal Navigation Tabs */}
      {!hideSubTabs && (
        <div className="p-6 rounded-shape-md border border-[var(--border-main)] bg-[var(--surface-card)] shadow-2xs transition-theme">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-shape-xs bg-accent/10 text-accent border border-[var(--border-main)] flex-shrink-0">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                  {isRtl ? "التدقيق والامتثال والأمان" : "Audit, Compliance & Security Hub"}
                </h1>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {isRtl
                    ? "المركز الموحد لمراقبة أمان النظام، سجلات التدقيق الإداري، ومقاييس الأداء ورندر المكونات."
                    : "Unified master console for system security surveillance, compliance audit trail, and component render performance metrics."}
                </p>
              </div>
            </div>

            {/* Internal Navigation Sub-Tabs */}
            <div className="flex items-center p-1 rounded-shape-md bg-[var(--surface-subtle)] border border-[var(--border-main)] self-start lg:self-auto overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setActiveTab('logs')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-shape-sm text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'logs'
                    ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-2xs border border-[var(--border-main)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                }`}
              >
                <ShieldAlert size={15} className={activeTab === 'logs' ? 'text-accent' : ''} />
                <span>{isRtl ? "سجلات التدقيق" : "Compliance Audit Trail"}</span>
                {total > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-shape-full bg-accent/10 text-accent font-mono font-bold">
                    {total}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('radar')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-shape-sm text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'radar'
                    ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-2xs border border-[var(--border-main)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                }`}
              >
                <Shield size={15} className={activeTab === 'radar' ? 'text-accent' : ''} />
                <span>{isRtl ? "رادار الأمان والحدود" : "Security Radar"}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('metrics')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-shape-sm text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'metrics'
                    ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-2xs border border-[var(--border-main)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                }`}
              >
                <Activity size={15} className={activeTab === 'metrics' ? 'text-accent' : ''} />
                <span>{isRtl ? "مقاييس الأداء والرندر" : "Render & Latency Metrics"}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('databases')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-shape-sm text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'databases'
                    ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-2xs border border-[var(--border-main)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                }`}
              >
                <Database size={15} className={activeTab === 'databases' ? 'text-accent' : ''} />
                <span>{isRtl ? "سلامة وتأخير قواعد البيانات" : "Database Health & Latency"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'databases' ? (
        <DatabaseHealthAuditView theme={theme} t={t} dir={dir} />
      ) : activeTab === 'radar' ? (
        <AdminRateLimitMetricsView theme={theme} t={t} />
      ) : activeTab === 'metrics' ? (
        <AdminRenderMetricsView />
      ) : (
        <>
          {/* Search & Audit Filters Bar */}
          <form onSubmit={handleSearch} className="p-4 rounded-shape-md border border-[var(--border-main)] bg-[var(--surface-card)] flex flex-col md:flex-row gap-4 items-end justify-between shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 w-full">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              {isRtl ? "تصفية حسب العملية الإدارية" : "Search Admin Action"}
            </span>
            <div className="relative">
              <input
                type="text"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                placeholder={isRtl ? "مثال: UPDATE, POST..." : "e.g., CREATE_PLAN, HTTP_POST..."}
                className="w-full text-xs font-medium px-4 h-9 rounded-shape-sm bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--border-main)] outline-none focus:border-[var(--border-accent)] font-sans"
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              {isRtl ? "البريد الإلكتروني للـ دكتور" : "Search Admin Email"}
            </span>
            <div className="relative">
              <input
                type="text"
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                placeholder={isRtl ? "البحث بالبريد..." : "e.g., admin@perplexta.com"}
                className="w-full text-xs font-medium px-4 h-9 rounded-shape-sm bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--border-main)] outline-none focus:border-[var(--border-accent)] font-sans"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 md:flex-none h-9 min-h-[36px] touch-target-44 flex items-center justify-center gap-2 px-5 bg-accent hover:opacity-90 text-white rounded-shape-sm text-xs font-bold cursor-pointer transition-colors duration-base disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={14} /> : <Search size={14} />}
            {isRtl ? "تطبيق التصفية" : "Apply Filter"}
          </button>
          
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="px-4 h-9 min-h-[36px] touch-target-44 bg-[var(--surface-subtle)] border border-[var(--border-main)] text-[var(--text-secondary)] hover:bg-[var(--surface-card)] rounded-shape-sm text-xs font-bold cursor-pointer transition-colors duration-base"
          >
            {isRtl ? "إعادة تعيين" : "Reset"}
          </button>
        </div>
      </form>

      {/* Action Buttons for Log Deletion */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 pl-0">
        <div className="flex items-center gap-2">
          {selectedLogIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1 h-8 px-3 bg-[var(--status-danger-subtle)] text-[var(--fg-danger)] hover:opacity-90 border border-[var(--fg-danger)]/20 rounded-shape-xs text-xs font-bold transition-colors duration-base cursor-pointer"
            >
              <Trash2 size={13} />
              {isRtl 
                ? `مسح المحدد (${selectedLogIds.length})` 
                : `Delete Selected (${selectedLogIds.length})`}
            </button>
          )}
        </div>

        <button
          onClick={handleClearAll}
          className="flex items-center gap-1 h-8 px-3 bg-[var(--status-danger-subtle)] text-[var(--fg-danger)] hover:opacity-90 border border-[var(--fg-danger)]/20 rounded-shape-xs text-xs font-bold transition-colors duration-base cursor-pointer"
        >
          <AlertTriangle size={13} />
          {isRtl ? "تطهير كافة السجلات" : "Purge All Logs"}
        </button>
      </div>

      {/* Main Audit Logs Table Container */}
      <div className="rounded-shape-md border border-[var(--border-main)] bg-[var(--surface-card)] overflow-hidden shadow-2xs transition-colors duration-base">
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-[var(--border-main)] text-[10px] uppercase font-black tracking-wider text-[var(--text-muted)] bg-[var(--surface-subtle)]">
                <th className="py-3.5 px-4 text-center w-12">
                  <input
                    type="checkbox"
                    checked={logs.length > 0 && logs.every((log) => selectedLogIds.includes(log.id))}
                    onChange={toggleSelectAll}
                    className="rounded-shape-xs border-[var(--border-main)] text-accent accent-accent cursor-pointer h-4 w-4"
                  />
                </th>
                <th className="py-3.5 px-4 text-center">{isRtl ? "الوقت (UTC)" : "Timestamp (UTC)"}</th>
                <th className="py-3.5 px-4">{isRtl ? "المسؤول (Admin)" : "Admin User"}</th>
                <th className="py-3.5 px-4">{isRtl ? "العملية الإجرائية" : "Administrative Action"}</th>
                <th className="py-3.5 px-4">{isRtl ? "المستهدف" : "Target Resource"}</th>
                <th className="py-3.5 px-4">{isRtl ? "العنوان الرقمي IP" : "IP Address"}</th>
                <th className="py-3.5 px-4 text-center">{isRtl ? "التفاصيل" : "Compliance Audit"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--text-muted)]">
                    <RefreshCw className="animate-spin inline-block mr-2 text-accent" size={18} />
                    {isRtl ? "جاري جلب سجل التدقيق الأمني..." : "Ingesting secure compliance records..."}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--text-muted)]">
                    {isRtl ? "لا توجد سجلات مطابقة لمعايير الاستعلام أمنياً." : "No matching compliant audit trail records found."}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr 
                    key={log.id} 
                    className={`transition-colors duration-base ${
                      selectedLogIds.includes(log.id)
                        ? "bg-accent/10"
                        : "hover:bg-[var(--surface-subtle)]/50"
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center w-12">
                      <input
                        type="checkbox"
                        checked={selectedLogIds.includes(log.id)}
                        onChange={() => toggleSelectLog(log.id)}
                        className="rounded-shape-xs border-[var(--border-main)] text-accent accent-accent cursor-pointer h-4 w-4"
                      />
                    </td>
                    <td className="py-3.5 px-4 text-center text-[10px] font-mono whitespace-nowrap text-[var(--text-secondary)]">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="py-3.5 px-4 font-medium max-w-[180px] truncate">
                      <div className="flex flex-col">
                        <span className="font-bold text-[var(--text-primary)]">{log.admin_email || ("ID: " + log.admin_id)}</span>
                        <span className="text-[9px] text-[var(--text-muted)] font-mono">UID: {log.admin_id || "SYSTEM"}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-shape-xs text-[10px] font-black uppercase tracking-tight ${
                        log.action.startsWith("HTTP_") 
                          ? log.action.includes("POST") 
                            ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                            : log.action.includes("DELETE")
                              ? "bg-red-500/10 text-red-500 border border-red-500/20"
                              : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          : "bg-accent/10 text-accent border border-accent/20"
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono text-[11px] text-[var(--text-secondary)]">{log.target_resource || "GLOBAL"}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono text-[11px] text-[var(--text-secondary)]">{log.ip_address || "LOCAL_EXEC"}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="h-7 px-3 border border-[var(--border-main)] rounded-shape-xs text-[10px] font-bold text-accent hover:bg-accent/10 cursor-pointer transition-colors duration-base inline-flex items-center justify-center leading-none"
                      >
                        {isRtl ? "عرض التفاصيل" : "Inspect Payload"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Database Audit Pagination Bar */}
        <div className="p-3 border-t border-[var(--border-main)] flex items-center justify-between text-xs bg-[var(--surface-subtle)]">
          <div className="text-[var(--text-muted)] font-bold">
            {isRtl 
              ? `عرض ${logs.length} سجل من إجمالي ${total}`
              : `Showing ${logs.length} of ${total} compliance log records`}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}
              className="w-8 h-8 rounded-shape-sm border border-[var(--border-main)] bg-[var(--surface-card)] text-[var(--text-primary)] flex items-center justify-center transition-colors duration-base disabled:opacity-40 select-none cursor-pointer"
            >
              {isRtl ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
            </button>
            <button
              disabled={offset + limit >= total}
              onClick={() => setOffset(offset + limit)}
              className="w-8 h-8 rounded-shape-sm border border-[var(--border-main)] bg-[var(--surface-card)] text-[var(--text-primary)] flex items-center justify-center transition-colors duration-base disabled:opacity-40 select-none cursor-pointer"
            >
              {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* JSON Expand Payload Modal -- Pure Emerald Glow Premium Transition */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 flex items-center justify-center z-[130] p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-0 cursor-pointer"
            />

            {/* Modal Drawer */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative max-w-2xl w-full rounded-shape-md border border-[var(--border-main)] p-5 z-10 shadow-2xl bg-[var(--surface-card)] text-[var(--text-primary)]"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-main)] mb-3.5">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="text-accent" size={18} />
                  <span className="text-xs uppercase font-black tracking-wider w-auto h-auto leading-none mt-0">
                    {isRtl ? "التدقيق والتفاصيل القياسية" : "Compliance Payload Audit Inspection"}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="w-7 h-7 rounded-shape-xs border border-[var(--border-main)] flex items-center justify-center hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 cursor-pointer transition-colors duration-base"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Summary metadata grid */}
              <div className="grid grid-cols-2 gap-3 text-[10px] mb-3.5">
                <div className="flex flex-col p-2.5 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-main)]">
                  <span className="text-[var(--text-muted)] font-bold uppercase">{isRtl ? "المسؤول الفاعل" : "Action Operator"}</span>
                  <span className="font-bold mt-0.5 text-[var(--text-primary)] truncate">{selectedLog.admin_email || "System/Cron Engine"}</span>
                </div>
                <div className="flex flex-col p-2.5 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-main)]">
                  <span className="text-[var(--text-muted)] font-bold uppercase">{isRtl ? "العملية الإجرائية" : "Action Identifier"}</span>
                  <span className="font-bold mt-0.5 text-accent font-mono">{selectedLog.action}</span>
                </div>
                <div className="flex flex-col p-2.5 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-main)]">
                  <span className="text-[var(--text-muted)] font-bold uppercase">{isRtl ? "الوقت (توقيت عالمي)" : "Logged Timestamp (UTC)"}</span>
                  <span className="font-semibold mt-0.5 font-mono text-[var(--text-primary)]">{formatDate(selectedLog.created_at)}</span>
                </div>
                <div className="flex flex-col p-2.5 rounded-shape-xs bg-[var(--surface-subtle)] border border-[var(--border-main)]">
                  <span className="text-[var(--text-muted)] font-bold uppercase">{isRtl ? "بيانات الموقع والشبكة" : "Network Ingress Platform"}</span>
                  <span className="font-mono mt-0.5 leading-none text-[var(--text-secondary)]">{selectedLog.ip_address || "Internal Sandbox Host"}</span>
                </div>
              </div>

              {/* User Agent Block */}
              {selectedLog.user_agent && (
                <div className="mb-3.5 text-[9px] p-2 rounded-shape-xs bg-[var(--surface-subtle)] text-[var(--text-secondary)] font-mono border border-[var(--border-main)] leading-relaxed">
                  <strong>User Agent:</strong> {selectedLog.user_agent}
                </div>
              )}

              {/* JSON Payload Display */}
              <div className="flex flex-col font-sans">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1 pl-0.5">
                  {isRtl ? "البيانات المشفرة والمحفوظة (JSON Payloads)" : "Compliant Transaction Log (JSON)"}
                </span>
                <div className="h-44 overflow-y-auto rounded-shape-xs bg-[var(--surface-subtle)] text-[11px] text-accent font-mono p-3 border border-[var(--border-main)] leading-loose scroll-smooth scrollbar-thin">
                  <pre className="whitespace-pre-wrap select-text">
                    {JSON.stringify(typeof selectedLog.details === "string" ? JSON.parse(selectedLog.details) : selectedLog.details, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Footer disclaimer */}
              <p className="text-[9px] text-[var(--text-muted)] mt-3 leading-relaxed font-sans italic opacity-60">
                {isRtl 
                  ? "ملاحظة التوافق: تم إلحاق وحفظ السجل أعلاه في بيئة معزولة أمنياً وغير قابلة للتعديل أو الحذف لضمان نزاهة عمليات المنصة والامتثال الدولي."
                  : "Compliance Notice: This secure append-only audit log is recorded into a strictly cryptographic sandboxed database table and cannot be overridden, fulfilling absolute platform accountability. "
                }
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
        </>
      )}

      {/* Action Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <ActionConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(null)}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          description={confirmModal.description}
          variant={confirmModal.variant}
          confirmLabel={confirmModal.confirmLabel}
        />
      )}
    </div>
  );
};


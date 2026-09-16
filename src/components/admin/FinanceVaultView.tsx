import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAppContext } from "../../context/AppContext";
import { motion, AnimatePresence } from "motion/react";
import { getAuthHeaders, getTimeAgo, formatExactTimestamp } from "../../utils/adminUtils";
import {
  Star,
  ArrowRightLeft,
  Info,
  Globe,
  Smartphone,
  Building,
  Landmark,
  Wallet,
  CreditCard,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  Shield,
  Key,
  Database,
  Users,
  Settings,
  Plus,
  Zap,
  Server,
  Eye,
  EyeOff,
  Copy,
  Save,
  ExternalLink,
  Sliders,
  History,
  Coins,
} from "lucide-react";
import { ActionConfirmationModal } from "../ActionConfirmationModal";
import { FinanceVaultViewProps } from "./adminTypes";

export const FinanceVaultView = ({
  theme,
  t,
  dir,
  showToast,
}: {
  theme: string;
  t: (key: string, replacements?: any) => string;
  dir: string;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}) => {
  const { token, language, setIsOperationPending } = useAppContext();
  const [activeTab, setActiveTab] = useState("economy");
  const [isSaving, setIsSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string | { ar: string; en: string };
    description: string | { ar: string; en: string };
    variant?: 'danger' | 'success' | 'warning' | 'info' | 'purple';
    confirmLabel?: string | { ar: string; en: string };
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  useEffect(() => {
    setIsOperationPending(isSaving);
  }, [isSaving, setIsOperationPending]);

  const [economySettings, setEconomySettings] = useState({
    welcome_bonus_points: 600,
    referral_bonus_points: 1000,
    min_payout_usd: 20,
    min_deposit_usd: 5,
    points_per_dollar: 1000,
    conversion_rate: 0.001,
    referral_bonus_percent: 10,
    referral_activation_min_deposit: 10,
    crypto_address: "",
    bank_name: "",
    bank_recipient: "",
    bank_iban: "",
    bank_swift: "",
    paypal_email: "",
  });

  // Manual Transaction States & Verification Logic
  const [financialRequests, setFinancialRequests] = useState<{
    deposits: any[];
    withdrawals: any[];
  }>({ deposits: [], withdrawals: [] });

  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [rejectionReasons, setRejectionReasons] = useState<{ [key: string]: string }>({});
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);

  const handleReconcileAll = async () => {
    if (!token) return;
    setIsReconciling(true);
    try {
      const res = await fetch("/api/admin/finance/reconcile-all", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const { audited, discrepancies } = data.report || { audited: 0, discrepancies: 0 };
        showToast(
          language === "ar"
            ? `تم تدقيق ومطابقة الخزنة (${audited} محفظة، ${discrepancies} فروقات)`
            : `Ledger reconciliation complete (${audited} wallets, ${discrepancies} discrepancies)`,
          discrepancies > 0 ? "warning" : "success"
        );
        fetchFinancialRequests();
      } else {
        showToast(language === "ar" ? "فشل تدقيق الخزنة" : "Reconciliation failed", "error");
      }
    } catch {
      showToast(language === "ar" ? "خطأ في الشبكة" : "Network error", "error");
    } finally {
      setIsReconciling(false);
    }
  };

  const fetchFinancialRequests = async () => {
    if (!token) return;
    setIsLoadingRequests(true);
    try {
      const res = await fetch("/api/admin/financial-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFinancialRequests(data);
      }
    } catch (error) {
      console.error("Error fetching financial requests:", error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (activeTab === "financial_requests" || activeTab === "ledger") {
      fetchFinancialRequests();
    }
  }, [activeTab, token]);

  const handleDepositAction = async (id: string | number, action: "approve" | "reject") => {
    setActioningId(id.toString());
    const reason = rejectionReasons[id] || "";
    try {
      const res = await fetch(`/api/admin/deposit-requests/${id}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, rejectionReason: reason })
      });
      if (res.ok) {
        showToast(
          language === "ar"
            ? "تم معالجة وتحديث طلب الإيداع والتحويل اليدوي بنجاح!"
            : "Manual deposit request verified and processed successfully!",
          "success"
        );
        fetchFinancialRequests();
      } else {
        const err = await res.json();
        showToast(err.error || "Action failed", "error");
      }
    } catch (error) {
      showToast("Network error", "error");
    } finally {
      setActioningId(null);
    }
  };

  const handleWithdrawalAction = async (id: string | number, action: "approve" | "reject") => {
    setActioningId(id.toString());
    const reason = rejectionReasons[id] || "";
    try {
      const res = await fetch(`/api/admin/withdrawal-requests/${id}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, rejectionReason: reason })
      });
      if (res.ok) {
        showToast(
          language === "ar"
            ? "تم معالجة وتحديث طلب السحب بنجاح وعكس الموازنة بالمحفظة!"
            : "Withdrawal request processed successfully!",
          "success"
        );
        fetchFinancialRequests();
      } else {
        const err = await res.json();
        showToast(err.error || "Action failed", "error");
      }
    } catch (error) {
      showToast("Network error", "error");
    } finally {
      setActioningId(null);
    }
  };

  const handleDeleteRequest = (id: string | number, type: 'deposit' | 'withdrawal') => {
    const isAr = language === "ar";
    const confirmMessage = isAr ? "هل أنت متأكد من حذف هذا السجل نهائيًا؟" : "Are you sure you want to permanently delete this record?";

    setConfirmModal({
      isOpen: true,
      title: { ar: "حذف السجل المالي نهائياً؟", en: "Permanently Delete Financial Record?" },
      description: confirmMessage,
      variant: "danger",
      onConfirm: async () => {
        setActioningId(id.toString());
        try {
          const endpoint = type === 'deposit' 
            ? `/api/admin/deposit-requests/${id}` 
            : `/api/admin/withdrawal-requests/${id}`;
            
          const res = await fetch(endpoint, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (res.ok) {
            showToast(
              isAr
                ? "تم حذف السجل بنجاح من الدفاتر المالية!"
                : "Record successfully deleted from the financial ledger!",
              "success"
            );
            fetchFinancialRequests();
          } else {
            const err = await res.json();
            showToast(err.error || "Deletion failed", "error");
          }
        } catch (error) {
          showToast("Network error", "error");
        } finally {
          setActioningId(null);
        }
      }
    });
  };

  useEffect(() => {
    const fetchEconomySettings = async () => {
      try {
        const res = await fetch("/api/admin/economy", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setEconomySettings(data);
        }
      } catch (error) {
        console.error("Error fetching economy settings:", error);
      }
    };
    if (token) fetchEconomySettings();
  }, [token]);

  const handleSaveEconomySettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/economy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(economySettings),
      });
      if (res.ok) {
        showToast(
          language === "ar"
            ? "تم حفظ إعدادات الخزنة بنجاح"
            : "Finance settings saved successfully",
          "success",
        );
      } else {
        const errorData = await res.json();
        showToast(
          language === "ar"
            ? `فشل الحفظ: ${errorData.error}`
            : `Save failed: ${errorData.error}`,
          "error",
        );
      }
    } catch (error) {
      console.error("Error saving economy settings:", error);
      showToast(
        language === "ar" ? "خطأ في الاتصال" : "Connection Error",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWalletGateways = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/economy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(economySettings),
      });
      if (res.ok) {
        showToast(
          language === "ar"
            ? "تم حفظ إعدادات بوابات الدفع البديلة بنجاح"
            : "Alternative payment gateways saved successfully",
          "success",
        );
      } else {
        const errorData = await res.json();
        showToast(
          language === "ar"
            ? `فشل الحفظ: ${errorData.error}`
            : `Save failed: ${errorData.error}`,
          "error",
        );
      }
    } catch (error) {
      console.error("Error saving wallet gateways:", error);
      showToast(
        language === "ar" ? "خطأ في الاتصال" : "Connection Error",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const updatePointsPerDollar = (val: number) => {
    const rate = val > 0 ? 1 / val : 0;
    setEconomySettings((prev) => ({
      ...prev,
      points_per_dollar: val,
      conversion_rate: Number(rate.toFixed(6)),
    }));
  };

  const updateConversionRate = (val: number) => {
    const points = val > 0 ? 1 / val : 0;
    setEconomySettings((prev) => ({
      ...prev,
      conversion_rate: val,
      points_per_dollar: Math.round(points),
    }));
  };

  const tabs = [
    { id: "economy", label: t("economySettings"), icon: Star },
    {
      id: "ledger",
      label: language === "ar" ? "سجل المعاملات" : "Registry & Ledger",
      icon: Landmark,
    },
    {
      id: "financial_requests",
      label: language === "ar" ? "المعاملات اليدوية" : "Manual Transactions",
      icon: ArrowRightLeft,
    },
    { id: "payment_gateways", label: t("paymentGateways"), icon: CreditCard },
  ];

  const [stripeConfig, setStripeConfig] = useState<any>({
    publishableKey: "",
    secretKey: "",
    webhookSecret: "",
    isLiveMode: false,
    stripe_status: "pending",
    stripe_last_verified_at: null,
  });

  const [paypalConfig, setPaypalConfig] = useState<any>({
    clientId: "",
    clientSecret: "",
    mode: "sandbox",
    paypal_status: "pending",
    paypal_last_verified_at: null,
  });

  const fetchStripeConfig = async () => {
    try {
      const res = await fetch("/api/system/settings");
      if (res.ok) {
        const data = await res.json();
        setStripeConfig({
          publishableKey: data.stripe_publishable_key || "",
          secretKey: "", // Don't fetch secret key for security
          webhookSecret: "", // Don't fetch webhook secret for security
          isLiveMode: data.stripe_live_mode || false,
          stripe_status: data.stripe_status || "pending",
          stripe_last_verified_at: data.stripe_last_verified_at,
        });
      }
    } catch (error) {
      console.error("Error fetching stripe config:", error);
    }
  };

  const fetchPaypalConfig = async () => {
    try {
      const res = await fetch("/api/system/settings");
      if (res.ok) {
        const data = await res.json();
        setPaypalConfig({
          clientId: data.paypal_client_id || "",
          clientSecret: "", // Don't fetch secret key for security
          mode: data.paypal_mode || "sandbox",
          paypal_status: data.paypal_status || "pending",
          paypal_last_verified_at: data.paypal_last_verified_at,
        });
      }
    } catch (error) {
      console.error("Error fetching paypal config:", error);
    }
  };

  useEffect(() => {
    if (activeTab === "payment_gateways") {
      fetchStripeConfig();
      fetchPaypalConfig();
    }
  }, [activeTab]);

  const handleSavePaypalConfig = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings/paypal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paypalConfig),
      });
      if (res.ok) {
        showToast(
          language === "ar"
            ? "تم حفظ إعدادات PayPal بنجاح"
            : "PayPal settings saved successfully",
          "success",
        );
        setPaypalConfig((prev: any) => ({
          ...prev,
          clientSecret: "",
        }));
        fetchPaypalConfig();
      } else {
        const errorData = await res.json();
        showToast(
          language === "ar"
            ? `فشل الحفظ: ${errorData.error}`
            : `Save failed: ${errorData.error}`,
          "error",
        );
      }
    } catch (error) {
      showToast(
        language === "ar" ? "خطأ في الاتصال" : "Connection Error",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const [isVerifyingPaypal, setIsVerifyingPaypal] = useState(false);
  const handleVerifyPaypalConnection = async () => {
    setIsVerifyingPaypal(true);
    try {
      const res = await fetch("/api/admin/settings/paypal/verify", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          dir === "rtl"
            ? "تم التحقق من بوابة PayPal بنجاح!"
            : "PayPal gateway verified successfully!",
          "success",
        );
        fetchPaypalConfig();
      } else {
        showToast(data.error || "Verification Failed", "error");
      }
    } catch (error) {
      showToast("Connection Error", "error");
    } finally {
      setIsVerifyingPaypal(false);
    }
  };

  const handleSaveStripeConfig = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings/stripe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(stripeConfig),
      });
      if (res.ok) {
        showToast(
          language === "ar"
            ? "تم حفظ إعدادات Stripe بنجاح"
            : "Stripe settings saved successfully",
          "success",
        );
        setStripeConfig((prev: any) => ({
          ...prev,
          secretKey: "",
          webhookSecret: "",
        })); // Clear sensitive fields
        fetchStripeConfig(); // Refresh status
      } else {
        const errorData = await res.json();
        showToast(
          language === "ar"
            ? `فشل الحفظ: ${errorData.error}`
            : `Save failed: ${errorData.error}`,
          "error",
        );
      }
    } catch (error) {
      showToast(
        language === "ar" ? "خطأ في الاتصال" : "Connection Error",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const [isVerifyingStripe, setIsVerifyingStripe] = useState(false);
  const handleVerifyStripeConnection = async () => {
    setIsVerifyingStripe(true);
    try {
      const res = await fetch("/api/admin/settings/stripe/verify", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          dir === "rtl"
            ? `تم التحقق بنجاح! المتجر: ${data.business_name}`
            : `Verified successfully! Business: ${data.business_name}`,
          "success",
        );
        fetchStripeConfig();
      } else {
        showToast(data.error || "Verification Failed", "error");
      }
    } catch (error) {
      showToast("Connection Error", "error");
    } finally {
      setIsVerifyingStripe(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto relative">
      <div
        className="flex space-x-2 rtl:space-x-reverse border-b border-[var(--border-default)] pb-px overflow-x-auto custom-scrollbar"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-theme border-b-2 whitespace-nowrap ${
                isActive
                  ? "border-[var(--border-accent)] text-[var(--fg-accent)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)]"
              }`}
            >
              <Icon
                size={16}
                className={
                  isActive ? "text-[var(--fg-accent)]" : ""
                }
              />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="pt-4">
        {activeTab === "economy" && (
          <div className="space-y-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Star className="text-[var(--fg-accent)]" size={24} />
                <h3 className="text-xl font-bold text-[var(--text-primary)]">
                  {t("economySettings")}
                </h3>
              </div>
              <button
                onClick={handleSaveEconomySettings}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-md border transition-theme bg-[var(--surface-card)] border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--fg-accent)] hover:border-[var(--border-accent)] disabled:opacity-50 group"
              >
                {isSaving ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Save
                    size={18}
                    className="group-hover:scale-110 transition-transform"
                  />
                )}
                <span className="text-sm font-bold">{t("saveSettings")}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3 text-center">
                  {t("welcomeBonus")} ({t("points")})
                </label>
                <input
                  type="number"
                  value={economySettings.welcome_bonus_points || 0}
                  onChange={(e) =>
                    setEconomySettings({
                      ...economySettings,
                      welcome_bonus_points: Number(e.target.value),
                    })
                  }
                  className="w-full max-w-xs h-12 px-4 rounded-md border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] text-center text-lg font-medium focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20 focus:outline-none transition-theme"
                />
                <p className="text-xs text-[var(--text-muted)] mt-3 text-center max-w-xs">
                  {t("welcomeBonusDesc")}
                </p>
              </div>

              <div className="flex flex-col items-center">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3 text-center">
                  {t("referralBonus")} ({t("points")})
                </label>
                <input
                  type="number"
                  value={economySettings.referral_bonus_points || 0}
                  onChange={(e) =>
                    setEconomySettings({
                      ...economySettings,
                      referral_bonus_points: Number(e.target.value),
                    })
                  }
                  className="w-full max-w-xs h-12 px-4 rounded-md border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] text-center text-lg font-medium focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20 focus:outline-none transition-theme"
                />
                <p className="text-xs text-[var(--text-muted)] mt-3 text-center max-w-xs">
                  {t("referralBonusDesc")}
                </p>
              </div>

              <div className="flex flex-col items-center">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3 text-center">
                  {language === "ar"
                    ? "الحد الأدنى للسحب (دولار)"
                    : "Min Withdrawal ($)"}
                </label>
                <input
                  type="number"
                  value={economySettings.min_payout_usd || 0}
                  onChange={(e) =>
                    setEconomySettings({
                      ...economySettings,
                      min_payout_usd: Number(e.target.value),
                    })
                  }
                  className="w-full max-w-xs h-12 px-4 rounded-md border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] text-center text-lg font-medium focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20 focus:outline-none transition-theme"
                />
                <p className="text-xs text-[var(--text-muted)] mt-3 text-center max-w-xs">
                  {language === "ar"
                    ? "أقل مبلغ يمكن للمستخدم طلبه للسحب."
                    : "Minimum amount a user can request for payout."}
                </p>
              </div>

              <div className="flex flex-col items-center">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3 text-center">
                  {language === "ar"
                    ? "الحد الأدنى للإيداع (دولار)"
                    : "Min Deposit ($)"}
                </label>
                <input
                  type="number"
                  value={economySettings.min_deposit_usd || 0}
                  onChange={(e) =>
                    setEconomySettings({
                      ...economySettings,
                      min_deposit_usd: Number(e.target.value),
                    })
                  }
                  className="w-full max-w-xs h-12 px-4 rounded-md border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] text-center text-lg font-medium focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20 focus:outline-none transition-theme"
                />
                <p className="text-xs text-[var(--text-muted)] mt-3 text-center max-w-xs">
                  {language === "ar"
                    ? "أقل مبلغ يمكن للمستخدم إيداعه."
                    : "Minimum amount a user can deposit."}
                </p>
              </div>

              <div className="flex flex-col items-center">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3 text-center">
                  {language === "ar"
                    ? "تفعيل الإحالة عند إيداع ($)"
                    : "Referral Activation Deposit ($)"}
                </label>
                <input
                  type="number"
                  value={economySettings.referral_activation_min_deposit || 0}
                  onChange={(e) =>
                    setEconomySettings({
                      ...economySettings,
                      referral_activation_min_deposit: Number(e.target.value),
                    })
                  }
                  className="w-full max-w-xs h-12 px-4 rounded-md border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] text-center text-lg font-medium focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20 focus:outline-none transition-theme"
                />
                <p className="text-xs text-[var(--text-muted)] mt-3 text-center max-w-xs">
                  {language === "ar"
                    ? "المبلغ الذي يجب على الشخص المُحال إيداعه لتفعيل مكافأة الإحالة."
                    : "Amount the referred user must deposit to activate referral rewards."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="flex flex-col items-center">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3 text-center">
                  {t("pointsPerDollar")}
                </label>
                <input
                  type="number"
                  value={economySettings.points_per_dollar || 0}
                  onChange={(e) =>
                    updatePointsPerDollar(Number(e.target.value))
                  }
                  className="w-full max-w-xs h-12 px-4 rounded-md border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] text-center text-lg font-medium focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20 focus:outline-none transition-theme"
                />
                <div className="mt-3 flex flex-col items-center gap-1">
                  <p className="text-xs text-[var(--text-muted)] text-center max-w-xs">
                    {t("pointsPerDollarDesc")}
                  </p>
                  <div className="px-3 py-1 rounded-full bg-[var(--bg-accent-emphasis)]/10 border border-[var(--border-accent)]/20 text-[10px] font-bold text-[var(--fg-accent)] uppercase tracking-wider">
                    1 {t("point")} = $
                    {Number(economySettings.conversion_rate || 0).toFixed(4)}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3 text-center">
                  {t("conversionRate")}
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={economySettings.conversion_rate || 0}
                  onChange={(e) => updateConversionRate(Number(e.target.value))}
                  className="w-full max-w-xs h-12 px-4 rounded-md border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] text-center text-lg font-medium focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--border-accent)]/20 focus:outline-none transition-theme"
                />
                <div className="mt-3 flex flex-col items-center gap-1">
                  <p className="text-xs text-[var(--text-muted)] text-center max-w-xs">
                    {t("conversionRateDesc")}
                  </p>
                  <div className="px-3 py-1 rounded-full bg-[var(--bg-accent-emphasis)]/10 border border-[var(--border-accent)]/20 text-[10px] font-bold text-[var(--fg-accent)] uppercase tracking-wider">
                    {economySettings.points_per_dollar} {t("points")} = $1.00
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "ledger" && (
          <div className="space-y-6 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Landmark className="text-[var(--fg-accent)]" size={24} />
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">
                    {language === "ar" ? "دفتر الحسابات وجميع المعاملات المالية" : "System Registry & General Ledger"}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {language === "ar" ? "قائمة تدقيق شاملة لكل تدفقات الخزنة والائتمانات اللحظية." : "Comprehensive system record auditing all active credits, debits and payouts."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReconcileAll}
                disabled={isReconciling}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--bg-accent-emphasis)] text-[var(--fg-accent-contrast)] text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-theme shadow-sm self-start sm:self-auto"
              >
                <RefreshCw size={14} className={isReconciling ? "animate-spin" : ""} />
                <span>{isReconciling ? (language === "ar" ? "جاري التدقيق والمطابقة..." : "Reconciling...") : (language === "ar" ? "تدقيق ومطابقة الخزنة" : "Audit & Reconcile Vault")}</span>
              </button>
            </div>

            {isLoadingRequests ? (
              <div className="flex items-center justify-center p-12">
                <RefreshCw className="animate-spin text-[var(--fg-accent)]" size={24} />
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)]">
                <table className="w-full text-left rtl:text-right text-xs">
                  <thead className="text-[10px] font-black uppercase tracking-widest bg-[var(--surface-subtle)] text-[var(--text-muted)] border-b border-[var(--border-default)]">
                    <tr>
                      <th className="p-4">{language === "ar" ? "المستعمل" : "User"}</th>
                      <th className="p-4">{language === "ar" ? "نوع المعاملة" : "Type"}</th>
                      <th className="p-4">{language === "ar" ? "القيمة" : "Amount"}</th>
                      <th className="p-4">{language === "ar" ? "طريقة الدفع" : "Method"}</th>
                      <th className="p-4">{language === "ar" ? "حالة المعاملة" : "Status"}</th>
                      <th className="p-4">{language === "ar" ? "الرقم المرجعي" : "Reference"}</th>
                      <th className="p-4">{language === "ar" ? "تاريخ النشوء" : "Created At"}</th>
                      <th className="p-4 text-center">{language === "ar" ? "الإجراءات" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-default)] font-medium font-sans">
                    {/* Combine deposits and withdrawals into audit logs */}
                    {[
                      ...financialRequests.deposits.map(d => ({ ...d, logType: 'deposit', realAmount: d.amount })),
                      ...financialRequests.withdrawals.map(w => ({ ...w, logType: 'withdrawal', realAmount: Number(w.amount_cents) / 100 }))
                    ]
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((log: any, idx) => {
                        const isDep = log.logType === 'deposit';
                        
                        let refHash = '';
                        if (isDep) {
                          try {
                            const parsed = JSON.parse(log.proof_url);
                            refHash = parsed.reference_id || 'Direct API';
                          } catch {
                            refHash = log.proof_url || 'Direct API';
                          }
                        } else {
                          refHash = log.details || 'Pending details';
                        }

                        return (
                          <tr key={`fin-log-${log.id || idx}-${log.logType || ''}-${idx}`} className="hover:bg-[var(--surface-subtle)]/50 transition-theme">
                            <td className="p-4 text-[var(--text-primary)]">
                              <div className="font-bold">{log.user?.full_name || log.user?.username || 'Unknown'}</div>
                              <div className="text-[10px] text-[var(--text-muted)] font-normal">{log.user?.email}</div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${isDep ? 'bg-[var(--bg-accent-emphasis)]/10 text-[var(--fg-accent)]' : 'bg-amber-500/10 text-amber-500'}`}>
                                {isDep ? (language === "ar" ? "إيداع" : "DEPOSIT") : (language === "ar" ? "سحب" : "WITHDRAWAL")}
                              </span>
                            </td>
                            <td className={`p-4 font-bold font-mono text-xs ${isDep ? 'text-[var(--fg-accent)]' : 'text-rose-500'}`}>
                              {isDep ? '+' : '-'}${Number(log.realAmount).toFixed(2)}
                            </td>
                            <td className="p-4 text-[var(--text-muted)] font-mono text-[10px] uppercase">{log.method}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-widest ${
                                log.status === 'approved' || log.status === 'success' ? 'bg-[var(--bg-accent-emphasis)]/10 text-[var(--fg-accent)]' :
                                log.status === 'rejected' || log.status === 'failed' ? 'bg-rose-500/10 text-rose-500' :
                                'bg-amber-500/10 text-amber-500 animate-pulse'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="p-4 text-[var(--text-muted)] font-mono text-[10px] truncate max-w-[150px]" title={refHash}>{refHash}</td>
                            <td className="p-4 text-[var(--text-muted)] text-[10px]">{new Date(log.created_at).toLocaleString()}</td>
                            <td className="p-4 text-center">
                              {log.status !== 'pending' && (
                                <button
                                  onClick={() => handleDeleteRequest(log.id, log.logType)}
                                  className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded text-[10px] uppercase font-bold transition-theme cursor-pointer select-none"
                                  title={language === "ar" ? "مسح هذا السجل المنتهي نهائيا" : "Delete expired or finished record"}
                                >
                                  {language === "ar" ? "مسح" : "DELETE"}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    {financialRequests.deposits.length === 0 && financialRequests.withdrawals.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-[var(--text-muted)]">
                          {language === "ar" ? "لا توجد أي سجلات معاملات دفترية مسجلة حالياً." : "No records registered on the system ledger yet."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "financial_requests" && (
          <div className="space-y-8 font-sans">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="text-[var(--fg-accent)]" size={24} />
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">
                    {language === "ar" ? "معالجة طلبات الإيداع والسحب اليدوية" : "Manual Financial Verification Terminal"}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {language === "ar" ? "مراجعة إثباتات التحويل للعملات وحوالات البنوك وإتمام التحويلات الصادرة بدقة عالية." : "Audit user payment screenshots, reference IDs, and click approve to update balances onto the core ledger."}
                  </p>
                </div>
              </div>
              <button
                onClick={fetchFinancialRequests}
                disabled={isLoadingRequests}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--fg-accent)] transition-colors"
                title="Refresh requests list"
              >
                <RefreshCw size={18} className={isLoadingRequests ? "animate-spin text-[var(--fg-accent)]" : ""} />
              </button>
            </div>

            {isLoadingRequests ? (
              <div className="flex items-center justify-center p-12">
                <RefreshCw className="animate-spin text-[var(--fg-accent)]" size={24} />
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                
                {/* 1. MANUAL DEPOSITS BLOCK */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)] border-b border-[var(--border-default)] pb-2">
                    {language === "ar" ? "طلبات الإيداع اليدوي العالقة" : "Pending Manual Deposits"} ({financialRequests.deposits.filter(d => d.status === 'pending').length})
                  </h4>
                  
                  {financialRequests.deposits.filter(d => d.status === 'pending').map((request) => {
                    let refId = '';
                    let proofImg = '';
                    try {
                      const payload = JSON.parse(request.proof_url);
                      refId = payload.reference_id || 'None';
                      proofImg = payload.image_url || '';
                    } catch {
                      refId = request.proof_url || 'None';
                    }

                    return (
                      <div
                        key={request.id}
                        className="p-5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] space-y-4 transition-theme"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--fg-accent)] bg-[var(--bg-accent-emphasis)]/10 px-2 py-0.5 rounded">
                              {request.method}
                            </span>
                            <div className="font-bold text-xs text-[var(--text-primary)] mt-1 font-sans">
                              {request.user?.full_name || request.user?.username || 'Unknown customer'}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] font-sans">{request.user?.email}</div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest font-sans">Requested Value</div>
                            <div className="text-sm font-bold text-[var(--fg-accent)] font-mono">${Number(request.amount).toFixed(2)} USD</div>
                          </div>
                        </div>

                        <div className="p-3 bg-[var(--surface-subtle)] rounded border border-[var(--border-default)] text-[10px] font-mono space-y-1">
                          <div className="flex justify-between">
                            <span className="text-[var(--text-muted)]">TXID Reference:</span>
                            <span className="font-bold text-[var(--text-primary)] select-all">{refId}</span>
                          </div>
                          {proofImg && (
                            <div className="flex justify-between items-center pt-2 mt-2 border-t border-[var(--border-default)]">
                              <span className="text-[var(--text-muted)]">Attachment proof image:</span>
                              <a
                                href={`/uploads/${proofImg}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[var(--fg-accent)] font-bold flex items-center gap-1 hover:underline"
                              >
                                {language === "ar" ? "عرض إثبات التحويل ↗" : "VIEW STATEMENT ↗"}
                              </a>
                            </div>
                          )}
                          <div className="flex justify-between text-[var(--text-muted)] pt-1 text-[9px]">
                            <span>Submitted:</span>
                            <span>{new Date(request.created_at).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Actions block */}
                        <div className="space-y-3 font-sans">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDepositAction(request.id, 'approve')}
                              disabled={actioningId !== null}
                              className="flex-1 h-9 bg-[var(--bg-accent-emphasis)] hover:opacity-90 font-bold active:scale-[0.99] text-[var(--fg-accent-contrast)] rounded text-[10px] uppercase tracking-wider transition-theme"
                            >
                              {actioningId === request.id.toString() ? (
                                <RefreshCw className="animate-spin mx-auto" size={12} />
                              ) : (
                                language === "ar" ? "موافقة وتحديث الرصيد" : "APPROVE & ENROLL"
                              )}
                            </button>
                            <button
                              onClick={() => {
                                if (!rejectionReasons[request.id]) {
                                  showToast(language === "ar" ? "الرجاء إدخال سبب الرفض أولاً" : "Please provide rejection explanation first", "error");
                                  return;
                                }
                                handleDepositAction(request.id, 'reject');
                              }}
                              disabled={actioningId !== null}
                              className="px-4 h-9 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-bold active:scale-[0.99] rounded text-[10px] uppercase tracking-wider transition-theme"
                            >
                              {language === "ar" ? "رفض" : "REJECT"}
                            </button>
                          </div>
                          
                          <input
                            type="text"
                            value={rejectionReasons[request.id] || ''}
                            onChange={(e) => setRejectionReasons(prev => ({ ...prev, [request.id]: e.target.value }))}
                            placeholder={language === "ar" ? "أدخل سبب الرفض في حال نقر الزر..." : "Write rejection memo if choosing to deny..."}
                            className="w-full h-8 px-3 text-[10px] bg-[var(--surface-subtle)] border border-rose-500/20 focus:border-rose-500 rounded focus:outline-none placeholder:text-[var(--text-muted)] text-rose-500 font-sans"
                          />
                        </div>
                      </div>
                    );
                  })}

                  {financialRequests.deposits.filter(d => d.status === 'pending').length === 0 && (
                    <div className="p-8 text-center text-xs text-[var(--text-muted)] bg-[var(--surface-card)] border border-[var(--border-default)] rounded-lg">
                      {language === "ar" ? "لا توجد معاملات إيداع يدوية معلقة حالياً." : "No deposits waiting code alignment details."}
                    </div>
                  )}
                </div>

                {/* 2. MANUAL WITHDRAWALS BLOCK */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-primary)] border-b border-[var(--border-default)] pb-2">
                    {language === "ar" ? "طلبات السحب المعلقة" : "Pending User Withdrawals"} ({financialRequests.withdrawals.filter(w => w.status === 'pending').length})
                  </h4>

                  {financialRequests.withdrawals.filter(w => w.status === 'pending').map((request) => {
                    const amountUSD = Number(request.amount_cents) / 100;
                    return (
                      <div
                        key={request.id}
                        className="p-5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] space-y-4 transition-theme"
                      >
                        <div className="flex items-start justify-between font-sans">
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                              {request.method}
                            </span>
                            <div className="font-bold text-xs text-[var(--text-primary)] mt-1 font-sans">
                              {request.user?.full_name || request.user?.username || 'Unknown customer'}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] font-sans">{request.user?.email}</div>
                          </div>

                          <div className="text-right">
                            <div className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Disbursement Amount</div>
                            <div className="text-sm font-bold text-rose-500 font-mono">${amountUSD.toFixed(2)} USD</div>
                          </div>
                        </div>

                        <div className="p-3 bg-[var(--surface-subtle)] rounded border border-[var(--border-default)] text-[10px] font-mono space-y-1">
                          <div className="flex justify-between items-start">
                            <span className="text-[var(--text-muted)]">Destination Details:</span>
                            <span className="font-bold text-[var(--text-primary)] text-right max-w-[200px] select-all break-words">{request.details}</span>
                          </div>
                          <div className="flex justify-between text-[var(--text-muted)] pt-1 text-[9px] border-t border-[var(--border-default)] mt-1.5">
                            <span>Requested:</span>
                            <span>{new Date(request.created_at).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Actions block */}
                        <div className="space-y-3 font-sans">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleWithdrawalAction(request.id, 'approve')}
                              disabled={actioningId !== null}
                              className="flex-1 h-9 bg-[var(--bg-accent-emphasis)] hover:opacity-90 font-bold active:scale-[0.99] text-[var(--fg-accent-contrast)] rounded text-[10px] uppercase tracking-wider transition-theme"
                            >
                              {actioningId === request.id.toString() ? (
                                <RefreshCw className="animate-spin mx-auto" size={12} />
                              ) : (
                                language === "ar" ? "موافقة وتحويل السحب" : "APPROVE & DISBURSE"
                              )}
                            </button>
                            <button
                              onClick={() => {
                                if (!rejectionReasons[request.id]) {
                                  showToast(language === "ar" ? "الرجاء كتاية سبب الرفض لإعادة الرصيد للمستخدم" : "Please input refund rejection explanation memo", "error");
                                  return;
                                }
                                handleWithdrawalAction(request.id, 'reject');
                              }}
                              disabled={actioningId !== null}
                              className="px-4 h-9 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-bold active:scale-[0.99] rounded text-[10px] uppercase tracking-wider transition-theme"
                            >
                              {language === "ar" ? "رفض مع الإرجاع" : "REJECT & REFUND"}
                            </button>
                          </div>

                          <input
                            type="text"
                            value={rejectionReasons[request.id] || ''}
                            onChange={(e) => setRejectionReasons(prev => ({ ...prev, [request.id]: e.target.value }))}
                            placeholder={language === "ar" ? "أدخل سبب الرفض في حال رفض المعاملة..." : "Write refund explanation reason memo..."}
                            className="w-full h-8 px-3 text-[10px] bg-[var(--surface-subtle)] border border-rose-500/20 focus:border-rose-500 rounded focus:outline-none placeholder:text-[var(--text-muted)] text-rose-500 font-sans"
                          />
                        </div>
                      </div>
                    );
                  })}

                  {financialRequests.withdrawals.filter(w => w.status === 'pending').length === 0 && (
                    <div className="p-8 text-center text-xs text-[var(--text-muted)] bg-[var(--surface-card)] border border-[var(--border-default)] rounded-lg">
                      {language === "ar" ? "لا توجد طلبات سحب معلقة حالياً." : "No withdrawal requests pending action."}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}

        {activeTab === "payment_gateways" && (
          <div className="space-y-8 font-sans">
            {/* OFFICIAL AUTOMATED API PORTALS */}
            <div>
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--fg-accent)] mb-1">
                  {dir === "rtl" ? "بوابات الدفع الرسمية المؤتمتة (APIs)" : "Official Automated Payment Gateways"}
                </h4>
                <p className="text-xs text-[var(--text-muted)]">
                  {dir === "rtl" ? "تكوين المفاتيح والاتصال الفوري لمعالجة الاشتراكات وتلقي المدفوعات التلقائية." : "Configure secure API keys for automated checkouts, subscription renewals, and balance increases."}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* STRIPE OFFICIAL GATEWAY */}
                <div
                  className="p-6 md:p-8 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] flex flex-col justify-between transition-theme shadow-sm hover:border-[var(--border-accent)]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-default)]">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-[var(--bg-accent-emphasis)]/10 text-[var(--fg-accent)]">
                          <CreditCard size={24} />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-[var(--text-primary)]">{t("stripeConfig")}</h3>
                          <p className="text-xs text-[var(--text-muted)]">{t("stripeDesc")}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1.5 ${
                            stripeConfig.stripe_status === "active"
                              ? "bg-[var(--bg-accent-emphasis)]/10 text-[var(--fg-accent)] border border-[var(--border-accent)]/30"
                              : "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                          }`}
                        >
                          {stripeConfig.stripe_status === "active" ? (
                            <>
                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--fg-accent)] animate-pulse" />
                              {dir === "rtl" ? "نشط / معتمد" : "Active / Verified"}
                            </>
                          ) : (
                            <>
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              {dir === "rtl" ? "معلق" : "Pending"}
                            </>
                          )}
                        </span>
                        {stripeConfig.stripe_last_verified_at && (
                          <span className="text-[9px] text-[var(--text-muted)] font-mono">
                            {new Date(stripeConfig.stripe_last_verified_at).toLocaleDateString(
                              language === "ar" ? "ar-EG" : "en-US",
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mode Toggle Banner */}
                    <div
                      className="mb-6 p-4 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-xs font-bold mb-0.5 text-[var(--text-primary)]">{t("environment")}</h4>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {stripeConfig.isLiveMode
                            ? dir === "rtl" ? "بيئة الإنتاج الحقيقية" : "Live Production Environment"
                            : dir === "rtl" ? "بيئة الاختبار التجريبية" : "Test Sandbox Mode"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9.5px] font-bold tracking-wider ${
                            !stripeConfig.isLiveMode ? "text-amber-500" : "text-[var(--text-muted)]"
                          }`}
                        >
                          TEST
                        </span>
                        <button
                          onClick={() =>
                            setStripeConfig((prev: any) => ({
                              ...prev,
                              isLiveMode: !prev.isLiveMode,
                            }))
                          }
                          className={`relative w-11 h-5.5 rounded-full transition-colors border ${
                            stripeConfig.isLiveMode
                              ? "bg-[var(--bg-accent-emphasis)]/20 border-[var(--border-accent)]/40"
                              : "bg-[var(--surface-card)] border-[var(--border-default)]"
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-4.2 h-4.2 rounded-full shadow-md transition-theme ${
                              stripeConfig.isLiveMode ? "bg-[var(--fg-accent)]" : "bg-[var(--text-muted)]"
                            } ${
                              dir === "rtl"
                                ? stripeConfig.isLiveMode ? "right-5.5" : "right-0.5"
                                : stripeConfig.isLiveMode ? "left-5.5" : "left-0.5"
                            }`}
                          />
                        </button>
                        <span
                          className={`text-[9.5px] font-bold tracking-wider ${
                            stripeConfig.isLiveMode ? "text-[var(--fg-accent)]" : "text-[var(--text-muted)]"
                          }`}
                        >
                          LIVE
                        </span>
                      </div>
                    </div>

                    <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                          {t("publishableKey")}
                        </label>
                        <input
                          type="text"
                          value={stripeConfig.publishableKey || ""}
                          onChange={(e) =>
                            setStripeConfig({
                              ...stripeConfig,
                              publishableKey: e.target.value,
                            })
                          }
                          placeholder="pk_test_..."
                          className="w-full px-4 py-2.5 rounded-md border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-accent)]/20 focus:border-[var(--border-accent)] font-mono text-xs transition-theme"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                          {t("secretKey")}
                        </label>
                        <input
                          type="password"
                          value={stripeConfig.secretKey || ""}
                          onChange={(e) =>
                            setStripeConfig({
                              ...stripeConfig,
                              secretKey: e.target.value,
                            })
                          }
                          placeholder="sk_test_..."
                          className="w-full px-4 py-2.5 rounded-md border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-accent)]/20 focus:border-[var(--border-accent)] font-mono text-xs transition-theme"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                          {t("webhookSecret")}
                        </label>
                        <input
                          type="password"
                          value={stripeConfig.webhookSecret || ""}
                          onChange={(e) =>
                            setStripeConfig({
                              ...stripeConfig,
                              webhookSecret: e.target.value,
                            })
                          }
                          placeholder="whsec_..."
                          className="w-full px-4 py-2.5 rounded-md border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-accent)]/20 focus:border-[var(--border-accent)] font-mono text-xs transition-theme"
                          dir="ltr"
                        />
                        <p className="text-[10px] text-[var(--text-muted)] mt-2 flex items-start gap-1">
                          <Info size={12} className="text-[var(--text-muted)] mt-0.5 shrink-0" />
                          {dir === "rtl"
                            ? "مطلوب لمعالجة التنبيهات المباشرة وترقية خطط المشتركين في الخلفية تلقائياً."
                            : "Necessary to safely process events instantly and settle active subscriptions."}
                        </p>
                      </div>
                    </form>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-[var(--border-default)]">
                    <button
                      onClick={handleSaveStripeConfig}
                      disabled={isSaving}
                      className="flex-1 bg-[var(--bg-accent-emphasis)] hover:opacity-90 text-[var(--fg-accent-contrast)] py-2.5 rounded-md font-bold transition-theme hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <Save size={16} />
                      )}
                      {t("saveStripeConfig")}
                    </button>

                    <button
                      onClick={handleVerifyStripeConnection}
                      disabled={isSaving || isVerifyingStripe}
                      className="px-5 py-2.5 rounded-md font-bold transition-theme flex items-center justify-center gap-2 bg-[var(--surface-card)] text-[var(--text-muted)] border border-[var(--border-default)] hover:text-[var(--fg-accent)] hover:border-[var(--border-accent)] disabled:opacity-50 group"
                    >
                      {isVerifyingStripe ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <Zap size={16} className="group-hover:text-[var(--fg-accent)]" />
                      )}
                      {dir === "rtl" ? "تحقق المزامنة" : "Verify Sync"}
                    </button>
                  </div>
                </div>

                {/* PAYPAL OFFICIAL GATEWAY */}
                <div
                  className="p-6 md:p-8 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] flex flex-col justify-between transition-theme shadow-sm hover:border-[var(--border-accent)]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-default)]">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
                          <Globe size={24} />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-[var(--text-primary)]">
                            {dir === "rtl" ? "بوابة PayPal الرسمية" : "Official PayPal REST API"}
                          </h3>
                          <p className="text-xs text-[var(--text-muted)]">
                            {dir === "rtl" ? "تصدير ومعالجة طلبات الإيداع المباشر عبر API." : "Link official merchant APIs for checkout automation."}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1.5 ${
                            paypalConfig.paypal_status === "verified"
                              ? "bg-[var(--bg-accent-emphasis)]/10 text-[var(--fg-accent)] border border-[var(--border-accent)]/30"
                              : "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                          }`}
                        >
                          {paypalConfig.paypal_status === "verified" ? (
                            <>
                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--fg-accent)] animate-pulse" />
                              {dir === "rtl" ? "نشط / معتمد" : "Active / Verified"}
                            </>
                          ) : (
                            <>
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              {dir === "rtl" ? "معلق" : "Pending"}
                            </>
                          )}
                        </span>
                        {paypalConfig.paypal_last_verified_at && (
                          <span className="text-[9px] text-[var(--text-muted)] font-mono">
                            {new Date(paypalConfig.paypal_last_verified_at).toLocaleDateString(
                              language === "ar" ? "ar-EG" : "en-US",
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mode Toggle Banner */}
                    <div
                      className="mb-6 p-4 rounded-lg border border-[var(--border-default)] bg-[var(--surface-subtle)] flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-xs font-bold mb-0.5 text-[var(--text-primary)]">{t("environment")}</h4>
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {paypalConfig.mode === "live"
                            ? dir === "rtl" ? "بيئة الإنتاج الحقيقية" : "Live Production Environment"
                            : dir === "rtl" ? "بيئة الاختبار التجريبية" : "Test Sandbox Mode"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9.5px] font-bold tracking-wider ${
                            paypalConfig.mode !== "live" ? "text-amber-500" : "text-[var(--text-muted)]"
                          }`}
                        >
                          SANDBOX
                        </span>
                        <button
                          onClick={() =>
                            setPaypalConfig((prev: any) => ({
                              ...prev,
                              mode: prev.mode === "live" ? "sandbox" : "live",
                            }))
                          }
                          className={`relative w-11 h-5.5 rounded-full transition-colors border ${
                            paypalConfig.mode === "live"
                              ? "bg-[var(--bg-accent-emphasis)]/20 border-[var(--border-accent)]/40"
                              : "bg-[var(--surface-card)] border-[var(--border-default)]"
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-4.2 h-4.2 rounded-full shadow-md transition-theme ${
                              paypalConfig.mode === "live" ? "bg-[var(--fg-accent)]" : "bg-[var(--text-muted)]"
                            } ${
                              dir === "rtl"
                                ? paypalConfig.mode === "live" ? "right-5.5" : "right-0.5"
                                : paypalConfig.mode === "live" ? "left-5.5" : "left-0.5"
                            }`}
                          />
                        </button>
                        <span
                          className={`text-[9.5px] font-bold tracking-wider ${
                            paypalConfig.mode === "live" ? "text-[var(--fg-accent)]" : "text-[var(--text-muted)]"
                          }`}
                        >
                          LIVE
                        </span>
                      </div>
                    </div>

                    <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                          {dir === "rtl" ? "معرف العميل (Client ID)" : "PayPal Client ID"}
                        </label>
                        <input
                          type="text"
                          value={paypalConfig.clientId || ""}
                          onChange={(e) =>
                            setPaypalConfig({
                              ...paypalConfig,
                              clientId: e.target.value,
                            })
                          }
                          placeholder="Ab_..."
                          className="w-full px-4 py-2.5 rounded-md border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/40 font-mono text-xs transition-theme"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                          {dir === "rtl" ? "المفتاح السري (Client Secret)" : "PayPal Client Secret"}
                        </label>
                        <input
                          type="password"
                          value={paypalConfig.clientSecret || ""}
                          onChange={(e) =>
                            setPaypalConfig({
                              ...paypalConfig,
                              clientSecret: e.target.value,
                            })
                          }
                          placeholder="EK_..."
                          className="w-full px-4 py-2.5 rounded-md border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/40 font-mono text-xs transition-theme"
                          dir="ltr"
                        />
                      </div>
                      <div className="opacity-70">
                        <span className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                          {dir === "rtl" ? "شحن الرصيد التلقائي" : "Instant Ingestion Option"}
                        </span>
                        <p className="text-[10px] text-[var(--text-muted)] flex items-start gap-1">
                          <Info size={12} className="text-[var(--text-muted)] mt-0.5 shrink-0" />
                          {dir === "rtl"
                            ? "يتم التسوية والقيد اللحظي للأرصدة في PostgreSQL بمجرد موافقة العميل على تفويض PayPal."
                            : "Once dynamic payments are authorized, funds will be captures with immediate PostgreSQL ledger logs."}
                        </p>
                      </div>
                    </form>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-6 border-t border-[var(--border-default)]">
                    <button
                      onClick={handleSavePaypalConfig}
                      disabled={isSaving}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-md font-bold transition-theme hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                    >
                      {isSaving ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <Save size={16} />
                      )}
                      {dir === "rtl" ? "حفظ إعدادات PayPal" : "Save PayPal Config"}
                    </button>

                    <button
                      onClick={handleVerifyPaypalConnection}
                      disabled={isSaving || isVerifyingPaypal}
                      className="px-5 py-2.5 rounded-md font-bold transition-theme flex items-center justify-center gap-2 bg-[var(--surface-card)] text-[var(--text-muted)] border border-[var(--border-default)] hover:text-[var(--fg-accent)] hover:border-[var(--border-accent)] disabled:opacity-50 group"
                    >
                      {isVerifyingPaypal ? (
                        <RefreshCw size={16} className="animate-spin" />
                      ) : (
                        <Zap size={16} className="group-hover:text-[var(--fg-accent)]" />
                      )}
                      {dir === "rtl" ? "تحقق المزامنة" : "Verify Sync"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* MANUAL & ALTERNATIVE WALLET GATEWAYS CONFIG */}
            <div>
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--fg-accent)] mb-1">
                  {dir === "rtl" ? "قنوات الإيداع والتحصيل اليدوي للمحافظ" : "Alternative Manual Deposit Routes"}
                </h4>
                <p className="text-xs text-[var(--text-muted)]">
                  {dir === "rtl" ? "تعديل خيارات التحويل يدويًا خارج بوابات الدفع الفوري (العملات المشفرة، الحوالات والبريد الإلكتروني)." : "Configure custom payment instructions and wallet destinations displayed to users on the deposits tab."}
                </p>
              </div>

              <div
                className="p-6 md:p-8 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] transition-theme shadow-sm"
              >
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-[var(--border-default)]">
                  <div className="p-3 rounded-lg bg-[var(--bg-accent-emphasis)]/10 text-[var(--fg-accent)]">
                    <Landmark size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">
                      {dir === "rtl" ? "وجهات الإيداعات اليدوية" : "Alternative Manual Destinations"}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      {dir === "rtl"
                        ? "هذه الإعدادات توجه المستخدمين لإتمام الدفع خارج النظام مع إيقاظ طلبات الإيداع للتثبيت."
                        : "Define where manual deposits are sent and specify international client routing numbers."}
                    </p>
                  </div>
                </div>

                {/* 3-Column horizontal grid for perfect utilization of space */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Column 1: Crypto Wallet Setup */}
                  <div className="border border-[var(--border-accent)]/20 rounded-lg p-5 bg-[var(--bg-accent-emphasis)]/[0.02] flex flex-col justify-between space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--fg-accent)] flex items-center gap-2 mb-2">
                        <Smartphone size={16} />
                        {dir === "rtl" ? "عملة USDT المستقرة (TRC-20)" : "USDT Stablecoin (TRC-20)"}
                      </h4>
                      <p className="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">
                        {dir === "rtl"
                          ? "تلقي دفعات العملات الرقمية المستقرة وسحبها يدويًا إلى هذا العنوان بمطابقة المعاملات."
                          : "Direct crypto deposit processing. Users request transactions using ledger hashes."}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1.5">
                          {dir === "rtl" ? "عنوان محفظة USDT المتلقية" : "Receiving USDT Address (TRC-20)"}
                        </label>
                        <input
                          type="text"
                          value={economySettings.crypto_address || ""}
                          onChange={(e) =>
                            setEconomySettings({
                              ...economySettings,
                              crypto_address: e.target.value,
                            })
                          }
                          placeholder="TPh7eWpY..."
                          className="w-full px-4 py-2.5 rounded-md border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1.5 focus:ring-[var(--border-accent)] font-mono text-xs transition-theme"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Column 2: PayPal Direct Ingestion */}
                  <div className="border border-indigo-500/20 rounded-lg p-5 bg-indigo-500/[0.02] flex flex-col justify-between space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-indigo-500 flex items-center gap-2 mb-2">
                        <Globe size={16} />
                        {dir === "rtl" ? "نظام باي بال المباشر" : "Direct PayPal Ingestion"}
                      </h4>
                      <p className="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">
                        {dir === "rtl"
                          ? "بريد باي بال التجاري البديل لتلقي مبالغ الشحن مع توجيه آمن ومباشر لإتمام الدفع الفوري."
                          : "Fallback client processing using structured commercial Paypal email routing."}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1.5">
                          {dir === "rtl" ? "البريد الإلكتروني لتلقي المدفوعات" : "Business PayPal Email Address"}
                        </label>
                        <input
                          type="email"
                          value={economySettings.paypal_email || ""}
                          onChange={(e) =>
                            setEconomySettings({
                              ...economySettings,
                              paypal_email: e.target.value,
                            })
                          }
                          placeholder="paypal@yourdomain.com"
                          className="w-full px-4 py-2.5 rounded-md border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-mono text-xs transition-theme"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Custom Bank Transfer details */}
                  <div className="border border-blue-500/20 rounded-lg p-5 bg-blue-500/[0.02] space-y-4">
                    <h4 className="text-sm font-bold text-blue-500 flex items-center gap-2 mb-2">
                      <Building size={16} />
                      {dir === "rtl" ? "معلومات التحويل البنكي" : "Bank Transfer & IBAN Node Wire"}
                    </h4>

                    {/* Highly responsive interior layout for bank attributes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold tracking-wide text-[var(--text-muted)] uppercase mb-1">
                          {dir === "rtl" ? "اسم البنك" : "Bank Name"}
                        </label>
                        <input
                          type="text"
                          value={economySettings.bank_name || ""}
                          onChange={(e) =>
                            setEconomySettings({
                              ...economySettings,
                              bank_name: e.target.value,
                            })
                          }
                          placeholder="e.g. Bank Leumi"
                          className="w-full px-3 py-2 rounded-md border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:ring-1.5 focus:ring-blue-500 text-xs transition-theme"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold tracking-wide text-[var(--text-muted)] uppercase mb-1">
                          {dir === "rtl" ? "اسم المستلم / المستفيد" : "Beneficiary / Account Holder"}
                        </label>
                        <input
                          type="text"
                          value={economySettings.bank_recipient || ""}
                          onChange={(e) =>
                            setEconomySettings({
                              ...economySettings,
                              bank_recipient: e.target.value,
                            })
                          }
                          placeholder="e.g. Perplexta Platforms"
                          className="w-full px-3 py-2 rounded-md border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:ring-1.5 focus:ring-blue-500 text-xs transition-theme"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold tracking-wide text-[var(--text-muted)] uppercase mb-1">
                          {dir === "rtl" ? "رمز السويفت SWIFT / BIC" : "SWIFT / BIC Code"}
                        </label>
                        <input
                          type="text"
                          value={economySettings.bank_swift || ""}
                          onChange={(e) =>
                            setEconomySettings({
                              ...economySettings,
                              bank_swift: e.target.value,
                            })
                          }
                          placeholder="PPLXIL33"
                          className="w-full px-3 py-2 rounded-md border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:ring-1.5 focus:ring-blue-500 text-xs font-mono transition-theme"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold tracking-wide text-[var(--text-muted)] uppercase mb-1">
                          {dir === "rtl" ? "رقم الحساب أو الآيبان" : "IBAN / Account Number"}
                        </label>
                        <input
                          type="text"
                          value={economySettings.bank_iban || ""}
                          onChange={(e) =>
                            setEconomySettings({
                              ...economySettings,
                              bank_iban: e.target.value,
                            })
                          }
                          placeholder="IL..."
                          className="w-full px-3 py-2 rounded-md border bg-[var(--surface-subtle)] border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:ring-1.5 focus:ring-blue-500 text-xs font-mono transition-theme"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-[var(--border-default)] flex justify-end">
                  <button
                    onClick={handleSaveWalletGateways}
                    disabled={isSaving}
                    className="w-full sm:w-auto px-8 bg-[var(--bg-accent-emphasis)] hover:opacity-90 text-[var(--fg-accent-contrast)] py-3 rounded-md font-bold transition-theme hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
                  >
                    {isSaving ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    {dir === "rtl" ? "حفظ تكوين بوابات المحفظة البديلة" : "Save Alternative Gateways"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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

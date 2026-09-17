import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Palette, Globe } from "lucide-react";
import { ThemeStudioView } from "../ThemeStudioView";
import { SeoCenterView } from "../../SeoCenterView";

export type DesignSeoTab = "theme" | "seo";

interface DesignSeoHubViewProps {
  theme: string;
  t: (key: string, replacements?: any) => string;
  dir: string;
  language: string;
  token: string | null;
  showToast: (message: string, type?: "success" | "error" | "warning" | "info" | any) => void;
  initialTab?: DesignSeoTab;
  onTabChange?: (tab: DesignSeoTab) => void;
}

export const DesignSeoHubView: React.FC<DesignSeoHubViewProps> = ({
  theme,
  t,
  dir,
  language,
  token,
  showToast,
  initialTab = "theme",
  onTabChange,
}) => {
  const [activeTab, setActiveTab] = useState<DesignSeoTab>(initialTab);
  const isRtl = language === "ar";

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabSwitch = (tab: DesignSeoTab) => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const tabs: { id: DesignSeoTab; labelAr: string; labelEn: string; icon: React.ReactNode }[] = [
    {
      id: "theme",
      labelAr: "استوديو الثيمات وتوكنز الألوان",
      labelEn: "Theme Studio & Color Tokens",
      icon: <Palette size={16} />,
    },
    {
      id: "seo",
      labelAr: "مركز محركات البحث والميتاداتا (SEO)",
      labelEn: "SEO Audit, Social Cards & JSON-LD",
      icon: <Globe size={16} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Sub-Tabs Navigation Bar */}
      <div className="w-full flex items-center justify-between border-b border-[var(--border-default)] pb-3">
        <div className="flex items-center gap-1.5 p-1 rounded-[var(--radius-md)] bg-[var(--surface-subtle)] border border-[var(--border-default)] overflow-x-auto max-w-full custom-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={`design-seo-tab-${tab.id}`}
                type="button"
                onClick={() => handleTabSwitch(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 min-h-[38px] rounded-[var(--radius-sm)] text-xs font-bold transition-all whitespace-nowrap cursor-pointer touch-target-44 ${
                  isActive
                    ? "bg-[var(--surface-card)] text-[var(--fg-accent)] shadow-xs border border-[var(--border-accent)]/30 font-black"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)]/50 border border-transparent"
                }`}
              >
                <span className={isActive ? "text-[var(--fg-accent)]" : "text-[var(--text-muted)]"}>
                  {tab.icon}
                </span>
                <span>{isRtl ? tab.labelAr : tab.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Display */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={`design-seo-view-${activeTab}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {activeTab === "theme" && (
              <ThemeStudioView t={t} showToast={showToast} token={token} language={language} />
            )}
            {activeTab === "seo" && (
              <SeoCenterView theme={theme} t={t} dir={dir} language={language} showToast={showToast} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

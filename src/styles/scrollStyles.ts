// Unified scroll styles — المصدر الوحيد للتمرير في المشروع
export const SCROLL_STYLES = {
  // Sidebar scroll (AdminSidebar, Sidebar)
  sidebar: 'overflow-y-auto custom-scrollbar scroll-smooth',
  
  // Dropdown menus (Tools, Settings, History)
  dropdown: 'overflow-y-auto custom-scrollbar scroll-smooth overscroll-contain',
  
  // Modal content
  modal: 'overflow-y-auto custom-scrollbar scroll-smooth flex-1',
  
  // Chat messages
  chat: 'overflow-y-auto custom-scrollbar scroll-smooth flex-1',
  
  // Full page scroll
  page: 'overflow-y-auto custom-scrollbar scroll-smooth h-full',
  
  // Limited height scroll
  limited: (maxHeight: string = '70vh') => 
    `max-h-[${maxHeight}] overflow-y-auto custom-scrollbar scroll-smooth`,
};

// Hover styles موحدة - Quiet & Professional Pattern (بدون خلفيات صاخبة)
export const HOVER_STYLES = {
  // Sidebar items: Quiet hover (Text color shift only, no aggressive background)
  sidebarItem: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-150 border-transparent hover:border-[var(--border-subtle)] bg-transparent',
  
  // Dropdown items: Subtle highlight
  dropdownItem: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]/20 transition-colors',
  
  // Icon buttons
  iconButton: 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]/40 transition-colors p-1.5 rounded-[var(--radius-sm)]',
  
  // Close buttons
  closeButton: 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)]/40 transition-colors p-1 rounded-[var(--radius-sm)]',
};

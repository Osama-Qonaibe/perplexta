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

// Hover styles موحدة
export const HOVER_STYLES = {
  // Sidebar items
  sidebarItem: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] hover:border-[var(--border-default)] border-transparent transition-all duration-150',
  
  // Dropdown items
  dropdownItem: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors',
  
  // Icon buttons
  iconButton: 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors p-1.5 rounded-[var(--radius-sm)]',
  
  // Close buttons
  closeButton: 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors p-1 rounded-[var(--radius-sm)]',
};

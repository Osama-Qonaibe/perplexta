export const SCROLL_STYLES = {
  sidebar: 'overflow-y-auto custom-scrollbar scroll-smooth',
  dropdown: 'overflow-y-auto custom-scrollbar scroll-smooth overscroll-contain',
  modal: 'overflow-y-auto custom-scrollbar scroll-smooth flex-1',
  chat: 'overflow-y-auto custom-scrollbar scroll-smooth flex-1',
  page: 'overflow-y-auto custom-scrollbar scroll-smooth h-full',
  limited: (maxHeight: string = '70vh') => 
    `max-h-[${maxHeight}] overflow-y-auto custom-scrollbar scroll-smooth`,
};

export const HOVER_STYLES = {
  sidebarItem: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] hover:border-[var(--border-default)] border-transparent transition-all duration-150',
  dropdownItem: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors',
  iconButton: 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors p-1.5 rounded-[var(--radius-sm)]',
  closeButton: 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors p-1 rounded-[var(--radius-sm)]',
};

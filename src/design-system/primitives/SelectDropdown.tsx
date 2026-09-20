/**
 * 🎛️ PERPLEXTA DESIGN SYSTEM — SELECT DROPDOWN PRIMITIVE
 * 
 * Sovereign custom dropdown selector replacing native <select> elements.
 * Features:
 * - Sovereign surface tokens (bg-[var(--surface-card)], border-[var(--border-default)])
 * - Fluid motion transitions with AnimatePresence
 * - Full Arabic (RTL) and English (LTR) bidirectional support
 * - Search filter support for long option sets
 * - Badges, NEW chips, Locked icons, and custom option renderers
 * - Full keyboard navigation (Arrow Up/Down, Enter, Space, Escape)
 * - Click-outside & Window edge boundary collision awareness
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check, Search, Lock } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

export interface SelectOption<T = string> {
  value: T;
  label: React.ReactNode;
  labelEn?: string;
  labelAr?: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  isNew?: boolean;
  isLocked?: boolean;
  disabled?: boolean;
}

export interface SelectDropdownProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  dir?: 'rtl' | 'ltr';
  label?: React.ReactNode;
  className?: string;
  triggerClassName?: string;
  popoverClassName?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'card' | 'subtle' | 'ghost';
  id?: string;
  name?: string;
  maxHeight?: string;
}

export function SelectDropdown<T extends string | number = string>({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  dir,
  label,
  className = '',
  triggerClassName = '',
  popoverClassName = '',
  searchable = false,
  searchPlaceholder,
  size = 'md',
  variant = 'default',
  id,
  name,
  maxHeight = 'max-h-64',
}: SelectDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(() => {
    return options.find(opt => String(opt.value) === String(value));
  }, [options, value]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase().trim();
    return options.filter(opt => {
      const labelStr = typeof opt.label === 'string' ? opt.label : '';
      const enStr = opt.labelEn || '';
      const arStr = opt.labelAr || '';
      const valStr = String(opt.value);
      return (
        labelStr.toLowerCase().includes(query) ||
        enStr.toLowerCase().includes(query) ||
        arStr.toLowerCase().includes(query) ||
        valStr.toLowerCase().includes(query)
      );
    });
  }, [options, searchQuery]);

  // Handle outside clicks to close the popover
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Calculate top/bottom placement based on screen position
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 240 && rect.top > 240) {
        setPlacement('top');
      } else {
        setPlacement('bottom');
      }

      if (searchable) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
    }
  }, [isOpen, searchable]);

  // Toggle Dropdown
  const handleToggle = useCallback(() => {
    if (disabled) return;
    triggerHaptic('selection');
    setIsOpen(prev => !prev);
    setSearchQuery('');
    setFocusedIndex(-1);
  }, [disabled]);

  // Select item
  const handleSelect = useCallback((opt: SelectOption<T>) => {
    if (opt.disabled || opt.isLocked) return;
    triggerHaptic('light');
    onChange(opt.value);
    setIsOpen(false);
    setSearchQuery('');
    triggerRef.current?.focus();
  }, [onChange]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleToggle();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[focusedIndex]);
      }
    }
  };

  // Size styling tokens
  const sizeClasses = {
    sm: 'h-8 px-2.5 text-xs',
    md: 'h-9 px-3 text-xs',
    lg: 'h-10 px-3.5 text-sm',
  }[size];

  // Variant styling tokens
  const variantClasses = {
    default: 'bg-[var(--surface-card)] border-[var(--border-default)] hover:border-[var(--border-strong)] text-[var(--text-primary)]',
    card: 'bg-[var(--surface-card)] border-[var(--border-default)] hover:border-[var(--border-strong)] text-[var(--text-primary)] shadow-xs',
    subtle: 'bg-[var(--surface-subtle)] border-[var(--border-subtle)] hover:border-[var(--border-default)] text-[var(--text-primary)]',
    ghost: 'bg-transparent border-transparent hover:bg-[var(--surface-subtle)] text-[var(--text-primary)]',
  }[variant];

  return (
    <div 
      ref={containerRef} 
      className={`relative inline-block w-full text-start ${className}`}
      dir={dir}
    >
      {label && (
        <label 
          htmlFor={id} 
          className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider block mb-1.5 select-none"
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        id={id}
        name={name}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`
          w-full flex items-center justify-between gap-2 rounded-shape-sm border font-semibold
          transition-all duration-150 cursor-pointer select-none outline-none
          focus:ring-2 focus:ring-[var(--border-accent)]/20 focus:border-[var(--border-accent)]/50
          ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}
          ${isOpen ? 'ring-2 ring-[var(--border-accent)]/20 border-[var(--border-accent)]/50' : ''}
          ${sizeClasses}
          ${variantClasses}
          ${triggerClassName}
        `}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0 flex items-center justify-center w-4 h-4 text-[var(--fg-accent)]">
              {selectedOption.icon}
            </span>
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : (
              <span className="text-[var(--text-muted)] font-normal">{placeholder || '—'}</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedOption?.badge && (
            <span className="text-[9px]">{selectedOption.badge}</span>
          )}
          <ChevronDown
            size={14}
            className={`text-[var(--text-muted)] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[var(--fg-accent)]' : ''
            }`}
          />
        </div>
      </button>

      {/* Floating Popover Options List */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.10, ease: [0.16, 1, 0.3, 1] }}
            style={{
              transformOrigin: placement === 'bottom' ? 'top center' : 'bottom center',
            }}
            className={`
              absolute z-[250] left-0 right-0 p-1 rounded-shape-md
              bg-[var(--surface-card)] border border-[var(--border-default)]
              shadow-2xl backdrop-blur-xl flex flex-col gap-0.5 overflow-hidden overscroll-contain
              ${placement === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5'}
              ${popoverClassName}
            `}
            role="listbox"
          >
            {/* Search Input if enabled or options length is large */}
            {(searchable || options.length > 7) && (
              <div className="p-1 border-b border-[var(--border-subtle)] mb-0.5">
                <div className="relative flex items-center">
                  <Search size={12} className="absolute start-2 text-[var(--text-muted)] pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setFocusedIndex(0);
                    }}
                    placeholder={searchPlaceholder || (dir === 'rtl' ? 'بحث...' : 'Search...')}
                    className="w-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-xs)] ps-7 pe-2 py-1 text-[11px] font-sans text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-accent)]/40"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            {/* Options List Container */}
            <div 
              ref={listRef}
              className={`flex flex-col gap-0.5 overflow-y-auto custom-scrollbar scroll-smooth overscroll-contain ${maxHeight}`}
            >
              {filteredOptions.length === 0 ? (
                <div className="py-3 px-2 text-center text-[11px] text-[var(--text-muted)]">
                  {dir === 'rtl' ? 'لا توجد نتائج مطابقة' : 'No matching options'}
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = String(opt.value) === String(value);
                  const isFocused = focusedIndex === idx;

                  return (
                    <button
                      key={`${String(opt.value)}-${idx}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={opt.disabled || opt.isLocked}
                      onClick={() => handleSelect(opt)}
                      onMouseEnter={() => setFocusedIndex(idx)}
                      className={`
                        w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-shape-sm
                        transition-all duration-150 text-[11.5px] font-sans font-medium text-start select-none
                        ${opt.disabled || opt.isLocked ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}
                        ${isSelected 
                          ? 'bg-[var(--bg-accent-muted)] border border-[var(--border-accent)] text-[var(--fg-accent)] font-bold' 
                          : isFocused
                            ? 'bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-transparent'
                            : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] border border-transparent'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {opt.icon && (
                          <span className={`shrink-0 flex items-center justify-center w-3.5 h-3.5 ${
                            isSelected ? 'text-[var(--fg-accent)]' : 'text-[var(--text-muted)]'
                          }`}>
                            {opt.icon}
                          </span>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className={`truncate leading-tight ${isSelected ? 'text-[var(--fg-accent)] font-bold' : ''}`}>
                            {opt.label}
                          </span>
                          {opt.description && (
                            <span className="text-[10px] text-[var(--text-muted)] truncate">
                              {opt.description}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {opt.isLocked && (
                          <Lock size={11} className="text-amber-500 shrink-0" />
                        )}

                        {opt.isNew && !opt.isLocked && (
                          <span className="px-1.5 py-[1px] rounded-[var(--radius-xs)] bg-[var(--surface-subtle)] border border-[var(--border-default)] text-[8px] font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                            NEW
                          </span>
                        )}

                        {opt.badge && !opt.isLocked && (
                          <span className="text-[9px]">{opt.badge}</span>
                        )}

                        {isSelected && (
                          <Check size={13} className="text-[var(--fg-accent)] shrink-0 stroke-[2.5]" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

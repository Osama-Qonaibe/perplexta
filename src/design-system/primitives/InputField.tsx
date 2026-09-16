/**
 * 📝 PERPLEXTA DESIGN SYSTEM — INPUT FIELD PRIMITIVE
 * 
 * Standardized form text input with label, leading/trailing icons, error state,
 * and rounded-lg (8px) geometry.
 */

import React, { forwardRef } from 'react';

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(({
  label,
  icon,
  trailingIcon,
  error,
  helperText,
  containerClassName = '',
  className = '',
  disabled,
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? `input-${String(label).toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`flex flex-col gap-1 w-full ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-slate-300 select-none">
          {label}
        </label>
      )}
      
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3 inset-y-0 flex items-center pointer-events-none text-slate-400 shrink-0">
            {icon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`
            w-full h-9 px-3 text-xs sm:text-sm font-medium
            bg-[#0d131f] text-slate-100 placeholder-slate-500
            border border-slate-800/90 rounded-lg
            focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40
            transition-all duration-150 ease-out
            disabled:opacity-50 disabled:cursor-not-allowed
            ${icon ? 'pl-9' : ''}
            ${trailingIcon ? 'pr-9' : ''}
            ${error ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/30' : ''}
            ${className}
          `}
          {...props}
        />

        {trailingIcon && (
          <div className="absolute right-3 inset-y-0 flex items-center text-slate-400 shrink-0">
            {trailingIcon}
          </div>
        )}
      </div>

      {error ? (
        <span className="text-[11px] font-medium text-rose-400">{error}</span>
      ) : helperText ? (
        <span className="text-[11px] font-medium text-slate-400">{helperText}</span>
      ) : null}
    </div>
  );
});

InputField.displayName = 'InputField';

import React, { useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { useFloating, autoUpdate, offset, flip, shift, useClick, useDismiss, useRole, useInteractions, FloatingPortal } from '@floating-ui/react';

interface Option {
  label: string | React.ReactNode;
  value: string;
}

interface ElegantSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ElegantSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  className = '',
  disabled = false
}: ElegantSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    strategy: 'fixed',
    placement: 'bottom-start',
    middleware: [
      offset(4),
      flip({ fallbackAxisSideDirection: 'end' }),
      shift({ padding: 8 })
    ],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'listbox' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        ref={refs.setReference}
        disabled={disabled}
        {...getReferenceProps()}
        className="w-full bg-[#FBF9F5] border border-[rgba(23,59,48,0.15)] rounded-2xl px-4 py-3 text-xs font-bold text-[#171A18] flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#173B30] disabled:opacity-50 transition-colors"
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
      </button>

      <FloatingPortal>
        <AnimatePresence>
          {isOpen && (
            <div
              ref={refs.setFloating}
              style={{ ...floatingStyles, width: refs.domReference.current?.offsetWidth || 'auto', zIndex: 9999 }}
              {...getFloatingProps()}
            >
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="w-full bg-white border border-zinc-100 rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  {options.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-xs font-bold transition-colors cursor-pointer ${
                        value === opt.value
                          ? 'bg-[#173B30] text-[#F5F1E8]'
                          : 'text-[#171A18] hover:bg-[#F5F1E8]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  {options.length === 0 && (
                    <div className="px-4 py-3 text-xs text-[#6E746F] italic">
                      Tidak ada opsi
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </div>
  );
}

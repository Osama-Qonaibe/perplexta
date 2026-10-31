import React from 'react';
import { Check } from 'lucide-react';

export interface StudioTodoItem {
  id: string;
  title: string;
  status: 'completed' | 'in_progress' | 'pending';
}

interface StudioTodoListProps {
  todos: StudioTodoItem[];
  language?: string;
}

/**
 * Mirrors `src/tools/chat_ui/todo.js` from `@Osama-Qonaibe/builder`:
 * - Completed items sorted first, followed by in_progress and pending items.
 * - Completed items show a green check box (#029802).
 * - In-progress item shows an animated text shimmer.
 * - Pending items show a subtle unchecked square.
 */
export const StudioTodoList: React.FC<StudioTodoListProps> = ({ todos }) => {
  if (!todos || todos.length === 0) return null;

  // Sort completed items first, keeping relative order within each group (exact match to todo.js line 18)
  const sortedTodos = [
    ...todos.filter(t => t.status === 'completed'),
    ...todos.filter(t => t.status !== 'completed')
  ];

  return (
    <div className="w-full rounded-shape-md bg-[var(--surface-card)] border border-[var(--border-default)] p-3 space-y-2 font-sans shadow-2xs my-1.5">
      {sortedTodos.map(todo => {
        const isCompleted = todo.status === 'completed';
        const isInProgress = todo.status === 'in_progress';

        return (
          <div
            key={todo.id}
            className="flex items-center gap-2.5 text-xs leading-snug px-1 py-0.5 transition-all"
          >
            {isCompleted ? (
              <span
                className="w-3.5 h-3.5 rounded-[3px] flex items-center justify-center shrink-0 border border-[#029802] bg-[#029802]/10 text-[#029802]"
                aria-hidden="true"
              >
                <Check size={10} strokeWidth={3} />
              </span>
            ) : (
              <span
                className={`w-3.5 h-3.5 rounded-[3px] shrink-0 border ${
                  isInProgress
                    ? 'border-blue-500 bg-blue-500/10 animate-pulse'
                    : 'border-[var(--border-default)] bg-[var(--surface-subtle)]'
                }`}
                aria-hidden="true"
              />
            )}

            <span
              className={`break-words ${
                isCompleted
                  ? 'text-[var(--text-secondary)]'
                  : isInProgress
                  ? 'font-semibold text-blue-500 animate-pulse'
                  : 'text-[var(--text-primary)]'
              }`}
            >
              {todo.title}
            </span>
          </div>
        );
      })}
    </div>
  );
};

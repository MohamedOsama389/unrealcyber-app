import type { ReactantSelection } from "../app/reactionState";

interface ReactantVisualCardProps {
  title: string;
  reactant: ReactantSelection | null;
  count: number;
  onPick: () => void;
  onClear: () => void;
  onCountChange: (count: number) => void;
}

export function ReactantVisualCard({ title, reactant, count, onPick, onClear, onCountChange }: ReactantVisualCardProps) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onPick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onPick();
        }
      }}
      className="relative cursor-pointer rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-500"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{title}</span>
        {reactant ? (
          <button
            type="button"
            aria-label={`Clear ${title}`}
            onClick={(event) => {
              event.stopPropagation();
              onClear();
            }}
            className="grid size-7 place-items-center rounded-full border border-slate-300 text-sm text-slate-600 hover:bg-slate-100"
          >
            x
          </button>
        ) : null}
      </div>

      {!reactant ? (
        <div className="grid min-h-36 place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center">
          <div>
            <p className="text-4xl font-bold text-slate-300">+</p>
            <p className="text-sm text-slate-500">Select reactant</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3 text-center">
          <p className="text-6xl font-bold text-slate-900">{reactant.formula}</p>
          <p className="text-sm text-slate-500">{reactant.kind}</p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onCountChange(count - 1);
              }}
              className="grid size-8 place-items-center rounded border border-slate-300 bg-white text-lg font-bold text-slate-700 hover:bg-slate-100"
              aria-label="Decrease count"
            >
              -
            </button>
            <span className="min-w-16 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
              x{count}
            </span>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onCountChange(count + 1);
              }}
              className="grid size-8 place-items-center rounded border border-slate-300 bg-white text-lg font-bold text-slate-700 hover:bg-slate-100"
              aria-label="Increase count"
            >
              +
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

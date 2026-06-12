// Barre de progression réutilisable. Affiche value/max en pourcentage.
export default function ProgressBar({
  value, max, className = "", showLabel = true, color = "bg-indigo-500",
}: {
  value: number;
  max: number;
  className?: string;
  showLabel?: boolean;
  color?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-zinc-500 tabular-nums shrink-0">{pct}%</span>
      )}
    </div>
  );
}

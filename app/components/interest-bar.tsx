interface InterestBarProps {
  genreName: string;
  interestLevel: number;
}

export function InterestBar({ genreName, interestLevel }: InterestBarProps) {
  const widthPercent = ((6 - interestLevel) / 5) * 100;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-44 shrink-0 truncate" title={genreName}>
        {genreName}
      </span>
      <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
        <div
          className="h-full bg-primary/70 rounded transition-all duration-300"
          style={{ width: `${widthPercent}%` }}
        />
      </div>
      <span className="text-sm font-mono w-6 text-right text-muted-foreground">
        {interestLevel}
      </span>
    </div>
  );
}

export function ScaleLegend() {
  return (
    <div className="text-xs text-muted-foreground border border-border rounded px-3 py-2 bg-muted/50">
      Scale: 1 = highest interest, 5 = none
    </div>
  );
}

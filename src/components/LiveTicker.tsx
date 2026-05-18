import { tickerEvents } from "@/data/event";

export function LiveTicker() {
  const items = [...tickerEvents, ...tickerEvents];
  return (
    <div className="bg-foreground py-3 overflow-hidden border-y border-white/10">
      <div className="flex whitespace-nowrap" style={{ animation: "ticker 40s linear infinite" }}>
        <div className="flex gap-10 items-center px-5 shrink-0">
          {items.map((ev, i) => (
            <span key={i} className="flex items-center gap-10 shrink-0">
              <span
                className={`font-mono text-xs font-bold tracking-widest uppercase ${
                  i % 3 === 0 ? "text-accent" : i % 3 === 1 ? "text-white" : "text-primary"
                }`}
              >
                {ev}
              </span>
              <span className="size-1 bg-white/20 rounded-full" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

type Props = {
  lines: string[];
  translations?: Record<string, string[]>;
  speaker: string;
  livestream?: { provider: string; url: string; viewers: number };
};

/** Drips words one-by-one from the current line; older lines stack above when expanded. */
export function LiveTranscript({ lines, translations, speaker, livestream }: Props) {
  const [lang, setLang] = useState<"en" | string>("en");
  const [expanded, setExpanded] = useState(false);

  const active = useMemo(() => {
    if (lang !== "en" && translations?.[lang]) return translations[lang];
    return lines;
  }, [lang, lines, translations]);

  const [lineIdx, setLineIdx] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const tickRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset progress when language changes so words sync to the new line.
  useEffect(() => {
    setLineIdx(0);
    setWordCount(0);
  }, [lang]);

  // Word-by-word ticker
  useEffect(() => {
    const currentWords = active[lineIdx]?.split(" ") ?? [];
    if (wordCount < currentWords.length) {
      tickRef.current = setTimeout(() => setWordCount((w) => w + 1), 220 + Math.random() * 180);
    } else {
      // Pause at end of line, then advance (loop at the end).
      tickRef.current = setTimeout(() => {
        setLineIdx((i) => (i + 1) % active.length);
        setWordCount(0);
      }, 1400);
    }
    return () => {
      if (tickRef.current) clearTimeout(tickRef.current);
    };
  }, [wordCount, lineIdx, active]);

  const currentWords = active[lineIdx]?.split(" ") ?? [];
  const visible = currentWords.slice(0, wordCount).join(" ");
  const ghost = currentWords.slice(wordCount).join(" ");

  const otherLang = lang === "en" ? "es" : "en";
  const canTranslate = !!translations?.es;

  return (
    <div className="rounded-2xl ring-1 ring-border overflow-hidden bg-foreground text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
        <div className="flex items-center gap-2 min-w-0">
          <span className="size-1.5 bg-primary rounded-full animate-pulse shrink-0" />
          <div className="text-[10px] font-display italic uppercase tracking-widest text-white/60 truncate">
            Live transcript · {speaker}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {canTranslate && (
            <button
              onClick={() => setLang(otherLang)}
              className="px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[9px] font-bold uppercase tracking-widest transition-colors"
              title={lang === "en" ? "Translate to Spanish" : "Back to English"}
            >
              {lang === "en" ? "🌐 ES" : "🌐 EN"}
            </button>
          )}
          <button
            onClick={() => setExpanded((e) => !e)}
            className="px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[9px] font-bold uppercase tracking-widest transition-colors"
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      {/* Livestream chip */}
      {livestream && (
        <a
          href={livestream.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 px-4 py-2.5 bg-primary/15 hover:bg-primary/25 transition-colors border-b border-white/10"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-7 rounded-full bg-primary grid place-items-center shrink-0">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold truncate">Watch on {livestream.provider}</div>
              <div className="text-[9px] text-white/50 font-display italic">
                {livestream.viewers.toLocaleString()} watching
              </div>
            </div>
          </div>
          <div className="text-[10px] font-bold text-primary uppercase tracking-widest shrink-0">Open ↗</div>
        </a>
      )}

      {/* Body */}
      <div className="px-4 py-3">
        <AnimatePresence initial={false} mode="wait">
          {expanded ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              {/* show previous lines + current */}
              {active.slice(0, lineIdx).map((l, i) => (
                <div key={i} className="text-xs text-white/40 leading-relaxed">
                  {l}
                </div>
              ))}
              <div className="text-sm leading-relaxed">
                <span className="text-white">{visible}</span>
                <span className="text-white/20"> {ghost}</span>
                <span className="inline-block w-1.5 h-3.5 align-middle ml-0.5 bg-primary animate-pulse" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="single"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm leading-snug truncate"
              title={active[lineIdx]}
            >
              <span className="text-white">{visible}</span>
              <span className="text-white/20"> {ghost}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

import { motion } from "motion/react";
import type { Person } from "@/data/event";

type Props = {
  person: Person;
  tilt?: boolean;
  className?: string;
  serial?: string;
};

export function IdentityCard({ person, tilt = false, className = "", serial = "001" }: Props) {
  return (
    <motion.div
      whileHover={{ rotate: 0, scale: 1.03 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{ rotate: tilt ? -8 : 0 }}
      className={`group relative w-72 aspect-[2/3] bg-foreground rounded-[24px] shadow-2xl overflow-hidden ring-1 ring-white/10 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/50 via-primary/10 to-transparent" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(217,249,157,0.4), transparent 40%), radial-gradient(circle at 80% 80%, rgba(124,58,237,0.4), transparent 40%)",
        }}
      />
      <div className="relative p-6 h-full flex flex-col justify-between text-white">
        <div className="flex justify-between items-start">
          <div
            className="size-12 rounded-full ring-1 ring-white/20 grid place-items-center font-bold text-sm"
            style={{ background: person.color }}
          >
            {person.initials}
          </div>
          <div className="font-mono text-[10px] text-white/40 tracking-widest uppercase">
            ID // {serial}
          </div>
        </div>
        <div>
          <div className="font-bold text-2xl mb-1 tracking-tight">{person.name}</div>
          <div className="text-white/60 text-xs mb-3 italic">"{person.oneLiner}"</div>
          <div className="text-[10px] text-white/40 uppercase font-mono mb-1 tracking-widest">Intent</div>
          <div className="text-sm text-white/80 mb-4">{person.intent}</div>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {person.tags.map((t) => (
              <span key={t} className="px-2 py-0.5 bg-white/10 text-[9px] text-white/70 font-bold uppercase rounded tracking-widest">
                {t}
              </span>
            ))}
          </div>
          <div className="flex gap-3 text-[10px] text-white/50 font-mono pt-3 border-t border-white/10">
            {person.socials.linkedin && <span>in {person.socials.linkedin}</span>}
            {person.socials.x && <span>x {person.socials.x}</span>}
            {person.socials.github && <span>gh {person.socials.github}</span>}
          </div>
        </div>
      </div>
      <div
        className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
        style={{ animation: "shine 6s infinite linear" }}
      />
    </motion.div>
  );
}

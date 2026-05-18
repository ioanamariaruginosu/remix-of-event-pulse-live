import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/join")({
  head: () => ({ meta: [{ title: "Join — synqmap" }] }),
  component: Join,
});

type Persona = "professional" | "founder" | "investor" | "student" | "researcher" | "other";

const steps = [
  { id: "scan", title: "Scan the event QR" },
  { id: "identity", title: "Who you are" },
  { id: "background", title: "Where you spend your days" },
  { id: "expertise", title: "What you know" },
  { id: "interests", title: "What you want to talk about" },
  { id: "intent", title: "Why you came" },
  { id: "socials", title: "How people can reach you" },
];

const personaOptions: { id: Persona; label: string; copy: string }[] = [
  { id: "professional", label: "Professional", copy: "Working at a company or agency." },
  { id: "founder", label: "Founder", copy: "Building a startup, with or without funding." },
  { id: "investor", label: "Investor", copy: "VC, angel, or scout looking at deals." },
  { id: "student", label: "Student", copy: "Undergrad, masters, or PhD." },
  { id: "researcher", label: "Researcher", copy: "Academia, lab, or independent." },
  { id: "other", label: "Other", copy: "Hobbyist, between things, or just curious." },
];

const expertiseOptions = [
  "design", "engineering", "ml", "ai-research", "product", "data",
  "infra", "hardware", "robotics", "spatial", "graphs", "evals",
  "marketing", "growth", "ops", "finance", "legal", "sales",
];
const interestOptions = [
  "founders", "vc", "hiring", "mentorship", "collaborators", "co-founder",
  "research", "open-source", "policy", "climate", "health", "fintech",
  "creative-tools", "robotics", "spatial-computing", "agents", "education",
];
const lookingForOptions = [
  "Co-founder", "First hires", "Mentorship", "Investors", "Customers",
  "Collaborators", "Job opportunities", "Just exploring",
];
const seniorityOptions = ["Intern", "IC", "Senior IC", "Manager", "Director", "VP", "C-level", "Founder"];
const stageOptions = ["Idea", "Pre-seed", "Seed", "Series A", "Series B+", "Profitable"];
const studyLevelOptions = ["BSc", "MSc", "PhD", "Postdoc", "Exchange"];

function Join() {
  const [step, setStep] = useState(0);

  // Identity
  const [fullName, setFullName] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [persona, setPersona] = useState<Persona | null>(null);

  // Background — professional / founder / investor / researcher / other
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [seniority, setSeniority] = useState<string>("");
  const [companyStage, setCompanyStage] = useState<string>("");
  const [fundName, setFundName] = useState("");
  const [checkSize, setCheckSize] = useState("");
  const [lab, setLab] = useState("");

  // Background — student
  const [university, setUniversity] = useState("");
  const [programme, setProgramme] = useState("");
  const [studyLevel, setStudyLevel] = useState<string>("");
  const [gradYear, setGradYear] = useState("");

  // Expertise & interests
  const [expertise, setExpertise] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);

  // Intent
  const [intent, setIntent] = useState("");
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [offering, setOffering] = useState("");

  // Socials
  const [socials, setSocials] = useState<Record<string, string>>({});

  const toggleFrom = (list: string[], v: string, max?: number) =>
    list.includes(v)
      ? list.filter((x) => x !== v)
      : max && list.length >= max
        ? list
        : [...list, v];

  const canContinue = (() => {
    if (step === 1) return fullName.trim().length > 0 && persona !== null;
    if (step === 2) {
      if (persona === "student") return university.trim() && programme.trim();
      if (persona === "investor") return fundName.trim();
      if (persona === "researcher") return lab.trim() || company.trim();
      return role.trim() && company.trim();
    }
    if (step === 3) return expertise.length > 0;
    if (step === 4) return interests.length > 0;
    if (step === 5) return intent.trim().length > 0 && lookingFor.length > 0;
    return true;
  })();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border p-6 flex items-center justify-between max-w-7xl mx-auto">
        <Logo />
        <Link to="/" className="text-sm text-foreground/60 hover:text-foreground">Exit</Link>
      </nav>
      <div className="max-w-md mx-auto p-6 space-y-8 pt-16">
        <div>
          <div className="flex items-center gap-1.5 mb-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-foreground/10"}`}
              />
            ))}
          </div>
          <div className="font-display italic text-[10px] uppercase tracking-widest text-primary mb-2">
            Step {step + 1} of {steps.length}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">{steps[step].title}</h1>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {step === 0 && (
              <div className="space-y-6">
                <p className="text-foreground/60">Point your camera at the QR posted at the entrance.</p>
                <div className="aspect-square bg-foreground rounded-3xl p-8 grid place-items-center relative overflow-hidden">
                  <div
                    className="size-full bg-white rounded-2xl"
                    style={{
                      backgroundImage:
                        "repeating-conic-gradient(#0f172a 0% 25%, #ffffff 0% 50%)",
                      backgroundSize: "16px 16px",
                    }}
                  />
                  <div className="absolute inset-8 border-2 border-primary rounded-2xl pointer-events-none animate-pulse" />
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="space-y-5">
                <p className="text-foreground/60">A few basics so other attendees can put a face to a name.</p>
                <Field label="Full name">
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={80} placeholder="Ada Lovelace" className="w-full p-3 rounded-xl ring-1 ring-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none" />
                </Field>
                <Field label="Pronouns (optional)">
                  <input value={pronouns} onChange={(e) => setPronouns(e.target.value)} maxLength={20} placeholder="she/her" className="w-full p-3 rounded-xl ring-1 ring-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none" />
                </Field>
                <div>
                  <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40 mb-2">I'm here as a…</div>
                  <div className="grid grid-cols-2 gap-2">
                    {personaOptions.map((p) => {
                      const on = persona === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setPersona(p.id)}
                          className={`text-left p-3 rounded-xl ring-1 transition-colors ${on ? "ring-primary bg-primary-soft" : "ring-border hover:bg-foreground/5"}`}
                        >
                          <div className="font-bold text-sm">{p.label}</div>
                          <div className="text-[10px] text-foreground/50 mt-0.5">{p.copy}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-5">
                {persona === "student" ? (
                  <>
                    <p className="text-foreground/60">Tell us where you study so we can connect you with peers and alumni.</p>
                    <Field label="University">
                      <input value={university} onChange={(e) => setUniversity(e.target.value)} maxLength={120} placeholder="TU Delft" className="w-full p-3 rounded-xl ring-1 ring-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none" />
                    </Field>
                    <Field label="Programme">
                      <input value={programme} onChange={(e) => setProgramme(e.target.value)} maxLength={120} placeholder="MSc Computer Science" className="w-full p-3 rounded-xl ring-1 ring-border bg-background text-sm focus:ring-2 focus:ring-primary outline-none" />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Level">
                        <select value={studyLevel} onChange={(e) => setStudyLevel(e.target.value)} className="w-full p-3 rounded-xl ring-1 ring-border bg-background text-sm">
                          <option value="">Select…</option>
                          {studyLevelOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </Field>
                      <Field label="Graduation year">
                        <input value={gradYear} onChange={(e) => setGradYear(e.target.value)} maxLength={4} inputMode="numeric" placeholder="2027" className="w-full p-3 rounded-xl ring-1 ring-border bg-background text-sm" />
                      </Field>
                    </div>
                  </>
                ) : persona === "investor" ? (
                  <>
                    <p className="text-foreground/60">Help founders find you with the right context.</p>
                    <Field label="Fund or firm">
                      <input value={fundName} onChange={(e) => setFundName(e.target.value)} maxLength={120} placeholder="Index Ventures" className="w-full p-3 rounded-xl ring-1 ring-border bg-background text-sm" />
                    </Field>
                    <Field label="Role">
                      <input value={role} onChange={(e) => setRole(e.target.value)} maxLength={120} placeholder="Partner" className="w-full p-3 rounded-xl ring-1 ring-border bg-background text-sm" />
                    </Field>
                    <Field label="Typical check size (optional)">
                      <input value={checkSize} onChange={(e) => setCheckSize(e.target.value)} maxLength={40} placeholder="€250k – €2M" className="w-full p-3 rounded-xl ring-1 ring-border bg-background text-sm" />
                    </Field>
                  </>
                ) : persona === "researcher" ? (
                  <>
                    <p className="text-foreground/60">Where do you do your work?</p>
                    <Field label="Lab or institution">
                      <input value={lab} onChange={(e) => setLab(e.target.value)} maxLength={120} placeholder="DeepMind / TU/e Spatial AI Lab" className="w-full p-3 rounded-xl ring-1 ring-border bg-background text-sm" />
                    </Field>
                    <Field label="Role">
                      <input value={role} onChange={(e) => setRole(e.target.value)} maxLength={120} placeholder="Postdoc, PI, research engineer…" className="w-full p-3 rounded-xl ring-1 ring-border bg-background text-sm" />
                    </Field>
                  </>
                ) : (
                  <>
                    <p className="text-foreground/60">Where do you spend your work hours?</p>
                    <Field label="Role">
                      <input value={role} onChange={(e) => setRole(e.target.value)} maxLength={120} placeholder="Product designer" className="w-full p-3 rounded-xl ring-1 ring-border bg-background text-sm" />
                    </Field>
                    <Field label="Company">
                      <input value={company} onChange={(e) => setCompany(e.target.value)} maxLength={120} placeholder="Linear" className="w-full p-3 rounded-xl ring-1 ring-border bg-background text-sm" />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Seniority">
                        <select value={seniority} onChange={(e) => setSeniority(e.target.value)} className="w-full p-3 rounded-xl ring-1 ring-border bg-background text-sm">
                          <option value="">Select…</option>
                          {seniorityOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </Field>
                      {persona === "founder" && (
                        <Field label="Stage">
                          <select value={companyStage} onChange={(e) => setCompanyStage(e.target.value)} className="w-full p-3 rounded-xl ring-1 ring-border bg-background text-sm">
                            <option value="">Select…</option>
                            {stageOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </Field>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
            {step === 3 && (
              <div className="space-y-5">
                <p className="text-foreground/60">Pick up to 6 things you can credibly talk about. Used to match you with people seeking your expertise.</p>
                <TagGrid options={expertiseOptions} value={expertise} onChange={(v) => setExpertise((cur) => toggleFrom(cur, v, 6))} />
                <div className="text-[10px] text-foreground/40">{expertise.length}/6 selected</div>
              </div>
            )}
            {step === 4 && (
              <div className="space-y-5">
                <p className="text-foreground/60">Pick up to 6 topics you'd love to learn or hear about right now.</p>
                <TagGrid options={interestOptions} value={interests} onChange={(v) => setInterests((cur) => toggleFrom(cur, v, 6))} />
                <div className="text-[10px] text-foreground/40">{interests.length}/6 selected</div>
              </div>
            )}
            {step === 5 && (
              <div className="space-y-5">
                <p className="text-foreground/60">What are you here for? This is the first thing other attendees see.</p>
                <textarea
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  rows={3}
                  maxLength={240}
                  placeholder="Looking for a technical co-founder for a spatial AI startup."
                  className="w-full p-4 rounded-2xl ring-1 ring-border bg-background font-medium resize-none focus:ring-2 focus:ring-primary outline-none"
                />
                <div>
                  <div className="font-display italic text-[10px] uppercase tracking-widest text-foreground/40 mb-2">I'm looking for</div>
                  <div className="flex flex-wrap gap-2">
                    {lookingForOptions.map((o) => {
                      const on = lookingFor.includes(o);
                      return (
                        <button
                          key={o}
                          onClick={() => setLookingFor((cur) => toggleFrom(cur, o, 4))}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${on ? "bg-primary text-white" : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10"}`}
                        >
                          {o}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Field label="And I can offer (optional)">
                  <input value={offering} onChange={(e) => setOffering(e.target.value)} maxLength={200} placeholder="Intros to designers in Rotterdam, eval feedback…" className="w-full p-3 rounded-xl ring-1 ring-border bg-background text-sm" />
                </Field>
              </div>
            )}
            {step === 6 && (
              <div className="space-y-5">
                <p className="text-foreground/60">Add the handles you're happy to share when phones tap.</p>
                <div className="space-y-3">
                  {["LinkedIn", "X / Twitter", "GitHub", "Email", "Personal site"].map((s) => (
                    <Field key={s} label={s}>
                      <input
                        value={socials[s] ?? ""}
                        onChange={(e) => setSocials((cur) => ({ ...cur, [s]: e.target.value }))}
                        maxLength={200}
                        placeholder={s === "Email" ? "you@domain.com" : s === "LinkedIn" ? "linkedin.com/in/you" : "@handle or url"}
                        className="w-full p-3 rounded-xl ring-1 ring-border bg-background text-sm"
                      />
                    </Field>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-5 py-3 rounded-xl ring-1 ring-border font-bold text-sm hover:bg-foreground/5"
            >
              Back
            </button>
          )}
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canContinue}
              className="flex-1 px-5 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          ) : (
            <Link
              to="/app"
              className="flex-1 px-5 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors text-center"
            >
              Enter the venue →
            </Link>
          )}
        </div>
      </div>

    </div>
  );
}

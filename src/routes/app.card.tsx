import { createFileRoute, Link } from "@tanstack/react-router";
import { IdentityCard } from "@/components/IdentityCard";
import { people } from "@/data/event";
import { useYou, useYouGradient } from "@/data/profile";

export const Route = createFileRoute("/app/card")({
  head: () => ({ meta: [{ title: "Your card — synqmap" }] }),
  component: CardPage,
});

function CardPage() {
  const you = useYou(people[0]);
  const gradient = useYouGradient();
  return (
    <div className="px-5 pt-6 space-y-5 pb-10">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-display italic text-foreground/40 uppercase tracking-widest">Your identity</div>
          <h1 className="font-extrabold text-2xl tracking-tight">Card #001</h1>
        </div>
        <Link to="/app/avatar" className="text-[10px] font-bold uppercase tracking-widest text-primary">Edit ↗</Link>
      </div>
      <div className="flex justify-center pt-4">
        <IdentityCard person={you} serial="001" gradient={gradient} />
      </div>
      <Link
        to="/app/exchange"
        search={{}}
        className="block w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-center"
      >
        Open my QR code
      </Link>
      <div className="text-xs text-foreground/50 text-center">
        Use NFC on supported Android phones, or open your QR and let the other person scan it in the app.
      </div>
    </div>
  );
}

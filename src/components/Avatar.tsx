import { useAvatarFor, avatarUrl, defaultAvatarFor, type AvatarConfig } from "@/data/avatars";
import type { Person } from "@/data/event";

type Props = {
  person?: Pick<Person, "id" | "color" | "initials">;
  config?: AvatarConfig;
  size?: number;
  className?: string;
  ring?: boolean;
};

/** <Avatar> — renders the DiceBear SVG for a person.
 *  Pass either `person` (and we'll look up overrides) or a raw `config`. */
export function Avatar({ person, config, size = 40, className = "", ring = false }: Props) {
  // Hook must always run; pass a stable fallback person.
  const fallback: Pick<Person, "id" | "color"> = person ?? { id: "anon", color: "#94a3b8" };
  const live = useAvatarFor(fallback);
  const cfg = config ?? live;
  const url = avatarUrl(cfg, size * 2);
  return (
    <img
      src={url}
      alt={person?.id ?? cfg.seed}
      width={size}
      height={size}
      loading="lazy"
      draggable={false}
      className={`rounded-full bg-foreground/5 ${ring ? "ring-2 ring-background" : ""} ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/** Static helper for places that can't use the hook (e.g. SVG <image>). */
export function staticAvatarUrl(person: Pick<Person, "id" | "color">, size = 64) {
  return avatarUrl(defaultAvatarFor(person), size);
}

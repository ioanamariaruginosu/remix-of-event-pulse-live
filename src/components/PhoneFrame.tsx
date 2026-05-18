import type { ReactNode } from "react";

export function PhoneFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-[360px] h-[760px] bg-foreground rounded-[48px] p-[10px] shadow-2xl ring-1 ring-black/10 ${className}`}>
      <div className="relative h-full w-full bg-background rounded-[40px] overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-7 flex justify-center items-end pointer-events-none z-50">
          <div className="w-28 h-5 bg-foreground rounded-b-2xl" />
        </div>
        <div className="h-full overflow-y-auto pt-7">{children}</div>
      </div>
    </div>
  );
}

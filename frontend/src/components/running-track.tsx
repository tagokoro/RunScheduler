import { cn } from "@/lib/utils";

/** Decorative track lanes, never a progress indicator. */
export function RunningTrack({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 320"
      fill="none"
      aria-hidden="true"
      className={cn("pointer-events-none", className)}
    >
      <g
        transform="rotate(-28 240 160)"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        {[0, 1, 2, 3, 4].map((lane) => (
          <rect
            key={lane}
            x={52 + lane * 13}
            y={44 + lane * 13}
            width={376 - lane * 26}
            height={232 - lane * 26}
            rx={116 - lane * 13}
          />
        ))}
        <path d="M292 44V109M308 44V109" strokeWidth="3" />
      </g>
    </svg>
  );
}

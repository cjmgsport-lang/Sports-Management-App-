import { clsx } from "clsx";
import {
  MATCH_DAY_LABELS,
  MOMENT_COLORS,
  MOMENT_SHORT_LABELS,
  SUB_DYNAMIC_LABELS,
  type MatchDayCode,
} from "@/lib/tactical-periodization";

const STRIP_ORDER: MatchDayCode[] = [
  "MD_MINUS_5",
  "MD_MINUS_4",
  "MD_MINUS_3",
  "MD_MINUS_2",
  "MD_MINUS_1",
  "MD",
  "MD_SECOND_MINUS_2",
  "MD_SECOND_MINUS_1",
  "MD_SECOND",
  "MD_PLUS_1",
];

const COLOR_CLASSES: Record<string, string> = {
  blue: "bg-blue-100 border-blue-300 text-blue-800",
  red: "bg-red-100 border-red-300 text-red-800",
  green: "bg-emerald-100 border-emerald-300 text-emerald-800",
  amber: "bg-amber-100 border-amber-300 text-amber-800",
  purple: "bg-purple-100 border-purple-300 text-purple-800",
};

type StripSession = {
  matchDayCode: string | null;
  dominantMoment: string | null;
  subDynamic: string | null;
  focus: string;
};

export function MorphocycleStrip({ sessions }: { sessions: StripSession[] }) {
  const byCode = new Map<string, StripSession>();
  for (const s of sessions) {
    if (s.matchDayCode) byCode.set(s.matchDayCode, s);
  }

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {STRIP_ORDER.map((code) => {
        const session = byCode.get(code);
        const color = session?.dominantMoment ? MOMENT_COLORS[session.dominantMoment as keyof typeof MOMENT_COLORS] : undefined;
        return (
          <div
            key={code}
            className={clsx(
              "rounded-lg border px-1.5 py-2 text-center",
              color ? COLOR_CLASSES[color] : "border-dashed border-slate-200 text-slate-400"
            )}
          >
            <p className="text-xs font-semibold">{MATCH_DAY_LABELS[code]}</p>
            {session?.subDynamic ? (
              <p className="mt-0.5 text-[10px] leading-tight">{SUB_DYNAMIC_LABELS[session.subDynamic as keyof typeof SUB_DYNAMIC_LABELS]}</p>
            ) : (
              <p className="mt-0.5 text-[10px] leading-tight">—</p>
            )}
            {session?.dominantMoment && (
              <p className="mt-0.5 text-[10px] leading-tight opacity-80">
                {MOMENT_SHORT_LABELS[session.dominantMoment as keyof typeof MOMENT_SHORT_LABELS]}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

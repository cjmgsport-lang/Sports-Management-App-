"use client";

import { useState } from "react";
import { Field, Select } from "@/components/ui";
import {
  MATCH_DAY_CODES,
  MATCH_DAY_LABELS,
  MOMENT_LABELS,
  MOMENTS,
  STANDARD_MORPHOCYCLE,
  SUB_DYNAMIC_HINTS,
  SUB_DYNAMIC_LABELS,
  SUB_DYNAMICS,
  type MatchDayCode,
} from "@/lib/tactical-periodization";

export function MorphocycleSessionFields() {
  const [matchDayCode, setMatchDayCode] = useState<MatchDayCode | "">("");
  const suggestion = STANDARD_MORPHOCYCLE.find((s) => s.code === matchDayCode);
  const [subDynamic, setSubDynamic] = useState<string>("");

  return (
    <>
      <Field label="Match-day code">
        <Select
          name="matchDayCode"
          value={matchDayCode}
          onChange={(e) => {
            const code = e.target.value as MatchDayCode | "";
            setMatchDayCode(code);
            const suggested = STANDARD_MORPHOCYCLE.find((s) => s.code === code);
            if (suggested) setSubDynamic(suggested.suggestedSubDynamic);
          }}
        >
          <option value="">— Not set —</option>
          {MATCH_DAY_CODES.map((c) => (
            <option key={c} value={c}>
              {MATCH_DAY_LABELS[c]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Dominant moment">
        <Select name="dominantMoment" defaultValue="">
          <option value="">— Not set —</option>
          {MOMENTS.map((m) => (
            <option key={m} value={m}>
              {MOMENT_LABELS[m]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Sub-dynamic">
        <Select name="subDynamic" value={subDynamic} onChange={(e) => setSubDynamic(e.target.value)}>
          <option value="">— Not set —</option>
          {SUB_DYNAMICS.map((d) => (
            <option key={d} value={d}>
              {SUB_DYNAMIC_LABELS[d]}
            </option>
          ))}
        </Select>
        {(subDynamic || suggestion) && (
          <p className="mt-1 text-xs text-slate-400">{SUB_DYNAMIC_HINTS[(subDynamic || suggestion?.suggestedSubDynamic) as keyof typeof SUB_DYNAMIC_HINTS]}</p>
        )}
      </Field>
    </>
  );
}

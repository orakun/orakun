"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatTRY } from "@/lib/format";
import type { ScenarioTimeSeries } from "@/lib/types";

interface Props {
  data: ScenarioTimeSeries[];
  actualLabel: string;
  hypotheticalLabel: string;
}

export default function ScenarioChart({ data, actualLabel, hypotheticalLabel }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k₺`} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v) => formatTRY(Number(v))} />
        <Legend />
        <Line
          type="monotone"
          dataKey="actual"
          name={actualLabel}
          stroke="#2563eb"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="hypothetical"
          name={hypotheticalLabel}
          stroke="#16a34a"
          strokeWidth={2}
          dot={false}
          strokeDasharray="5 5"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

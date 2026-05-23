"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatTRY } from "@/lib/format";
import type { AllocationSlice } from "@/lib/types";

const COLORS = ["#2563eb", "#16a34a", "#ea580c", "#9333ea", "#0891b2", "#d97706", "#dc2626", "#059669"];

interface Props {
  data: AllocationSlice[];
  title: string;
}

export default function AllocationChart({ data, title }: Props) {
  if (!data.length) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center text-muted-foreground text-sm">
        {title}: Veri yok
      </div>
    );
  }
  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="font-semibold mb-4 text-sm">{title}</h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey="valueTry"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(1)}%`}
            labelLine={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => formatTRY(Number(v))} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

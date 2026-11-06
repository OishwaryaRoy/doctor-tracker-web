"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  Pie,
  PieChart,
  ReferenceArea,
  XAxis,
  YAxis,
} from "recharts";
import { useState, useSyncExternalStore } from "react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(REDUCED_MOTION);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { Interval, PatientCondition, StatsOverview } from "@/lib/api/types";
import { CONDITION_META, CONDITION_ORDER } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { formatCompact } from "./stat-card";

const BAR_SIZE = 18;
const GRID = <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />;
const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 12 };

function niceTicks(max: number, target = 4): number[] {
  if (max <= 0) return [0, 1];
  const magnitude = 10 ** Math.floor(Math.log10(max / target));
  const step =
    [1, 2, 2.5, 5, 10, 20]
      .map((m) => m * magnitude)
      .find((s) => Math.ceil(max / s) <= target + 1) ?? 20 * magnitude;
  const intervals = Math.max(1, Math.ceil(max / step));
  return Array.from({ length: intervals + 1 }, (_, i) => Math.round(i * step * 100) / 100);
}

const TICK_FORMAT: Record<Interval, string> = { day: "MMM d", week: "MMM d", month: "MMM yy" };
const TOOLTIP_FORMAT: Record<Interval, string> = {
  day: "EEE, MMM d, yyyy",
  week: "'Week of' MMM d, yyyy",
  month: "MMMM yyyy",
};

const timelineConfig = {
  count: { label: "Admissions", color: "var(--chart-1)" },
  critical: { label: "Critical", color: "var(--condition-critical)" },
} satisfies ChartConfig;

export function AdmissionsChart({ data }: { data: StatsOverview }) {
  const { interval } = data.range;
  const reducedMotion = useReducedMotion();
  const points = data.timeline.map((point) => ({ ...point, ts: new Date(point.date).getTime() }));
  const last = points.at(-1);
  const previous = points.at(-2);
  const ticks = niceTicks(Math.max(...points.map((p) => p.count), 0));

  return (
    <div>
      <Legend
        items={[
          { label: "All admissions", color: "var(--chart-1)" },
          { label: "Critical on admission", color: "var(--condition-critical)" },
        ]}
      />
      <ChartContainer config={timelineConfig} className="aspect-auto h-64 w-full">
        <AreaChart
          data={points}
          margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
          accessibilityLayer
        >
          <defs>
            <linearGradient id="fill-admissions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-count)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--color-count)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {GRID}
          <XAxis
            dataKey="ts"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(ts: number) => format(ts, TICK_FORMAT[interval])}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            tickMargin={8}
            minTickGap={28}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={44}
            ticks={ticks}
            domain={[0, ticks.at(-1)!]}
            tickFormatter={formatCompact}
          />
          <ChartTooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
            content={
              <ChartTooltipContent
                indicator="line"
                labelFormatter={(_, payload) => {
                  const ts = payload?.[0]?.payload?.ts as number | undefined;
                  return ts ? format(ts, TOOLTIP_FORMAT[interval]) : "";
                }}
              />
            }
          />
          {last && previous && (
            <ReferenceArea
              x1={previous.ts}
              x2={last.ts}
              fill="var(--muted-foreground)"
              fillOpacity={0.08}
              stroke="none"
              label={{
                value: `${format(last.ts, interval === "month" ? "MMM" : "MMM d")} in progress`,
                position: "insideTopRight",
                fill: "var(--muted-foreground)",
                fontSize: 11,
              }}
            />
          )}
          <Area
            dataKey="count"
            type="monotone"
            stroke="var(--color-count)"
            strokeWidth={2}
            fill="url(#fill-admissions)"
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
            isAnimationActive={!reducedMotion}
          />
          <Line
            dataKey="critical"
            type="monotone"
            stroke="var(--color-critical)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
            isAnimationActive={!reducedMotion}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

export function ConditionChart({ data }: { data: StatsOverview }) {
  const counts = new Map(data.byCondition.map((row) => [row.condition, row.count]));
  const rows = CONDITION_ORDER.map((condition) => ({
    condition,
    label: CONDITION_META[condition].label,
    count: counts.get(condition) ?? 0,
    fill: CONDITION_META[condition].color,
  }));
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const config = Object.fromEntries(
    rows.map((row) => [row.condition, { label: row.label, color: row.fill }]),
  ) satisfies ChartConfig;
  const percent = (count: number) => (total ? Math.round((count / total) * 100) : 0);

  const [activeKey, setActiveKey] = useState<PatientCondition | null>(null);
  const active = rows.find((row) => row.condition === activeKey);

  return (
    <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="relative mx-auto aspect-square w-full max-w-52">
        <ChartContainer config={config} className="aspect-square h-full w-full">
          <PieChart>
            <Pie
              data={rows}
              dataKey="count"
              nameKey="condition"
              innerRadius="64%"
              outerRadius="100%"
              stroke="var(--card)"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
              onMouseEnter={(_, index) => setActiveKey(rows[index]?.condition ?? null)}
              onMouseLeave={() => setActiveKey(null)}
            >
              {rows.map((row) => (
                <Cell
                  key={row.condition}
                  fill={row.fill}
                  fillOpacity={activeKey && activeKey !== row.condition ? 0.3 : 1}
                  className="transition-[fill-opacity] duration-150"
                />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
          aria-live="polite"
        >
          <span className="text-2xl font-semibold">
            {formatCompact(active ? active.count : total)}
          </span>
          <span className="max-w-24 text-xs leading-tight text-muted-foreground">
            {active ? `${active.label} · ${percent(active.count)}%` : "admitted"}
          </span>
        </div>
      </div>
      <ul className="space-y-1" onMouseLeave={() => setActiveKey(null)}>
        {rows.map((row) => (
          <li
            key={row.condition}
            tabIndex={0}
            onMouseEnter={() => setActiveKey(row.condition)}
            onFocus={() => setActiveKey(row.condition)}
            onBlur={() => setActiveKey(null)}
            className={cn(
              "flex items-center gap-3 rounded-md px-2 py-1 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              activeKey === row.condition && "bg-muted",
            )}
          >
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: row.fill }}
              aria-hidden
            />
            <span className="flex-1 text-muted-foreground">{row.label}</span>
            <span className="tabular font-medium">{row.count.toLocaleString()}</span>
            <span className="tabular w-11 text-right text-xs text-muted-foreground">
              {total ? `${Math.round((row.count / total) * 100)}%` : "–"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const doctorsConfig = {
  count: { label: "Patients", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function TopDoctorsChart({ data }: { data: StatsOverview }) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const rows = data.topDoctors.map((doctor) => ({ ...doctor, label: `Dr. ${doctor.name}` }));

  return (
    <ChartContainer
      config={doctorsConfig}
      className="aspect-auto w-full"
      style={{ height: rows.length * 30 + 16 }}
    >
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
        barCategoryGap={6}
        accessibilityLayer
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={160}
          tickLine={false}
          axisLine={false}
          interval={0}
          tick={({ x, y, payload }) => {
            const label = String(payload.value);
            return (
              <text
                x={Number(x) - 6}
                y={y}
                dy={4}
                textAnchor="end"
                fontSize={12}
                fill="var(--foreground)"
              >
                <title>{label}</title>
                {label.length > 22 ? `${label.slice(0, 21)}…` : label}
              </text>
            );
          }}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.6 }}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Bar
          dataKey="count"
          fill="var(--color-count)"
          barSize={BAR_SIZE}
          radius={[0, 4, 4, 0]}
          className="cursor-pointer"
          isAnimationActive={!reducedMotion}
          onClick={(entry: { payload?: { id?: string } }) =>
            entry.payload?.id && router.push(`/doctors/${entry.payload.id}`)
          }
        >
          <LabelList
            dataKey="count"
            position="right"
            offset={8}
            className="tabular fill-foreground"
            fontSize={12}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

const ageConfig = { count: { label: "Patients", color: "var(--chart-1)" } } satisfies ChartConfig;

export function AgeChart({ data }: { data: StatsOverview }) {
  const ticks = niceTicks(Math.max(...data.ageGroups.map((g) => g.count), 0));
  const reducedMotion = useReducedMotion();
  return (
    <ChartContainer config={ageConfig} className="aspect-auto h-64 w-full">
      <BarChart
        data={data.ageGroups}
        margin={{ top: 20, right: 4, left: -12, bottom: 0 }}
        accessibilityLayer
      >
        {GRID}
        <XAxis
          dataKey="label"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          tickMargin={8}
        />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={44}
          ticks={ticks}
          domain={[0, ticks.at(-1)!]}
          tickFormatter={formatCompact}
        />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.6 }}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Bar
          dataKey="count"
          fill="var(--color-count)"
          barSize={24}
          radius={[4, 4, 0, 0]}
          isAnimationActive={!reducedMotion}
        >
          <LabelList
            dataKey="count"
            position="top"
            offset={6}
            className="fill-muted-foreground"
            fontSize={11}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export function SpecializationList({ data }: { data: StatsOverview }) {
  const max = Math.max(1, ...data.doctorsBySpecialization.map((row) => row.count));
  return (
    <ul
      className="grid gap-x-8 gap-y-2.5 sm:grid-flow-col sm:grid-cols-2"
      style={{
        gridTemplateRows: `repeat(${Math.ceil(data.doctorsBySpecialization.length / 2)}, auto)`,
      }}
    >
      {data.doctorsBySpecialization.map((row) => (
        <li
          key={row.specialization}
          className="grid grid-cols-[minmax(0,9.5rem)_1fr_1.5rem] items-center gap-3 text-sm"
        >
          <span className="truncate text-muted-foreground">{row.specialization}</span>
          <span className="h-2 overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full rounded-full bg-chart-1"
              style={{ width: `${(row.count / max) * 100}%` }}
            />
          </span>
          <span className="tabular text-right font-medium">{row.count}</span>
        </li>
      ))}
    </ul>
  );
}

export function GenderSplit({ data }: { data: StatsOverview }) {
  const total = data.byGender.reduce((sum, row) => sum + row.count, 0);
  const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];
  const labels = { male: "Male", female: "Female", other: "Other" } as const;

  return (
    <div className="space-y-5">
      <div
        className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full"
        role="img"
        aria-label={data.byGender.map((g) => `${labels[g.gender]} ${g.count}`).join(", ")}
      >
        {data.byGender.map((row, index) =>
          row.count > 0 ? (
            <span
              key={row.gender}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${(row.count / Math.max(total, 1)) * 100}%`,
                background: colors[index],
              }}
            />
          ) : null,
        )}
      </div>
      <ul className="space-y-3">
        {data.byGender.map((row, index) => (
          <li key={row.gender} className="flex items-center gap-3 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: colors[index] }}
              aria-hidden
            />
            <span className="flex-1 text-muted-foreground">{labels[row.gender]}</span>
            <span className="tabular font-medium">{row.count.toLocaleString()}</span>
            <span className="tabular w-11 text-right text-xs text-muted-foreground">
              {total ? `${Math.round((row.count / total) * 100)}%` : "–"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Legend({
  items,
  className,
}: {
  items: { label: string; color: string }[];
  className?: string;
}) {
  return (
    <ul
      className={cn("mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground", className)}
    >
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full" style={{ background: item.color }} aria-hidden />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

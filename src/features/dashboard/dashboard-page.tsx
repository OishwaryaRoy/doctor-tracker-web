"use client";

import { format } from "date-fns";
import { Activity, Siren, Stethoscope, UsersRound } from "lucide-react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorState } from "@/components/shared/states";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useSession } from "@/features/auth/session-context";
import { CONDITION_META, CONDITION_ORDER } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { RANGE_PRESETS, useOverview, type RangePreset } from "./api";
import { ChartCard } from "./chart-card";
import {
  AdmissionsChart,
  AgeChart,
  ConditionChart,
  GenderSplit,
  SpecializationList,
  TopDoctorsChart,
} from "./charts";
import { StatCard } from "./stat-card";

const RANGES = Object.keys(RANGE_PRESETS) as RangePreset[];

export function DashboardPage() {
  const { user } = useSession();
  const [range, setRange] = useQueryState(
    "range",
    parseAsStringLiteral(RANGES).withDefault("12m").withOptions({ clearOnDefault: true }),
  );
  const overview = useOverview(range);
  const data = overview.data;
  const isLoading = overview.isPending;
  const preset = RANGE_PRESETS[range];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Caseload overview across all doctors and hospitals."
        actions={
          <ToggleGroup
            type="single"
            variant="outline"
            value={range}
            onValueChange={(next) => next && setRange(next as RangePreset)}
            aria-label="Date range"
            className="bg-card"
          >
            {RANGES.map((key) => (
              <ToggleGroupItem
                key={key}
                value={key}
                aria-label={RANGE_PRESETS[key].label}
                className="px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {RANGE_PRESETS[key].short}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        }
      />

      {overview.isError ? (
        <ErrorState error={overview.error} onRetry={() => overview.refetch()} />
      ) : (
        <div
          className={cn("space-y-4 transition-opacity", overview.isPlaceholderData && "opacity-60")}
          aria-busy={overview.isFetching}
        >
          <section
            aria-label="Key figures"
            className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
          >
            <StatCard
              label="Total doctors"
              icon={Stethoscope}
              value={data?.totals.doctors}
              isLoading={isLoading}
              footnote={
                data && `${data.totals.avgPatientsPerDoctor} patients per doctor on average`
              }
            />
            <StatCard
              label="Total patients"
              icon={UsersRound}
              value={data?.totals.patients}
              isLoading={isLoading}
              footnote="All registered patients"
            />
            <StatCard
              label={`Admissions · ${preset.short}`}
              icon={Activity}
              value={data?.period.newPatients}
              isLoading={isLoading}
              delta={data && { pct: data.period.changePct, period: "previous period" }}
            />
            <StatCard
              label="Critical patients"
              icon={Siren}
              tone="critical"
              value={data?.totals.criticalPatients}
              isLoading={isLoading}
              footnote={
                data &&
                `${data.totals.patients ? ((data.totals.criticalPatients / data.totals.patients) * 100).toFixed(1) : 0}% of all patients`
              }
            />
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              title="Admissions over time"
              description={
                data
                  ? `${preset.label} · by ${data.range.interval} · ${format(new Date(data.range.from), "MMM d, yyyy")} – ${format(new Date(data.range.to), "MMM d, yyyy")}`
                  : preset.label
              }
              isLoading={isLoading}
              table={
                data && {
                  columns: [
                    { label: "Period" },
                    { label: "Admissions", numeric: true },
                    { label: "Critical", numeric: true },
                  ],
                  rows: data.timeline.map((p) => [
                    format(
                      new Date(p.date),
                      data.range.interval === "month" ? "MMMM yyyy" : "MMM d, yyyy",
                    ),
                    p.count,
                    p.critical,
                  ]),
                }
              }
            >
              {data && <AdmissionsChart data={data} />}
            </ChartCard>

            <ChartCard
              title="Condition mix"
              description={`Patients admitted · ${preset.label.toLowerCase()}`}
              isLoading={isLoading}
              table={
                data && {
                  columns: [{ label: "Condition" }, { label: "Patients", numeric: true }],
                  rows: CONDITION_ORDER.map((condition) => [
                    CONDITION_META[condition].label,
                    data.byCondition.find((row) => row.condition === condition)?.count ?? 0,
                  ]),
                }
              }
            >
              {data && <ConditionChart data={data} />}
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Patients per doctor"
              description={`Top 10 by admissions · ${preset.label.toLowerCase()} · select a bar to open the doctor`}
              isLoading={isLoading}
              table={
                data && {
                  columns: [
                    { label: "Doctor" },
                    { label: "Specialization" },
                    { label: "Patients", numeric: true },
                  ],
                  rows: data.topDoctors.map((d) => [`Dr. ${d.name}`, d.specialization, d.count]),
                }
              }
            >
              {data &&
                (data.topDoctors.length > 0 ? (
                  <TopDoctorsChart data={data} />
                ) : (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    No admissions in this period.
                  </p>
                ))}
            </ChartCard>

            <ChartCard
              title="Age distribution"
              description={`Patients admitted · ${preset.label.toLowerCase()}`}
              isLoading={isLoading}
              table={
                data && {
                  columns: [{ label: "Age group" }, { label: "Patients", numeric: true }],
                  rows: data.ageGroups.map((g) => [g.label, g.count]),
                }
              }
            >
              {data && <AgeChart data={data} />}
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <ChartCard
              className="lg:col-span-2"
              title="Doctors by specialization"
              description="All doctors on staff"
              isLoading={isLoading}
            >
              {data && <SpecializationList data={data} />}
            </ChartCard>
            <ChartCard
              title="Gender split"
              description={`Patients admitted · ${preset.label.toLowerCase()}`}
              isLoading={isLoading}
              table={
                data && {
                  columns: [{ label: "Gender" }, { label: "Patients", numeric: true }],
                  rows: data.byGender.map((g) => [
                    g.gender[0]!.toUpperCase() + g.gender.slice(1),
                    g.count,
                  ]),
                }
              }
            >
              {data && <GenderSplit data={data} />}
            </ChartCard>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import type { ValueType } from "recharts/types/component/DefaultTooltipContent";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { listTrainingRecordStats } from "@/lib/api/training-records";
import type {
  TrainingRecordStat,
  TrainingRecordStatsGroupBy,
  TrainingRecordStatsResponse,
} from "@/types/training-records";

type StatisticsClientProps = {
  initialStatsResponse: TrainingRecordStatsResponse;
};

const GROUP_BY_OPTIONS: Array<{
  value: TrainingRecordStatsGroupBy;
  label: string;
}> = [
  { value: "day", label: "日別" },
  { value: "week", label: "週別" },
  { value: "month", label: "月別" },
];

const distanceChartConfig = {
  total_distance_km: {
    label: "走行距離",
    color: "#f97316",
  },
} satisfies ChartConfig;

const durationChartConfig = {
  total_duration_minutes: {
    label: "走行時間",
    color: "#fb923c",
  },
} satisfies ChartConfig;

const trainingCountChartConfig = {
  training_count: {
    label: "実施回数",
    color: "#fdba74",
  },
} satisfies ChartConfig;

const getNumericValue = (value: ValueType | undefined) => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  return 0;
};

const formatDistance = (value: ValueType | undefined) =>
  `${getNumericValue(value).toFixed(1)} km`;

const formatDuration = (value: ValueType | undefined) =>
  `${getNumericValue(value)} 分`;

const formatSummaryDistance = (value: number) =>
  `${value.toFixed(1)} km`;

const formatSummaryDuration = (value: number) => `${value} 分`;

const summarizeStats = (stats: TrainingRecordStat[]) =>
  stats.reduce(
    (accumulator, stat) => ({
      totalDistanceKm: accumulator.totalDistanceKm + stat.total_distance_km,
      totalDurationMinutes:
        accumulator.totalDurationMinutes + stat.total_duration_minutes,
      totalTrainingCount: accumulator.totalTrainingCount + stat.training_count,
    }),
    {
      totalDistanceKm: 0,
      totalDurationMinutes: 0,
      totalTrainingCount: 0,
    },
  );

export function StatisticsClient({
  initialStatsResponse,
}: StatisticsClientProps) {
  const [statsResponse, setStatsResponse] = useState(initialStatsResponse);
  const [isLoading, setIsLoading] = useState(false);

  const summary = summarizeStats(statsResponse.stats);

  const handleChangeGroupBy = async (groupBy: TrainingRecordStatsGroupBy) => {
    if (groupBy === statsResponse.group_by) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await listTrainingRecordStats(groupBy);

      if (result.statsResponse) {
        setStatsResponse(result.statsResponse);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 p-6">
      <section className="space-y-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Statistics
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {GROUP_BY_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={
                option.value === statsResponse.group_by ? "default" : "outline"
              }
              onClick={() => handleChangeGroupBy(option.value)}
              disabled={isLoading}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>合計走行距離</CardDescription>
            <CardTitle>
              {formatSummaryDistance(summary.totalDistanceKm)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>合計走行時間</CardDescription>
            <CardTitle>
              {formatSummaryDuration(summary.totalDurationMinutes)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>実施回数</CardDescription>
            <CardTitle>{summary.totalTrainingCount} 回</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>走行距離</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={distanceChartConfig}>
              <BarChart data={statsResponse.stats}>
                <CartesianGrid vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="period" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip
                  content={<ChartTooltipContent formatter={formatDistance} />}
                />
                <Bar
                  dataKey="total_distance_km"
                  fill="var(--color-total_distance_km)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>走行時間</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={durationChartConfig}>
              <LineChart data={statsResponse.stats}>
                <CartesianGrid vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="period" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip
                  content={<ChartTooltipContent formatter={formatDuration} />}
                />
                <Line
                  type="monotone"
                  dataKey="total_duration_minutes"
                  stroke="var(--color-total_duration_minutes)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-total_duration_minutes)" }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>実施回数</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={trainingCountChartConfig}
              className="h-[240px]"
            >
              <BarChart data={statsResponse.stats}>
                <CartesianGrid vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="period" tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="training_count"
                  fill="var(--color-training_count)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

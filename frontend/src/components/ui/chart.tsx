"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

import { cn } from "@/lib/utils";

export type ChartConfig = {
  [key: string]: {
    label: string;
    color?: string;
  };
};

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a ChartContainer");
  }

  return context;
}

function ChartContainer({
  id,
  className,
  config,
  children,
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
}) {
  const chartId = React.useId().replace(/:/g, "");
  const resolvedId = `chart-${id ?? chartId}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={resolvedId}
        className={cn("h-[280px] w-full text-sm", className)}
      >
        <style>{`
          [data-chart="${resolvedId}"] {
            ${Object.entries(config)
              .map(([key, item]) =>
                item.color ? `--color-${key}: ${item.color};` : "",
              )
              .join("\n")}
          }
        `}</style>
        <RechartsPrimitive.ResponsiveContainer>
          {children as React.ReactElement}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartTooltip = RechartsPrimitive.Tooltip;

function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  formatter,
}: Partial<RechartsPrimitive.TooltipContentProps<ValueType, NameType>> & {
  className?: string;
  formatter?: (
    value: ValueType | undefined,
    name: NameType | undefined,
    item: Payload<ValueType, NameType>,
    index: number,
    payload: ReadonlyArray<Payload<ValueType, NameType>>,
  ) => React.ReactNode;
}) {
  const { config } = useChart();

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-sm",
        className,
      )}
    >
      <p className="mb-2 text-sm font-medium text-neutral-900">{label}</p>
      <div className="space-y-1.5">
        {payload.map((item, index) => {
          const key = String(item.dataKey);
          const itemConfig = config[key];
          const formattedValue = formatter
            ? formatter(item.value, item.name, item, index, payload)
            : Array.isArray(item.value)
              ? item.value.join(" / ")
              : item.value;

          return (
            <div key={key} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-neutral-600">
                  {itemConfig?.label ?? key}
                </span>
              </div>
              <span className="text-sm font-medium text-neutral-900">
                {formattedValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent };

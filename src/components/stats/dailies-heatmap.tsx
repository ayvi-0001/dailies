"use client";

import * as React from "react";

import * as heroui from "@heroui/react";
import * as ReactUse from "@reactuses/core";
import * as reaviz from "reaviz";
import { flip, offset } from "@floating-ui/dom";
import { Skeleton } from "@heroui/skeleton";
import { now, parseDate } from "@internationalized/date";
import chroma from "chroma-js";
import type { ScaleBand } from "d3";
import { motion } from "motion/react";
import { CloneElement } from "reablocks";

import { type User } from "@/app/providers/user";
import { LOCAL_TZ } from "@/lib/dates";
import { invoke } from "@/lib/tauri";

export default function DailiesHeatmap({ user }: { user: User }): React.ReactElement {
  const today = now(LOCAL_TZ);
  const defaultGraphData = Array.from({ length: 365 }, (_: unknown, k: number) => {
    return { key: today.subtract({ days: k }).toDate() };
  }) as reaviz.ChartShallowDataShape[];

  // TODO(ayvi): add year filter
  const start_date: string = now(LOCAL_TZ).subtract({ days: 365 }).toString().substring(0, 10);
  const end_date: string = now(LOCAL_TZ).toString().substring(0, 10);

  const [data, setData] = React.useState<reaviz.ChartShallowDataShape[]>(defaultGraphData);
  ReactUse.useOnceEffect(() => {
    const query_dailies_complete = async (): Promise<void> => {
      await invoke<DailiesCompleteDataPoint[]>("query_dailies_complete", {
        user: user.name,
        start_date: start_date,
        end_date: end_date,
      })
        .then((result: DailiesCompleteDataPoint[]) =>
          setData(
            Array.from(result, (v: DailiesCompleteDataPoint) => {
              return { key: parseDate(v.date).toDate(LOCAL_TZ), data: v.value * 100 };
            }),
          ),
        )
        .catch(console.error);
    };
    query_dailies_complete();
  }, [user]);

  const { value: visible, setTrue } = ReactUse.useBoolean(false);
  ReactUse.useUpdateEffect(() => {
    const toggle_visible = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTrue();
    };
    toggle_visible();
  }, [data, setTrue]);

  return visible ? (
    <div className="m-5">
      <div className="flex flex-row items-center">
        <heroui.ScrollShadow
          hideScrollBar
          className="flex w-full flex-row-reverse"
          offset={50}
          orientation="horizontal"
          size={10}
          visibility="both"
        >
          <div className="flex p-2">
            <CalendarHeatmap
              data={data}
              height={250}
              margins={[5, 5]}
              series={
                <HeatmapSeries
                  cell={
                    <HeatmapCell
                      tooltip={
                        <reaviz.ChartTooltip
                          className="text-xs"
                          content={(d: reaviz.HeatmapCellProps) =>
                            d &&
                            `${reaviz.formatValue(d.data.metadata.date)} ∙ ${d.data?.value ? reaviz.formatValue(d.data.value) : ""}%`
                          }
                        />
                      }
                    />
                  }
                  colorScheme={"RdYlGn"}
                  emptyColor="transparent"
                  padding={0.3}
                />
              }
              view="year"
              width={1850}
            />
          </div>
        </heroui.ScrollShadow>
        <reaviz.SequentialLegend
          className="!h-[180px]"
          colorScheme={reaviz.schemes.RdYlGn}
          data={data}
          gradientClassName="!w-[20px]"
        />
      </div>
    </div>
  ) : (
    <div className="flex size-full cursor-wait place-items-center opacity-50">
      <Skeleton className="dark m-5 size-full rounded-2xl" />
    </div>
  );
}

type DailiesCompleteDataPoint = {
  date: string;
  value: number;
};

/*
The components below are copied/modified versions of the components from the reaviz library.

Changes to HeatmapCell:
- Remove {...extras.style,} from style from final cell render.
  - This was overriding the cell fill and causing the cell to be transparent.
- Make onMouseEnter/onMouseLeave/onClick callbacks conditional. Previous version called even if they did not exist, causing an error.
- Check for undefined stroke/fill before chroma call.
- Custom symbol render.

Changes to CalendarHeatmap:
- Custom x axis.
*/

const CalendarHeatmap: React.FC<Partial<reaviz.CalendarHeatmapProps>> = ({
  view = "year",
  data,
  series,
  ...rest
}) => {
  const {
    data: domainData,
    yDomain,
    xDomain,
    start,
  } = React.useMemo(
    () =>
      data
        ? reaviz.buildDataScales(data, view)
        : { data: [], yDomain: null, xDomain: null, start: null },
    [data, view],
  );

  // For month, only pass 1 tick value
  const xTickValues = view === "year" ? undefined : [1];

  const getDayOfWeek = React.useCallback((day: number) => reaviz.weekDays[day], []);

  // Get the yAxis label formatting based on view type
  const yAxisLabelFormat = React.useMemo(
    () => (view === "year" ? getDayOfWeek : () => null),
    [getDayOfWeek, view],
  );

  // Format the xAxis label for the start + n week
  const xAxisLabelFormat = React.useCallback(
    (weeks: number) =>
      reaviz.addWeeksToDate(start, weeks).toLocaleString("default", { month: "long" }),
    [start],
  );

  return (
    <reaviz.Heatmap
      {...rest}
      data={domainData}
      series={series}
      xAxis={
        <reaviz.LinearXAxis
          axisLine={null}
          domain={xDomain}
          tickSeries={
            <reaviz.LinearXAxisTickSeries
              label={
                <reaviz.LinearXAxisTickLabel
                  align="end"
                  fill={"#8F979F"}
                  fontFamily={"sans-serif"}
                  fontSize={11}
                  format={xAxisLabelFormat}
                  padding={5}
                  position={"end"}
                  rotation={false}
                />
              }
              line={null}
              tickValues={xTickValues}
            />
          }
          type="category"
        />
      }
      yAxis={
        <reaviz.LinearYAxis
          axisLine={null}
          domain={yDomain}
          tickSeries={
            <reaviz.LinearYAxisTickSeries
              label={<reaviz.LinearYAxisTickLabel format={yAxisLabelFormat} padding={5} />}
              line={null}
              tickSize={20}
            />
          }
          type="category"
        />
      }
    />
  );
};

interface HeatmapSeriesProps {
  padding: number;
  id: string;
  data: reaviz.ChartInternalNestedDataShape[];
  xScale: ScaleBand<string>;
  yScale: ScaleBand<string>;
  colorScheme: reaviz.ColorSchemeType | reaviz.ColorSchemeStyleArray;
  emptyColor: string;
  animated: boolean;
  cell: React.ReactElement<reaviz.HeatmapCellProps, typeof HeatmapCell>;
  selections?: unknown;
}

const HeatmapSeries: React.FC<Partial<HeatmapSeriesProps>> = props => {
  const {
    animated,
    emptyColor,
    colorScheme,
    cell: cellElement,
    xScale,
    yScale,
    data,
    id,
    selections,
  } = reaviz.mergeDefaultProps(HEATMAP_SERIES_DEFAULT_PROPS, props);

  const valueScales = reaviz.createColorSchemeValueScales(
    data,
    colorScheme,
    emptyColor,
    selections,
  );
  const height = yScale.bandwidth();
  const width = xScale.bandwidth();
  const cellCount = [...yScale.domain(), ...xScale.domain()].length;

  const renderCell = ({
    row,
    cell,
    rowIndex,
    cellIndex,
    width,
    height,
    cellCount,
  }: {
    row: reaviz.ChartInternalNestedDataShape;
    cell: reaviz.ChartInternalShallowDataShape;
    rowIndex: number;
    cellIndex: number;
    width: number;
    height: number;
    cellCount: number;
  }): React.ReactElement => {
    const x = xScale(row.key as string);
    const y = yScale(cell.x as string);
    const style = reaviz.getColorSchemeStyles(cell, valueScales);

    return (
      <CloneElement<reaviz.HeatmapCellProps>
        key={`${id}-${rowIndex}-${cellIndex}`}
        animated={animated}
        cellCount={cellCount}
        cellIndex={rowIndex + cellIndex}
        data={cell}
        element={cellElement}
        fill={style?.fill}
        height={height}
        stroke={style?.stroke}
        style={style}
        width={width}
        x={x}
        y={y}
      />
    );
  };

  return (
    <React.Fragment>
      {data.map((row: reaviz.ChartInternalNestedDataShape, rowIndex: number) =>
        row.data.map((cell: reaviz.ChartInternalShallowDataShape, cellIndex: number) =>
          renderCell({
            row,
            cell,
            rowIndex,
            cellIndex,
            width,
            height,
            cellCount,
          }),
        ),
      )}
    </React.Fragment>
  );
};

type HeatmapCellProps = {
  x: number;
  y: number;
  rx: number;
  ry: number;
  height: number;
  width: number;
  cellCount: number;
  tooltip: React.ReactElement<reaviz.ChartTooltipProps, typeof reaviz.ChartTooltip> | null;
  fill: string;
  stroke: string;
  symbol?: (data: reaviz.ChartInternalShallowDataShape) => React.ReactNode;
  data: reaviz.ChartInternalShallowDataShape;
  animated: boolean;
  cellIndex: number;
  cursor: string;
  onClick: (event: {
    value: reaviz.ChartInternalShallowDataShape;
    event: React.MouseEvent;
  }) => void;
  onMouseEnter: (event: React.PointerEvent<SVGElement>) => void;
  onMouseLeave: (event: React.PointerEvent<SVGElement>) => void;
} & reaviz.PropFunctionTypes;

// Set padding modifier for the tooltips
const modifiers = [offset({ mainAxis: 0, crossAxis: 3 })];

const HeatmapCell: React.FC<Partial<HeatmapCellProps>> = ({
  rx = 2,
  ry = 2,
  cursor = "auto",
  tooltip = <reaviz.ChartTooltip modifiers={[flip()]} />,
  onClick,
  onMouseEnter,
  onMouseLeave,
  data,
  animated,
  cellIndex,
  cellCount,
  fill,
  stroke,
  x,
  y,
  style,
  className,
  ...rest
}) => {
  const [active, setActive] = React.useState(false);
  const rect = React.useRef<SVGRectElement | null>(null);

  const { pointerOut, pointerOver } = reaviz.useHoverIntent({
    onPointerOver: event => {
      setActive(true);
      if (onMouseEnter)
        onMouseEnter({
          value: data,
          // @ts-expect-error: missing properties
          nativeEvent: event,
        });
    },
    onPointerOut: event => {
      setActive(false);
      if (onMouseLeave)
        onMouseLeave({
          value: data!,
          // @ts-expect-error: missing properties
          nativeEvent: event,
        });
    },
  });

  const onMouseClick = React.useCallback(
    (event: React.MouseEvent) => {
      if (onClick)
        onClick({
          value: data!,
          // @ts-expect-error: missing properties
          nativeEvent: event,
        });
    },
    [data, onClick],
  );

  const tooltipData = React.useMemo(
    () => ({
      y: data?.value,
      x: `${data?.key} ∙ ${data?.x}`,
      data,
    }),
    [data],
  );

  const transition = React.useMemo(() => {
    if (animated) {
      return {
        ...reaviz.DEFAULT_TRANSITION,
        delay: cellIndex && cellCount ? (cellIndex / cellCount) * 0.005 : 0,
      };
    } else {
      return {
        type: false as const,
        delay: 0,
      };
    }
  }, [animated, cellIndex, cellCount]);

  const extras = reaviz.constructFunctionProps({ style, className }, data);
  const isTransparent = fill === "transparent";
  const appliedStroke =
    active && stroke && fill && !isTransparent
      ? chroma(stroke || fill)
          .brighten(1)
          .hex()
      : stroke || fill;

  const ariaLabelData = React.useMemo(
    () => reaviz.getAriaLabel({ ...tooltipData, data: null }),
    [tooltipData],
  );

  const renderedSymbol = React.useMemo((): React.ReactElement => {
    if (!(rect.current && data)) return <text />;

    const box: DOMRect = rect.current.getBBox();

    return (
      <text
        key={data.key?.toString()}
        className="text-[0.55rem] text-white"
        dominantBaseline="central"
        stroke={chroma(appliedStroke as string)
          .darken(2)
          .hex()}
        textAnchor="middle"
        x={+`${x}` + +`${box.width}` / 2}
        y={+`${y}` + +`${box.height}` / 2}
        onClick={onMouseClick}
        onPointerOut={pointerOut}
        onPointerOver={pointerOver}
      >
        {(+`${data.value}`).toFixed(0)}%
      </text>
    );
  }, [data, appliedStroke, x, y, onMouseClick, pointerOut, pointerOver]);

  return (
    <React.Fragment>
      <g ref={rect}>
        <motion.rect
          {...rest}
          animate={{ opacity: 1 }}
          aria-label={ariaLabelData}
          className={extras.className}
          exit={{ opacity: 0 }}
          fill={fill}
          initial={{ opacity: 0 }}
          role="graphics-document"
          rx={rx}
          ry={ry}
          stroke={appliedStroke}
          style={{ cursor }}
          tabIndex={0}
          transition={transition}
          x={x}
          y={y}
          onClick={onMouseClick}
          onPointerOut={pointerOut}
          onPointerOver={pointerOver}
        />
        {renderedSymbol}
      </g>
      {tooltip && !(tooltip.props as reaviz.ChartTooltipProps).disabled && !isTransparent && (
        <CloneElement<reaviz.ChartTooltipProps>
          element={tooltip}
          modifiers={(tooltip.props as reaviz.ChartTooltipProps).modifiers || modifiers}
          reference={rect}
          value={tooltipData}
          visible={active}
        />
      )}
    </React.Fragment>
  );
};

const HEATMAP_SERIES_DEFAULT_PROPS: Partial<HeatmapSeriesProps> = {
  padding: 0.1,
  animated: true,
  emptyColor: "rgba(200,200,200,0.08)",
  colorScheme: ["rgba(28, 107, 86, 0.5)", "#2da283"],
  cell: <HeatmapCell />,
};

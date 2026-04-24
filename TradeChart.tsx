/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, AreaSeries } from 'lightweight-charts';

interface TradeChartProps {
  data: { time: string; value: number }[];
  height?: number;
  dark: boolean;
}

export function TradeChart({ data, height = 300, dark }: TradeChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    if (!data || data.length < 1) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af', // --t2
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      },
      grid: {
        vertLines: { color: '#1f2937', style: 1 }, // --b1
        horzLines: { color: '#1f2937', style: 1 }, // --b1
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      timeScale: {
        borderColor: '#1f2937',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: '#1f2937',
      },
      handleScroll: false,
      handleScale: false,
    });

    chartRef.current = chart;

    const series = chart.addSeries(AreaSeries, {
      lineColor: '#10b981', // --g
      topColor: 'rgba(16, 185, 129, 0.2)', // --gBg
      bottomColor: 'rgba(16, 185, 129, 0)',
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    });

    series.setData(data);
    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || !entries[0].contentRect) return;
      const { width } = entries[0].contentRect;
      chart.applyOptions({ width });
      chart.timeScale().fitContent();
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [data, dark, height]);

  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      {!data || data.length < 1 ? (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: 12 }}>
          Insufficient data for curve
        </div>
      ) : (
        <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
      )}
    </div>
  );
}

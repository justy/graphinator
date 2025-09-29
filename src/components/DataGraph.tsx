import React from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts'
import { format } from 'date-fns'
import { DataSeries, GraphConfig } from '@/types/data'

interface DataGraphProps {
  config: GraphConfig
}

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16'
]

export default function DataGraph({ config }: DataGraphProps) {
  const chartData = prepareChartData(config.series)
  const chartType = config.series[0]?.type || 'line'

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem)
    // Show year if the data spans multiple years
    const firstDate = new Date(chartData[0]?.timestamp || tickItem)
    const lastDate = new Date(chartData[chartData.length - 1]?.timestamp || tickItem)

    if (firstDate.getFullYear() !== lastDate.getFullYear()) {
      return format(date, 'MMM dd, yyyy')
    }
    return format(date, 'MMM dd')
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold mb-2">
            {format(new Date(label || ''), 'PPP')}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value?.toLocaleString()} {entry.payload.unit || ''}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              stroke="#6B7280"
            />
            <YAxis stroke="#6B7280" />
            <Tooltip content={<CustomTooltip />} />
            {config.showLegend !== false && <Legend />}
            {config.series.map((series, index) => (
              <Bar
                key={series.id}
                dataKey={series.id}
                name={series.name}
                fill={series.color || COLORS[index % COLORS.length]}
                unit={series.unit}
              />
            ))}
          </BarChart>
        )

      case 'area':
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              stroke="#6B7280"
            />
            <YAxis stroke="#6B7280" />
            <Tooltip content={<CustomTooltip />} />
            {config.showLegend !== false && <Legend />}
            {config.series.map((series, index) => (
              <Area
                key={series.id}
                type="monotone"
                dataKey={series.id}
                name={series.name}
                stroke={series.color || COLORS[index % COLORS.length]}
                fill={series.color || COLORS[index % COLORS.length]}
                fillOpacity={0.6}
                unit={series.unit}
              />
            ))}
          </AreaChart>
        )

      default:
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              stroke="#6B7280"
            />
            <YAxis stroke="#6B7280" />
            <Tooltip content={<CustomTooltip />} />
            {config.showLegend !== false && <Legend />}
            {config.series.map((series, index) => (
              <Line
                key={series.id}
                type="monotone"
                dataKey={series.id}
                name={series.name}
                stroke={series.color || COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={false}
                unit={series.unit}
              />
            ))}
          </LineChart>
        )
    }
  }

  return (
    <div className="w-full bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
        {config.title}
      </h2>
      <ResponsiveContainer width="100%" height={400}>
        {renderChart()}
      </ResponsiveContainer>
      {config.xAxisLabel && (
        <p className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
          {config.xAxisLabel}
        </p>
      )}
    </div>
  )
}

function prepareChartData(series: DataSeries[]) {
  const dataMap = new Map<string, any>()

  series.forEach(s => {
    s.data.forEach(point => {
      const key = point.timestamp.toISOString()
      if (!dataMap.has(key)) {
        dataMap.set(key, {
          timestamp: key,
          unit: s.unit
        })
      }
      dataMap.get(key)[s.id] = point.value
      if (s.unit) {
        dataMap.get(key).unit = s.unit
      }
    })
  })

  return Array.from(dataMap.values()).sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
}
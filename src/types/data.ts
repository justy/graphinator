export interface DataPoint {
  timestamp: Date
  value: number
  label?: string
}

export interface DataSeries {
  id: string
  name: string
  data: DataPoint[]
  unit?: string
  color?: string
  type?: 'line' | 'bar' | 'area'
}

export interface DataSource {
  id: string
  name: string
  type: 'csv' | 'json' | 'api'
  url?: string
  file?: File
  transformConfig?: TransformConfig
  lastUpdated?: Date
}

export interface TransformConfig {
  timestampField: string
  valueField: string
  labelField?: string
  dateFormat?: string
  aggregation?: 'sum' | 'average' | 'min' | 'max'
  filter?: {
    field: string
    operator: 'equals' | 'contains' | 'greater' | 'less'
    value: string | number
  }[]
}

export interface GraphConfig {
  title: string
  xAxisLabel?: string
  yAxisLabel?: string
  showLegend?: boolean
  showGrid?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  series: DataSeries[]
}
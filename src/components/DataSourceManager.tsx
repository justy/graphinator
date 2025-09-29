import React, { useState } from 'react'
import { DataSource, TransformConfig } from '@/types/data'

interface DataSourceManagerProps {
  onAddSource: (source: DataSource) => void
  sources: DataSource[]
}

export default function DataSourceManager({ onAddSource, sources }: DataSourceManagerProps) {
  const [sourceType, setSourceType] = useState<'csv' | 'json' | 'api'>('api')
  const [sourceName, setSourceName] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [timestampField, setTimestampField] = useState('timestamp')
  const [valueField, setValueField] = useState('value')
  const [dateFormat, setDateFormat] = useState('')
  const [urlDateFormat, setUrlDateFormat] = useState('ddMMyyyy')

  const handleAddSource = () => {
    if (!sourceName) {
      alert('Please enter a source name')
      return
    }

    if (sourceType === 'api' && !sourceUrl) {
      alert('Please enter an API URL')
      return
    }

    if ((sourceType === 'csv' || sourceType === 'json') && !selectedFile) {
      alert('Please select a file')
      return
    }

    const transformConfig: TransformConfig = {
      timestampField,
      valueField,
      dateFormat: dateFormat || undefined,
      urlDateFormat: urlDateFormat || 'ddMMyyyy'
    }

    const newSource: DataSource = {
      id: `source-${Date.now()}`,
      name: sourceName,
      type: sourceType,
      url: sourceType === 'api' ? sourceUrl : undefined,
      file: selectedFile || undefined,
      transformConfig,
      lastUpdated: new Date()
    }

    onAddSource(newSource)

    setSourceName('')
    setSourceUrl('')
    setSelectedFile(null)
    setTimestampField('timestamp')
    setValueField('value')
    setDateFormat('')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg mb-6">
      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
        Add Data Source
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Source Type
          </label>
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as 'csv' | 'json' | 'api')}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="api">API</option>
            <option value="json">JSON File</option>
            <option value="csv">CSV File</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Source Name
          </label>
          <input
            type="text"
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            placeholder="e.g., Weather Data"
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>

        {sourceType === 'api' && (
          <>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API URL Template
              </label>
              <input
                type="text"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="http://api.example.com/daily?date={{date}}"
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Use {"{{date}}"} where the date should be inserted (will fetch data for each day in the graph date range)
              </p>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL Date Format
              </label>
              <input
                type="text"
                value={urlDateFormat}
                onChange={(e) => setUrlDateFormat(e.target.value)}
                placeholder="ddMMyyyy"
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Format for {"{{date}}"} in URL (e.g., ddMMyyyy for 24092025, yyyy-MM-dd for 2025-09-24)
              </p>
            </div>
          </>
        )}

        {(sourceType === 'csv' || sourceType === 'json') && (
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select File
            </label>
            <input
              type="file"
              accept={sourceType === 'csv' ? '.csv' : '.json'}
              onChange={handleFileChange}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Timestamp Field
          </label>
          <input
            type="text"
            value={timestampField}
            onChange={(e) => setTimestampField(e.target.value)}
            placeholder="timestamp"
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Value Field
          </label>
          <input
            type="text"
            value={valueField}
            onChange={(e) => setValueField(e.target.value)}
            placeholder="value"
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date Format (optional)
          </label>
          <input
            type="text"
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value)}
            placeholder="e.g., yyyy-MM-dd or dd/MM/yyyy"
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      <button
        onClick={handleAddSource}
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Add Source
      </button>

      {sources.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-3">
            Active Sources
          </h4>
          <div className="space-y-2">
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
              >
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {source.name}
                  </span>
                  <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                    ({source.type})
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {source.lastUpdated?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
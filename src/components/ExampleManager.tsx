import React, { useState } from 'react'
import { Example, ExampleDataSource, PREDEFINED_EXAMPLES } from '@/types/examples'
import { DataSeries } from '@/types/data'

interface ExampleManagerProps {
  onLoadExample: (example: Example) => void
  onClose: () => void
}

export default function ExampleManager({ onLoadExample, onClose }: ExampleManagerProps) {
  const [examples, setExamples] = useState<Example[]>(PREDEFINED_EXAMPLES)
  const [selectedExample, setSelectedExample] = useState<Example | null>(null)
  const [editingExample, setEditingExample] = useState<Example | null>(null)

  const handleDuplicate = (example: Example) => {
    const newExample: Example = {
      ...example,
      id: `${example.id}-copy-${Date.now()}`,
      name: `${example.name} (Copy)`,
      editable: true,
      dataSources: example.dataSources.map(ds => ({
        ...ds,
        id: `${ds.id}-copy-${Date.now()}`
      }))
    }
    setExamples([...examples, newExample])
    setEditingExample(newExample)
  }

  const handleSave = (example: Example) => {
    setExamples(examples.map(e => e.id === example.id ? example : e))
    setEditingExample(null)
  }

  const handleDelete = (id: string) => {
    setExamples(examples.filter(e => e.id !== id))
  }

  const handleLoad = (example: Example) => {
    onLoadExample(example)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Example Manager
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {editingExample ? (
            <ExampleEditor
              example={editingExample}
              onSave={handleSave}
              onCancel={() => setEditingExample(null)}
            />
          ) : (
            <div className="grid gap-4">
              {examples.map(example => (
                <div
                  key={example.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {example.name}
                        </h3>
                        {example.category && (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            example.category === 'weather' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            example.category === 'solar' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            example.category === 'combined' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}>
                            {example.category}
                          </span>
                        )}
                        {example.editable && (
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            custom
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {example.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {example.dataSources.map(ds => (
                          <div
                            key={ds.id}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs"
                            style={{ borderLeft: `3px solid ${ds.color || '#666'}` }}
                          >
                            {ds.name}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleLoad(example)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDuplicate(example)}
                        className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                      >
                        Duplicate
                      </button>
                      {example.editable && (
                        <>
                          <button
                            onClick={() => setEditingExample(example)}
                            className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(example.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ExampleEditor({ example, onSave, onCancel }: {
  example: Example
  onSave: (example: Example) => void
  onCancel: () => void
}) {
  const [editedExample, setEditedExample] = useState(example)

  const updateDataSource = (index: number, updates: Partial<ExampleDataSource>) => {
    const newDataSources = [...editedExample.dataSources]
    newDataSources[index] = { ...newDataSources[index], ...updates }
    setEditedExample({ ...editedExample, dataSources: newDataSources })
  }

  const removeDataSource = (index: number) => {
    const newDataSources = editedExample.dataSources.filter((_, i) => i !== index)
    setEditedExample({ ...editedExample, dataSources: newDataSources })
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Example Name
        </label>
        <input
          type="text"
          value={editedExample.name}
          onChange={(e) => setEditedExample({ ...editedExample, name: e.target.value })}
          className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <input
          type="text"
          value={editedExample.description}
          onChange={(e) => setEditedExample({ ...editedExample, description: e.target.value })}
          className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
        />
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Data Sources
        </h4>
        {editedExample.dataSources.map((ds, index) => (
          <div key={ds.id} className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="text"
                value={ds.name}
                onChange={(e) => updateDataSource(index, { name: e.target.value })}
                placeholder="Source name"
                className="p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-sm"
              />
              <select
                value={ds.chartType || 'line'}
                onChange={(e) => updateDataSource(index, { chartType: e.target.value as any })}
                className="p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-sm"
              >
                <option value="line">Line</option>
                <option value="area">Area</option>
                <option value="bar">Bar</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={ds.config.timestampField}
                onChange={(e) => updateDataSource(index, {
                  config: { ...ds.config, timestampField: e.target.value }
                })}
                placeholder="Timestamp field"
                className="p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-sm"
              />
              <input
                type="text"
                value={ds.config.valueField}
                onChange={(e) => updateDataSource(index, {
                  config: { ...ds.config, valueField: e.target.value }
                })}
                placeholder="Value field"
                className="p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-sm"
              />
              <button
                onClick={() => removeDataSource(index)}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(editedExample)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </div>
  )
}
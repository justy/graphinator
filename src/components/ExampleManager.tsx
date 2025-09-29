import React, { useState, useEffect } from 'react'
import { Example, ExampleDataSource, PREDEFINED_EXAMPLES, AVAILABLE_DATA_SOURCES, DataSourceTemplate, PREDEFINED_LOCATIONS, Location } from '@/types/examples'
import { DataSeries } from '@/types/data'

interface ExampleManagerProps {
  onLoadExample: (example: Example) => void
  onClose: () => void
}

const STORAGE_KEY = 'graphinator-custom-examples'

export default function ExampleManager({ onLoadExample, onClose }: ExampleManagerProps) {
  // Load examples from localStorage on mount
  const [examples, setExamples] = useState<Example[]>(() => {
    if (typeof window === 'undefined') return PREDEFINED_EXAMPLES

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const customExamples = JSON.parse(stored)
        // Merge predefined and custom examples
        return [...PREDEFINED_EXAMPLES, ...customExamples]
      }
    } catch (error) {
      console.error('Failed to load custom examples:', error)
    }
    return PREDEFINED_EXAMPLES
  })
  const [selectedExample, setSelectedExample] = useState<Example | null>(null)
  const [editingExample, setEditingExample] = useState<Example | null>(null)

  // Save custom examples to localStorage whenever they change
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      // Filter out predefined examples (non-editable) and save only custom ones
      const customExamples = examples.filter(e => e.editable)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customExamples))
    } catch (error) {
      console.error('Failed to save custom examples:', error)
    }
  }, [examples])

  const handleCreateNew = () => {
    const newExample: Example = {
      id: `custom-${Date.now()}`,
      name: 'New Custom Example',
      description: 'Custom data visualization',
      dataSources: [],
      editable: true,
      category: 'custom'
    }
    setExamples([...examples, newExample])
    setEditingExample(newExample)
  }

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

  const handleClearCustom = () => {
    if (confirm('Are you sure you want to delete all custom examples? This cannot be undone.')) {
      setExamples(PREDEFINED_EXAMPLES)
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Example Manager
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
              >
                + Create New Example
              </button>
              {examples.some(e => e.editable) && (
                <button
                  onClick={handleClearCustom}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
                >
                  Clear Custom
                </button>
              )}
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
  const [showDataSourcePicker, setShowDataSourcePicker] = useState(false)
  const [editingDataSourceIndex, setEditingDataSourceIndex] = useState<number | null>(null)

  const updateDataSource = (index: number, updates: Partial<ExampleDataSource>) => {
    const newDataSources = [...editedExample.dataSources]
    newDataSources[index] = { ...newDataSources[index], ...updates }
    setEditedExample({ ...editedExample, dataSources: newDataSources })
  }

  const removeDataSource = (index: number) => {
    const newDataSources = editedExample.dataSources.filter((_, i) => i !== index)
    setEditedExample({ ...editedExample, dataSources: newDataSources })
  }

  const duplicateDataSource = (index: number) => {
    const sourceToDuplicate = editedExample.dataSources[index]
    const newDataSource: ExampleDataSource = {
      ...sourceToDuplicate,
      id: `${sourceToDuplicate.id}-copy-${Date.now()}`,
      name: `${sourceToDuplicate.name} (Copy)`
    }
    setEditedExample({
      ...editedExample,
      dataSources: [...editedExample.dataSources, newDataSource]
    })
  }

  const addDataSource = (template: DataSourceTemplate, config: any) => {
    const newDataSource: ExampleDataSource = {
      id: `${template.id}-${Date.now()}`,
      name: config.name || template.name,
      ...template.defaultConfig,
      ...config
    }
    setEditedExample({
      ...editedExample,
      dataSources: [...editedExample.dataSources, newDataSource]
    })
    setShowDataSourcePicker(false)
  }

  const updateExistingDataSource = (index: number, template: DataSourceTemplate, config: any) => {
    const updatedDataSource: ExampleDataSource = {
      id: editedExample.dataSources[index].id,  // Keep the same ID
      name: config.name || template.name,
      ...template.defaultConfig,
      ...config
    }
    const newDataSources = [...editedExample.dataSources]
    newDataSources[index] = updatedDataSource
    setEditedExample({ ...editedExample, dataSources: newDataSources })
    setEditingDataSourceIndex(null)
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
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Data Sources
          </h4>
          <button
            onClick={() => setShowDataSourcePicker(true)}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            + Add Data Source
          </button>
        </div>

        {showDataSourcePicker && (
          <DataSourcePicker
            onSelect={addDataSource}
            onCancel={() => setShowDataSourcePicker(false)}
          />
        )}

        {editingDataSourceIndex !== null && (
          <DataSourcePicker
            initialDataSource={editedExample.dataSources[editingDataSourceIndex]}
            onSelect={(template, config) => updateExistingDataSource(editingDataSourceIndex, template, config)}
            onCancel={() => setEditingDataSourceIndex(null)}
            isEditing={true}
          />
        )}

        {editedExample.dataSources.map((ds, index) => (
          <div key={ds.id} className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={ds.name}
                  onChange={(e) => updateDataSource(index, { name: e.target.value })}
                  placeholder="Source name"
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-sm font-medium mb-2"
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  {ds.weatherVariable && (
                    <div>Weather: {ds.weatherVariable}</div>
                  )}
                  {ds.latitude && ds.longitude && (
                    <div>Location: {ds.latitude}, {ds.longitude}</div>
                  )}
                  {ds.config.valueField && (
                    <div>Field: {ds.config.valueField}</div>
                  )}
                  {ds.urlTemplate && (
                    <div className="truncate">URL: {ds.urlTemplate}</div>
                  )}
                </div>
              </div>
              <div className="flex gap-1 ml-2">
                <button
                  onClick={() => setEditingDataSourceIndex(index)}
                  className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                  title="Edit data source"
                >
                  Edit
                </button>
                <button
                  onClick={() => duplicateDataSource(index)}
                  className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                  title="Duplicate data source"
                >
                  Copy
                </button>
                <button
                  onClick={() => removeDataSource(index)}
                  className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                  title="Remove data source"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={ds.chartType || 'line'}
                onChange={(e) => updateDataSource(index, { chartType: e.target.value as any })}
                className="px-2 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-sm"
              >
                <option value="line">Line</option>
                <option value="area">Area</option>
                <option value="bar">Bar</option>
              </select>
              <div
                className="px-2 py-1 rounded text-sm"
                style={{ backgroundColor: ds.color || '#666', color: 'white' }}
              >
                Color: {ds.color || 'Auto'}
              </div>
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

function DataSourcePicker({ onSelect, onCancel, initialDataSource, isEditing }: {
  onSelect: (template: DataSourceTemplate, config: any) => void
  onCancel: () => void
  initialDataSource?: ExampleDataSource
  isEditing?: boolean
}) {
  // Initialize template and config from existing data source if editing
  const [selectedTemplate, setSelectedTemplate] = useState<DataSourceTemplate | null>(() => {
    if (!initialDataSource) return null

    // Determine template based on data source properties
    if (initialDataSource.weatherVariable) {
      return AVAILABLE_DATA_SOURCES.find(t => t.id === 'weather') || null
    } else if (initialDataSource.urlTemplate?.includes('sungrow_api')) {
      return AVAILABLE_DATA_SOURCES.find(t => t.id === 'solar') || null
    }
    return null
  })

  const [config, setConfig] = useState<any>(() => {
    if (!initialDataSource) return {}

    // Check if the coordinates match a predefined location
    let selectedLocation = 'custom'
    if (initialDataSource.latitude && initialDataSource.longitude) {
      const matchingLocation = PREDEFINED_LOCATIONS.find(
        loc => Math.abs(loc.latitude - initialDataSource.latitude) < 0.01 &&
               Math.abs(loc.longitude - initialDataSource.longitude) < 0.01
      )
      if (matchingLocation) {
        selectedLocation = matchingLocation.name
      }
    }

    return {
      name: initialDataSource.name,
      chartType: initialDataSource.chartType || 'line',
      weatherVariable: initialDataSource.weatherVariable,
      field: initialDataSource.config?.valueField,
      latitude: initialDataSource.latitude?.toString(),
      longitude: initialDataSource.longitude?.toString(),
      selectedLocation,
      color: initialDataSource.color
    }
  })

  const handleSelect = () => {
    if (!selectedTemplate) return

    // Determine the default name based on the selected field
    let defaultName = selectedTemplate.name

    if (selectedTemplate.type === 'weather' && config.weatherVariable) {
      const variable = selectedTemplate.weatherVariables?.find(v => v.value === config.weatherVariable)
      if (variable) {
        const locationName = config.selectedLocation && config.selectedLocation !== 'custom'
          ? config.selectedLocation
          : 'Custom Location'
        defaultName = `${variable.label} - ${locationName}`
      }
    } else if (selectedTemplate.type === 'solar' && config.field) {
      const field = selectedTemplate.availableFields?.find(f => f.value === config.field)
      if (field) {
        defaultName = field.label
      }
    }

    // Build configuration based on template type
    const finalConfig: any = {
      name: config.name || defaultName,
      chartType: config.chartType || selectedTemplate.defaultConfig?.chartType || 'line',
      color: config.color || (isEditing ? initialDataSource?.color : null) || getNextColor()
    }

    if (selectedTemplate.type === 'weather') {
      // Parse coordinates, ensuring they're valid numbers
      const lat = parseFloat(config.latitude)
      const lon = parseFloat(config.longitude)

      finalConfig.latitude = !isNaN(lat) ? lat : selectedTemplate.defaultConfig?.latitude
      finalConfig.longitude = !isNaN(lon) ? lon : selectedTemplate.defaultConfig?.longitude
      finalConfig.weatherVariable = config.weatherVariable
      finalConfig.config = {
        timestampField: 'timestamp',
        valueField: 'value'
      }
    } else if (selectedTemplate.type === 'solar') {
      finalConfig.urlTemplate = selectedTemplate.defaultConfig?.urlTemplate
      finalConfig.config = {
        ...selectedTemplate.defaultConfig?.config,
        valueField: config.field || 'generated'
      }
    }

    onSelect(selectedTemplate, finalConfig)
  }

  const getNextColor = () => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6']
    return colors[Math.floor(Math.random() * colors.length)]
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">{isEditing ? 'Edit Data Source' : 'Add Data Source'}</h3>

        {!selectedTemplate && !isEditing ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Select a data source type:</p>
            {AVAILABLE_DATA_SOURCES.map(template => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              >
                <h4 className="font-semibold">{template.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
              <h4 className="font-semibold">{selectedTemplate.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{selectedTemplate.description}</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Display Name</label>
              <input
                type="text"
                value={config.name || ''}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                placeholder={(() => {
                  if (selectedTemplate.type === 'weather' && config.weatherVariable) {
                    const variable = selectedTemplate.weatherVariables?.find(v => v.value === config.weatherVariable)
                    return variable ? `${variable.label} (${variable.unit})` : 'Select a variable first'
                  } else if (selectedTemplate.type === 'solar' && config.field) {
                    const field = selectedTemplate.availableFields?.find(f => f.value === config.field)
                    return field ? field.label : 'Select a field first'
                  }
                  return selectedTemplate.name
                })()}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
              />
            </div>

            {selectedTemplate.type === 'weather' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Weather Variable</label>
                  <select
                    value={config.weatherVariable || ''}
                    onChange={(e) => setConfig({ ...config, weatherVariable: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
                  >
                    <option value="">Select a variable</option>
                    {selectedTemplate.weatherVariables?.map(variable => (
                      <option key={variable.value} value={variable.value}>
                        {variable.label} ({variable.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <div className="space-y-2">
                    <select
                      value={config.selectedLocation || 'custom'}
                      onChange={(e) => {
                        const locationName = e.target.value
                        if (locationName === 'custom') {
                          setConfig({ ...config, selectedLocation: 'custom' })
                        } else {
                          const location = PREDEFINED_LOCATIONS.find(l => l.name === locationName)
                          if (location) {
                            setConfig({
                              ...config,
                              selectedLocation: locationName,
                              latitude: location.latitude.toString(),
                              longitude: location.longitude.toString()
                            })
                          }
                        }
                      }}
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
                    >
                      <option value="custom">Custom Location</option>
                      <optgroup label="Australia">
                        {PREDEFINED_LOCATIONS.filter(l => l.country === 'Australia').map(location => (
                          <option key={location.name} value={location.name}>
                            {location.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="International">
                        {PREDEFINED_LOCATIONS.filter(l => l.country !== 'Australia').map(location => (
                          <option key={location.name} value={location.name}>
                            {location.name}, {location.country}
                          </option>
                        ))}
                      </optgroup>
                    </select>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Latitude</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={config.latitude || ''}
                          onChange={(e) => setConfig({
                            ...config,
                            latitude: e.target.value,
                            selectedLocation: 'custom'
                          })}
                          placeholder="-34.2900"
                          className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Longitude</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={config.longitude || ''}
                          onChange={(e) => setConfig({
                            ...config,
                            longitude: e.target.value,
                            selectedLocation: 'custom'
                          })}
                          placeholder="150.9480"
                          className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {selectedTemplate.type === 'solar' && (
              <div>
                <label className="block text-sm font-medium mb-2">Data Field</label>
                <select
                  value={config.field || ''}
                  onChange={(e) => setConfig({ ...config, field: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
                >
                  <option value="">Select a field</option>
                  {selectedTemplate.availableFields?.map(field => (
                    <option key={field.value} value={field.value}>
                      {field.label} - {field.description}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Chart Type</label>
                <select
                  value={config.chartType || selectedTemplate.defaultConfig?.chartType || 'line'}
                  onChange={(e) => setConfig({ ...config, chartType: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
                >
                  <option value="line">Line</option>
                  <option value="area">Area</option>
                  <option value="bar">Bar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.color || '#3B82F6'}
                    onChange={(e) => setConfig({ ...config, color: e.target.value })}
                    className="w-12 h-10 border border-gray-300 dark:border-gray-700 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.color || ''}
                    onChange={(e) => setConfig({ ...config, color: e.target.value })}
                    placeholder="#3B82F6"
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-6 justify-end">
          {selectedTemplate && (
            <button
              onClick={() => {
                setSelectedTemplate(null)
                setConfig({})
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back
            </button>
          )}
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
          {selectedTemplate && (
            <button
              onClick={handleSelect}
              disabled={
                (selectedTemplate.type === 'weather' && !config.weatherVariable) ||
                (selectedTemplate.type === 'solar' && !config.field)
              }
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isEditing ? 'Update Data Source' : 'Add Data Source'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
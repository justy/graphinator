# Graphinator

A flexible data visualization application for graphing time series data from multiple sources including CSV files, JSON files, and APIs.

## Features

- **Multiple Data Sources**: Import data from CSV files, JSON files, or API endpoints
- **Time Series Visualization**: Create line, bar, and area charts with proper time-based axes
- **Multi-Source Comparison**: Overlay multiple data series on the same graph for comparison
- **Built-in Integrations**:
  - Open-Meteo weather API for climate data
  - Solar generation API integration
  - Custom API endpoints
- **Appman Protocol Compliant**: Fully compatible with the Appman management protocol

## Getting Started

### Prerequisites

- Node.js 20.18.2 (specified in `.nvmrc`)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The application will be available at `http://localhost:3000`

## Usage

### Loading Example Data

1. **Weather Data**: Click "Load Weather Example" to fetch and display San Francisco weather data from Open-Meteo
2. **Solar Data**: Click "Load Solar Example" to fetch solar generation and consumption data (requires solar API at `http://sungrow_api.localhost:3000`)

### Adding Custom Data Sources

1. Select source type (CSV, JSON, or API)
2. Provide a name for your data source
3. For files: Upload your CSV or JSON file
4. For APIs: Enter the API endpoint URL
5. Configure field mappings:
   - **Timestamp Field**: The field containing date/time values
   - **Value Field**: The field containing the numeric values to graph
   - **Date Format**: Optional format string if dates need parsing

### Data Format Requirements

#### CSV Files
```csv
timestamp,value,label
2024-01-01,23.5,Temperature
2024-01-02,24.1,Temperature
```

#### JSON Files
```json
[
  {
    "timestamp": "2024-01-01",
    "value": 23.5,
    "label": "Temperature"
  }
]
```

#### API Response
APIs should return JSON in either array format (as above) or as a single object that will be converted to an array.

## API Endpoints

### Appman Protocol Endpoints

- `GET /api/appman/info` - Application information
- `GET /api/appman/health` - Health check and status
- `GET /api/appman/config` - Configuration details
- `POST /api/data` - Load data programmatically

### Data API

```bash
POST /api/data
Content-Type: application/json

{
  "source": {
    "type": "weather",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "startDate": "2024-01-01",
    "endDate": "2024-01-07",
    "variable": "temperature_2m_max"
  },
  "config": {
    "timestampField": "time",
    "valueField": "temperature_2m_max"
  }
}
```

## Configuration

The application can be configured through environment variables:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `NEXT_PUBLIC_BASE_URL` - Base URL for the application

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Recharts** - Data visualization
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **PapaParse** - CSV parsing
- **date-fns** - Date utilities

## Development

```bash
# Run linter
npm run lint

# Type checking (if configured)
npm run type-check
```

## License

MIT
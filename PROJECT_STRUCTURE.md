# DelayShield AI - Project Structure

```
delayshield-ai/
│
├── README.md                          # Project documentation
├── docs/                              # Documentation folder
│
├── client/                            # Frontend (React + Vite)
│   ├── package.json                   # Client dependencies
│   ├── vite.config.js                 # Vite configuration
│   ├── tailwind.config.js             # Tailwind CSS configuration
│   ├── postcss.config.js              # PostCSS configuration
│   ├── eslint.config.js               # ESLint configuration
│   ├── updateTheme.cjs                # Theme update script
│   ├── index.html                     # HTML entry point
│   ├── public/                        # Static assets
│   └── src/                           # Source code
│       ├── main.jsx                   # Application entry
│       ├── App.jsx                    # Root component
│       ├── App.css                    # App styles
│       ├── index.css                  # Global styles
│       ├── assets/                    # Images, fonts, etc.
│       ├── components/                # Reusable components
│       │   ├── AIExplanation.jsx
│       │   ├── AlertBanner.jsx
│       │   ├── CostAnalysis.jsx
│       │   ├── DecisionPanel.jsx
│       │   ├── HistoryPanel.jsx
│       │   ├── MapView.jsx
│       │   ├── RiskMeter.jsx
│       │   ├── ShipmentCard.jsx
│       │   ├── Sidebar.jsx
│       │   └── SimulationPanel.jsx
│       ├── pages/                    # Page components
│       │   ├── AnalyticsPage.jsx
│       │   ├── DashboardPage.jsx
│       │   ├── SettingsPage.jsx
│       │   └── ShipmentsPage.jsx
│       └── services/                 # API & data services
│           └── mockData.js
│
└── server/                            # Backend (Node.js/Express)
    ├── package.json                   # Server dependencies
    ├── .env                           # Environment variables
    ├── src/
    │   ├── app.js                     # Express app setup
    │   ├── server.js                  # Server entry point
    │   │
    │   ├── config/                    # Configuration files
    │   │   └── gemini.config.js       # Gemini API configuration
    │   │
    │   ├── constants/                 # Application constants
    │   │
    │   ├── controllers/               # Request handlers
    │   │   ├── analyze.controller.js
    │   │   ├── city.controller.js
    │   │   ├── decision.controller.js
    │   │   ├── history.controller.js
    │   │   ├── risk.controller.js
    │   │   ├── shipment.controller.js
    │   │   └── simulation.controller.js
    │   │
    │   ├── routes/                    # API route definitions
    │   │   ├── index.js               # Main routes file
    │   │   ├── analyze.routes.js
    │   │   ├── city.routes.js
    │   │   ├── decision.route.js
    │   │   ├── history.route.js
    │   │   ├── risk.route.js
    │   │   ├── shipment.route.js
    │   │   └── simulation.route.js
    │   │
    │   ├── engine/                    # Business logic engines
    │   │   ├── alerts/
    │   │   │   └── alertEngine.js     # Alert generation logic
    │   │   ├── cost/
    │   │   │   └── costengine.js      # Cost calculation logic
    │   │   ├── decision/
    │   │   │   ├── aiExplainer.js     # AI explanation logic
    │   │   │   ├── aiExplainer.test.js
    │   │   │   ├── aiplanner.js       # AI planning logic
    │   │   │   └── decisionengine.js  # Decision engine
    │   │   ├── history/
    │   │   │   └── historyEngine.js   # History tracking logic
    │   │   ├── risk/
    │   │   │   └── riskengine.js      # Risk assessment logic
    │   │   └── simulation/
    │   │       └── whatifengine.js    # What-if simulation logic
    │   │
    │   ├── data/                      # Mock/sample data
    │   │   ├── cities.js              # City data
    │   │   ├── history.js             # History data
    │   │   ├── routes.js              # Route data
    │   │   └── shipment.js            # Shipment data
    │   │
    │   ├── integrations/              # External API integrations
    │   │   ├── route.api.js           # Route/mapping API
    │   │   └── weather.api.js         # Weather API integration
    │   │
    │   └── utils/                     # Utility functions
    │       └── simulatetraffic.js     # Traffic simulation utility
    │
    └── [dev dependencies & scripts configured in package.json]
```

## Architecture Overview

### Frontend (`client/`)
- **Framework**: React + Vite
- **Styling**: Tailwind CSS + PostCSS
- **Components**: Modular UI components for shipment management and analysis
- **Pages**: Multi-page application (Dashboard, Shipments, Analytics, Settings)

### Backend (`server/`)
- **Framework**: Node.js + Express
- **Configuration**: Gemini AI API setup
- **Structure**:
  - **Controllers**: Handle incoming HTTP requests
  - **Routes**: Define API endpoints
  - **Engines**: Core business logic for different features (risk, cost, decision, simulation, alerts)
  - **Data**: Mock/sample data and database models
  - **Integrations**: External service connections (weather, routing)
  - **Utils**: Helper functions

## Key Features (by Engine)

| Engine | Purpose |
|--------|---------|
| Risk Engine | Calculates shipment risk scores |
| Cost Engine | Computes shipment costs and analysis |
| Decision Engine | AI-powered decision making with AI Explainer |
| History Engine | Tracks shipment and decision history |
| Alert Engine | Generates alerts for critical events |
| What-If Engine | Simulates different scenarios |

## Development Stack

- **Frontend**: React, Vite, Tailwind CSS, ESLint
- **Backend**: Node.js, Express, Gemini AI
- **Testing**: Jest (as seen in aiExplainer.test.js)
- **APIs**: Weather API, Route/Mapping API integration


# 🚀 DelayShield AI

**Intelligent Logistics Decision Platform (AI + Simulation + Sustainability)**

## 🧠 Problem Statement

In modern logistics, companies face:
*   🚦 Traffic congestion
*   🌧️ Weather disruptions
*   ⏱️ Delivery delays
*   💸 Financial losses

Most systems only track shipments, but:
*   ❌ They react after problems occur
*   ❌ They don’t provide decision intelligence

## 💡 Solution

DelayShield AI is an AI-powered logistics decision platform that:
*   ✔ Predicts disruptions before they occur
*   ✔ Suggests optimal decisions (reroute / monitor)
*   ✔ Calculates real-time financial loss
*   ✔ Tracks carbon emissions for eco decisions
*   ✔ Enables simulation-based planning

👉 **Transforms logistics from:** Reactive → Proactive → Intelligent Decision System

## ⚙️ SYSTEM WORKFLOW
User Input → AI Analysis → Risk + Cost + Carbon → Decision → Map Visualization → Action

---

## 🧩 CORE FEATURES

**🤖 1. AI Shipment Analysis**
*   Input origin & destination
*   AI analyzes traffic, weather, delay
*   Generates optimized route
*   Predicts risk and cost

**🗺️ 2. Live Route Visualization**
*   Interactive map (Geoapify Maps)
*   Route plotting with markers
*   Multiple routes comparison
*   Click → detailed shipment insights

**⚠️ 3. Risk Analysis Engine**
*   Risk level: Low / Medium / High
*   Factors: Traffic, Weather, Delay
*   Predictive disruption detection

**⏱️ 4. Delay Prediction System**
*   Estimates delay (in minutes)
*   Helps prevent SLA violations

**💰 5. Loss / Cost Impact Engine (🔥 High Value)**
*   Fuel loss calculation
*   SLA penalty risk
*   Total financial impact
*   Real-time loss tracking

**🧭 6. Priority Intelligence Map (🔥 USP)**
*   All shipments on one map
*   Color-coded: 🔴 Critical | 🟠 At Risk | 🟢 Safe
*   Filter + interaction
*   Fleet-level visibility

**📦 7. Multi-Shipment Tracking**
*   Track multiple shipments
*   Monitor entire logistics network

**🧠 8. Smart Priority System**
*   AI ranks shipments based on: Risk, Delay, Cost

**🧪 9. What-If Simulation Engine**
*   Simulate disruptions
*   Compare outcomes
*   Choose best strategy

**📊 10. Scenario Comparison Dashboard**
*   Compare: Risk, Cost, Delay
*   Visual insights

**📈 11. Risk Trajectory Prediction**
*   Future risk over time
*   Helps proactive planning

**🚚 12. Multi-Modal Transport Comparison**
*   Compare Air vs Road
*   Metrics: Cost, Time, CO₂, Reliability

**🤖 13. AI Strategic Recommendation**
*   Suggests: Reroute, Monitor, Proceed

**🌱 14. Carbon Emission Tracking (ESG Feature)**
*   CO₂ calculation per shipment
*   Eco-route suggestions
*   Emission saved tracking
*   Sustainability insights

**🔐 15. Authentication System**
*   Google OAuth login
*   Secure JWT-based sessions
*   User-specific shipment data

**🧑💼 16. Admin Control Panel**
*   Add & manage shipments
*   Trigger AI analysis
*   Full control dashboard

**📤 17. Delivery Sharing Feature (🔥 Real-world integration)**
*   Share shipment with driver
*   Includes: Route, Risk, Delay, Instructions
*   👉 Bridges: Office decisions → Field execution

**⚡ 18. Real-Time Dashboard**
*   Live shipment data
*   Risk + cost + carbon insights
*   Decision monitoring

**🔁 19. Decision History & Analytics**
*   Stores past decisions
*   Performance tracking
*   Improves future planning

**🌍 20. Global Intelligent Autocomplete**
*   OpenStreetMap Nominatim integration
*   Smart city/location suggestions based on user input
*   Worldwide routing capabilities

**🎨 21. Glassmorphism UI & Premium UX**
*   Modern, high-contrast dashboard design
*   Interactive micro-animations and glowing indicators
*   Responsive layout optimized for both desktop and mobile operations centers

**🛡️ 22. Role-Based Access Control & Fallback**
*   Primary authentication via Google Identity Services
*   Secure fallback manual admin credentials if OAuth is blocked on corporate networks

**🚀 23. Automated Monorepo Deployment Pipeline**
*   Vite frontend deployed seamlessly on Vercel
*   Node.js backend hosted on Render with automated build commands
*   Built-in keep-alive cron jobs to prevent server sleep

**🧠 24. AI-Powered Strategic Explainer**
*   Translates complex logistical data and risk scores into human-readable reasoning
*   Helps non-technical managers understand *why* an AI decision was made

**🚦 25. Live Data Simulation Engine**
*   Robust internal simulation engine that injects synthetic traffic density and weather conditions
*   Allows thorough testing of the AI decision logic without relying on expensive live commercial traffic feeds

---

## 🧠 SYSTEM ARCHITECTURE

```text
Frontend (React)
        ↓
Backend (Node.js + Express)
        ↓
AI Engine (Gemini)
        ↓
External APIs (Maps + Weather)
        ↓
Database (MongoDB)
```

---

## 🛠️ TECH STACK

*   **Frontend:** React.js (Vite), Tailwind CSS, Geoapify API
*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB
*   **AI:** Gemini API
*   **Authentication:** Google OAuth

---

## 🔌 CORE APIs

```text
POST /api/analyze          # AI shipment analysis
POST /api/simulate         # What-if simulation
POST /api/cost             # Cost calculation
GET  /api/shipment         # Get shipments
POST /api/shipment         # Create shipment
GET  /api/cities           # City data
POST /api/auth/google      # Authentication
```

---

## 👥 TARGET USERS

*   🚛 Logistics companies
*   📦 Supply chain managers
*   🚚 Fleet operators

---

## 🏆 WHY THIS PROJECT STANDS OUT

*   ✔ Not just tracking → Decision Intelligence System
*   ✔ Combines AI + Simulation + Cost + Sustainability
*   ✔ Real-world logistics use case
*   ✔ Visual + interactive dashboard
*   ✔ End-to-end workflow (input → decision → execution)

---

## 🚀 GETTING STARTED

### Local Setup

**Backend**
```bash
cd server
npm install
npm run dev
```

**Frontend**
```bash
cd client
npm install
npm run dev
```

### Live Demo Instructions

1. Open the backend service URL to wake it up:
   `https://delayshield-ai.onrender.com/`
   Wait for a few seconds to allow the server to restart.
2. Once the backend is active, open the frontend application:
   `https://delayshield-ai.vercel.app/`

---

## 📌 FUTURE SCOPE

*   📍 Real-time GPS tracking
*   🤖 Advanced ML prediction models
*   ☁️ Cloud deployment (AWS/GCP)
*   📱 Mobile application
*   🔗 Integration with logistics platforms

---

## 💬 One-Line Pitch

> “DelayShield AI predicts disruptions before they happen and helps logistics companies take smarter decisions to minimize delays and costs.”

---

## ⭐ Final Note

This project is designed as a **hackathon-ready intelligent system** with a strong focus on:

*   Real-world applicability
*   Clean architecture
*   AI-driven decision making

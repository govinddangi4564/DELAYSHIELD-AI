# Repository Guidelines

## Project Structure & Module Organization

DelayShield AI is split into `client/` and `server/`. The client is a React + Vite app: pages are in `client/src/pages/`, reusable UI in `client/src/components/`, API/mock helpers in `client/src/services/`, and assets in `client/public/` or `client/src/assets/`. The server is a Node.js/Express API: `app.js` wires middleware/routes, `server.js` starts the process, `routes/` defines endpoints, `controllers/` handles requests, and `engine/` contains risk, decision, cost, history, alert, and simulation logic. Mock datasets are in `server/src/data/`.

## Build, Test, and Development Commands

Run commands from the relevant package directory.

```bash
cd client && npm install
cd client && npm run dev       # start Vite dev server
cd client && npm run build     # create production build
cd client && npm run lint      # run ESLint

cd server && npm install
cd server && npm run dev       # start API with nodemon
cd server && npm start         # start API with node
cd server && npm test          # run Mocha tests under src/**/*.test.js
```

There is no root workspace script.

## Coding Style & Naming Conventions

Both packages use ES modules. Match the existing JavaScript style: two-space indentation, single quotes, and minimal semicolon use. React components use PascalCase filenames such as `ShipmentCard.jsx`; helpers and engine modules use camelCase or existing local casing, such as `whatifengine.js`. Keep route and controller filenames aligned by feature. The client uses ESLint with React Hooks and React Refresh rules.

## Testing Guidelines

Server tests use Mocha with Chai and should be named `*.test.js` near the code they cover, for example `server/src/engine/decision/aiExplainer.test.js`. Add focused tests for engine logic and regressions in AI decision, risk, cost, or simulation calculations. The client has no test runner configured; validate UI changes with `npm run lint` and `npm run build`.

## Commit & Pull Request Guidelines

Recent history uses short summaries such as `added simulation feature`, plus merge commits from feature branches. Keep commits focused with subjects like `add shipment risk tests` or `fix simulation route response`. Pull requests should include a brief description, testing performed, linked issue or feature context when available, and screenshots for visible client changes. Note any new environment variables or setup steps.

## Security & Configuration Tips

Do not commit `.env` files or API keys. Gemini, weather, and routing integrations should read secrets from environment variables. Keep mock data realistic but non-sensitive.

# Project TODO List

This file tracks the development progress for the new Automated Trading Signals web app.

## Phase 1: Core Structure & Backend

- [x] Create `src` directory for new UI files.
- [x] Update `code.gs` `doPost` to handle `capital_deployed_cr`.
- [ ] Update `code.gs` `doGet` to serve the new `src/index.html`.
- [ ] Flesh out all data-fetching functions in `code.gs` to return data in the new format required by the frontend.
- [ ] Implement server-side session management logic.

## Phase 2: UI/UX - Login and Shell

- [x] Create `src/index.html` with basic structure.
- [x] Create `src/styles.css` with initial variables and glassmorphism styles.
- [x] Create `src/script.js` with initial view rendering and theme switching.
- [ ] Design and implement the full login screen UI (`styles.css`).
- [ ] Implement client-side logic for OTP generation, timer, and submission (`script.js`).
- [ ] Design and implement the main application shell (header, navigation, content area).
- [ ] Implement the sliding navigation for Live/Logs/Historical.
- [ ] Implement the logo-as-home-button functionality.

## Phase 3: Dashboard Implementation

- [ ] Design and implement the 4 KPI cards (Nifty, Total Symbols, Synced, Latest).
- [ ] Implement the dynamic tickers for HVD and Pattern-based syncs.
- [ ] Implement the main "Synced Signals" list on the dashboard.
- [ ] Implement the modal/pop-up view for card details.

## Phase 4: Tab Implementation (Live, Logs, Historical)

- [ ] Implement the "Live Feed" view.
- [ ] Implement the "Logs" view with its 5 distinct panels.
- [ ] Implement the "Historical" view.
- [ ] Implement the sorting controls (by status/time, asc/desc) for all relevant views.

## Phase 5: Advanced Features

- [ ] Integrate Gemini API for signal analysis and chat.
- [ ] Create the UI for the Gemini chat window.
- [ ] Implement the Text-to-Speech narration for synced symbols.
- [ ] Implement mute/unmute functionality.

## Phase 6: Final Polish

- [ ] Add all requested animations (card hover, logo press, page transitions).
- [ ] Ensure scrolling is smooth and scrollbars are hidden.
- [ ] Thoroughly test light and dark modes.
- [ ] Final review of all UI elements for a professional look and feel.
- [ ] End-to-end testing of the entire application flow.

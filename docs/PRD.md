# Product Requirements Document: Pathlight

| Field   | Value                                                      |
| ------- | ---------------------------------------------------------- |
| Product | Pathlight, a simple user analytics tool                    |
| Status  | v1.0 (assignment scope)                                    |
| Context | CausalFunnel Full Stack Engineer hiring assignment         |

## 1. Overview

E-commerce teams need to see how visitors actually behave on their pages. Pathlight is a
lightweight tool that records page views and clicks with a small script, stores them, and
lets a team replay a visitor's journey and see where people click.

## 2. Problem statement

Store owners know their traffic numbers but not what visitors do after landing: which pages
they visit, in which order, and what they click (or miss). Without that, they cannot tell why
visitors leave before buying.

## 3. Goals and non-goals

**Goals**
- G1. Capture `page_view` and `click` events from any page with one script tag.
- G2. Group events into sessions and show each session's ordered journey.
- G3. Show where visitors click on a given page (heatmap).
- G4. Be easy to deploy (backend on Render, dashboard on Vercel, MongoDB Atlas) and easy to understand.

**Non-goals (v1)**
- User accounts, login, multi-tenant "sites" or API keys.
- Scroll tracking, form analytics, session replay, funnels, A/B tests.
- Bot filtering, GDPR consent tooling, data export.
- Real-time (live) updates; the dashboard refreshes on demand.

## 4. Users

| Persona                  | Need                                                       |
| ------------------------ | ---------------------------------------------------------- |
| Store owner / marketer   | See what visitors do and which buttons get attention       |
| Product analyst          | Inspect individual journeys to find friction               |
| Site developer           | Add tracking with minimal effort and no performance cost   |

## 5. User stories

- US1. As a developer, I paste one `<script>` tag and tracking starts.
- US2. As an analyst, I see a list of sessions with how many events each had.
- US3. As an analyst, I click a session and see its events in time order.
- US4. As a marketer, I choose a page and see a map of where visitors clicked.

## 6. Functional requirements

### 6.1 Tracking script
| ID    | Requirement                                                                       |
| ----- | --------------------------------------------------------------------------------- |
| FR-1  | Sends a `page_view` event on load, and on SPA route changes (`pushState`/`popstate`) |
| FR-2  | Sends a `click` event for every real user click                                   |
| FR-3  | Every event includes `session_id`, `event_type`, `page_url`, `timestamp`          |
| FR-4  | Click events include `x` and `y` (page coordinates)                               |
| FR-5  | `session_id` is stored in `localStorage` (cookie fallback), renewed after 30 min idle |
| FR-6  | Click events also include page size, viewport size and a short target description |
| FR-7  | Never throws or blocks the host page; uses `sendBeacon` with `fetch` fallback     |

### 6.2 Backend API
| ID    | Requirement                                                                  |
| ----- | ---------------------------------------------------------------------------- |
| FR-8  | `POST /api/v1/events` validates and stores one event or a batch (max 50)     |
| FR-9  | `GET /api/v1/sessions` returns sessions with total events, paginated         |
| FR-10 | `GET /api/v1/sessions/:id/events` returns that session's events in time order |
| FR-11 | `GET /api/v1/heatmap?url=` returns click coordinates for one page            |
| FR-12 | `GET /api/v1/heatmap/pages` lists tracked pages (to fill the page selector)  |
| FR-13 | Errors return a consistent JSON shape with a correct HTTP status             |

### 6.3 Dashboard
| ID    | Requirement                                                                  |
| ----- | ---------------------------------------------------------------------------- |
| FR-14 | Sessions view lists sessions (id, entry page, views, clicks, total events)   |
| FR-15 | Selecting a session shows the ordered journey; the URL is shareable          |
| FR-16 | Heatmap view has a page selector and draws click positions as dots or a grid |
| FR-17 | Optional page preview behind the clicks                                      |
| FR-18 | Loading, error and empty states on every data screen                         |

## 7. Non-functional requirements

- **Performance:** the tracker has no dependencies (about 6 KB with comments, roughly 2 KB gzipped) and adds no render-blocking work (loaded with `defer`).
- **Reliability:** an analytics failure must never affect the host website.
- **Security:** all input validated server-side; request size capped; strings length-limited.
- **Maintainability:** code separated into routes, controllers, models, validators and utils.
- **Portability:** runs locally with two commands; deploys with the backend on Render and the dashboard on Vercel, configured only through environment variables.

## 8. Data model

Collection `events` (one document per event):

| Field          | Type   | Notes                                           |
| -------------- | ------ | ----------------------------------------------- |
| sessionId      | String | indexed with timestamp                          |
| eventType      | String | `page_view` or `click`                          |
| pageUrl        | String | full URL as seen by the visitor                 |
| pageKey        | String | origin + path, used to group pages; indexed     |
| timestamp      | Date   | client time of the event                        |
| x, y           | Number | clicks only; pixels from top-left of the page   |
| pageWidth/Height, viewportWidth/Height | Number | clicks only; used to scale heatmap |
| target         | Object | clicks only; tag, id, text                      |
| userAgent      | String | from request header                             |
| createdAt, updatedAt | Date | server time                               |

Indexes: `{sessionId, timestamp}` and `{pageKey, eventType}`.

## 9. UX summary

- Two top-level tabs: **Sessions** and **Heatmap**.
- Sessions: list on the left, selected journey on the right (stacked on mobile).
- Heatmap: page dropdown, Dots/Grid toggle, "show page" checkbox, click count.

## 10. Success metrics

- A reviewer can add the script to a page and see events in the dashboard within 5 minutes.
- Session list loads in under 1 second for 10,000 events.
- Zero uncaught errors in the tracker across Chrome, Firefox and Safari.

## 11. Risks and mitigations

| Risk                                         | Mitigation                                               |
| -------------------------------------------- | -------------------------------------------------------- |
| Public ingestion endpoint abused             | Size cap, validation, length limits; add rate limiting next |
| Session aggregation slows as data grows      | Pre-compute a `sessions` collection (next steps)         |
| Heatmap misaligned on responsive layouts     | Store page width, normalise x; document limitation       |
| Privacy (visitor identifiers, page text)     | No cookies by default beyond session id; truncate target text; add consent hook |

## 12. Milestones

1. Data model, ingestion API, validation
2. Tracking script and demo pages
3. Sessions and heatmap APIs
4. React dashboard
5. Deployment, README, documentation

## 13. Next steps (post-v1)

- Per-site API keys and dashboard login
- Rate limiting and bot/user-agent filtering
- Pre-computed sessions collection; TTL index for data retention
- Scroll depth, rage-click detection, funnels
- Automated tests (API integration tests, tracker tests in a headless browser)

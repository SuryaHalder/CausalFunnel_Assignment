import { Link } from "react-router-dom";
import Pagination from "./Pagination.jsx";
import { EmptyState } from "./States.jsx";
import { formatDateTime, formatDuration, pathOf, shortId } from "../utils/format.js";

export default function SessionList({ sessions, pagination, selectedId, onPageChange }) {
  if (sessions.length === 0) {
    return (
      <EmptyState title="No sessions yet">
        Open the demo store at /demo/index.html and click around, or run `npm run seed` in the
        backend folder to add sample data.
      </EmptyState>
    );
  }

  return (
    <>
      <ul className="session-list">
        {sessions.map((session) => {
          const isActive = session.sessionId === selectedId;
          return (
            <li key={session.sessionId}>
              <Link
                to={`/sessions/${session.sessionId}`}
                className={isActive ? "session-row is-active" : "session-row"}
                aria-current={isActive ? "true" : undefined}
              >
                <div className="session-top">
                  <span className="session-id">{shortId(session.sessionId)}</span>
                  <span className="session-total">{session.totalEvents} events</span>
                </div>
                <div className="session-entry">Entered on {pathOf(session.entryPage)}</div>
                <div className="session-meta">
                  <span>
                    {session.pageViews} views, {session.clicks} clicks
                  </span>
                  <span>{formatDuration(session.durationMs)}</span>
                  <span>{formatDateTime(session.lastSeen)}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onChange={onPageChange}
      />
    </>
  );
}

import EventItem from "./EventItem.jsx";
import { ErrorMessage, Loader } from "./States.jsx";
import { useApi } from "../hooks/useApi.js";
import { getSessionEvents } from "../api/analytics.api.js";
import { formatDuration } from "../utils/format.js";

export default function SessionJourney({ sessionId }) {
  const { data, loading, error, refetch } = useApi(() => getSessionEvents(sessionId), [sessionId]);

  if (loading) return <Loader label="Loading journey..." />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  const { events, totalEvents } = data;
  const startTime = new Date(events[0].timestamp);
  const duration = new Date(events[events.length - 1].timestamp) - startTime;
  const pagesVisited = new Set(events.map((event) => event.pageKey)).size;

  return (
    <div>
      <div className="panel-head">
        <div>
          <h2>User journey</h2>
          <p className="muted mono">{sessionId}</p>
        </div>
      </div>

      <dl className="summary">
        <div>
          <dt>Events</dt>
          <dd>{totalEvents}</dd>
        </div>
        <div>
          <dt>Pages visited</dt>
          <dd>{pagesVisited}</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>{formatDuration(duration)}</dd>
        </div>
      </dl>

      <ol className="timeline">
        {events.map((event, index) => (
          <EventItem key={event._id} event={event} index={index} startTime={startTime} />
        ))}
      </ol>
    </div>
  );
}

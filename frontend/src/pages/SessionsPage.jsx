import { useState } from "react";
import { useParams } from "react-router-dom";
import SessionList from "../components/SessionList.jsx";
import SessionJourney from "../components/SessionJourney.jsx";
import { EmptyState, ErrorMessage, Loader } from "../components/States.jsx";
import { useApi } from "../hooks/useApi.js";
import { getSessions } from "../api/analytics.api.js";

const PAGE_SIZE = 12;

export default function SessionsPage() {
  const { sessionId } = useParams(); // from the URL /sessions/:sessionId
  const [page, setPage] = useState(1);

  const { data, loading, error, refetch } = useApi(
    () => getSessions({ page, limit: PAGE_SIZE }),
    [page]
  );

  let listContent;
  if (loading && !data) listContent = <Loader label="Loading sessions..." />;
  else if (error) listContent = <ErrorMessage message={error} onRetry={refetch} />;
  else {
    listContent = (
      <SessionList
        sessions={data.sessions}
        pagination={data.pagination}
        selectedId={sessionId}
        onPageChange={setPage}
      />
    );
  }

  return (
    <div className="split">
      <section className="panel" aria-label="Sessions">
        <div className="panel-head">
          <div>
            <h2>Sessions</h2>
            {data && <p className="muted">{data.pagination.total} total</p>}
          </div>
          <button type="button" className="btn" onClick={refetch}>
            Refresh
          </button>
        </div>
        {listContent}
      </section>

      <section className="panel panel-sticky" aria-label="Session journey">
        {sessionId ? (
          <SessionJourney sessionId={sessionId} />
        ) : (
          <EmptyState title="Pick a session">
            Select a session on the left to see every page view and click, in order.
          </EmptyState>
        )}
      </section>
    </div>
  );
}

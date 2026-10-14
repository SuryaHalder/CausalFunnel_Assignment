import { useEffect, useState } from "react";
import HeatmapCanvas from "../components/HeatmapCanvas.jsx";
import PageSelector from "../components/PageSelector.jsx";
import { EmptyState, ErrorMessage, Loader } from "../components/States.jsx";
import { useApi } from "../hooks/useApi.js";
import { getHeatmap, getHeatmapPages } from "../api/analytics.api.js";

export default function HeatmapPage() {
  const pagesQuery = useApi(getHeatmapPages, []);
  const [selectedUrl, setSelectedUrl] = useState("");
  const [mode, setMode] = useState("dots"); // "dots" | "grid"
  const [showPage, setShowPage] = useState(true);

  const pages = pagesQuery.data?.pages;

  // Select the busiest page automatically once the list arrives.
  useEffect(() => {
    if (!selectedUrl && pages && pages.length > 0) setSelectedUrl(pages[0].url);
  }, [pages, selectedUrl]);

  const heatmapQuery = useApi(selectedUrl ? () => getHeatmap(selectedUrl) : null, [selectedUrl]);

  if (pagesQuery.loading) return <Loader label="Loading pages..." />;
  if (pagesQuery.error) return <ErrorMessage message={pagesQuery.error} onRetry={pagesQuery.refetch} />;
  if (!pages || pages.length === 0) {
    return (
      <div className="panel">
        <EmptyState title="No pages tracked yet">
          Open the demo store at /demo/index.html and click around, or run `npm run seed` in the
          backend folder.
        </EmptyState>
      </div>
    );
  }

  const heatmap = heatmapQuery.data;

  return (
    <div className="panel">
      <div className="toolbar">
        <PageSelector pages={pages} value={selectedUrl} onChange={setSelectedUrl} />

        <div className="field">
          <span className="field-label">Style</span>
          <div className="segmented" role="group" aria-label="Heatmap style">
            <button
              type="button"
              className={mode === "dots" ? "is-active" : ""}
              aria-pressed={mode === "dots"}
              onClick={() => setMode("dots")}
            >
              Dots
            </button>
            <button
              type="button"
              className={mode === "grid" ? "is-active" : ""}
              aria-pressed={mode === "grid"}
              onClick={() => setMode("grid")}
            >
              Grid
            </button>
          </div>
        </div>

        <label className="check">
          <input
            type="checkbox"
            checked={showPage}
            onChange={(event) => setShowPage(event.target.checked)}
          />
          Show page behind clicks
        </label>
      </div>

      {heatmapQuery.loading && !heatmap && <Loader label="Loading clicks..." />}
      {heatmapQuery.error && (
        <ErrorMessage message={heatmapQuery.error} onRetry={heatmapQuery.refetch} />
      )}

      {heatmap && (
        <>
          <p className="muted heatmap-note">
            {heatmap.totalClicks} clicks recorded
            {heatmap.returned < heatmap.totalClicks &&
              `, showing the most recent ${heatmap.returned}`}
            . If the page preview stays blank, the site does not allow embedding; turn it off.
          </p>
          {heatmap.clicks.length === 0 ? (
            <EmptyState title="No clicks on this page yet" />
          ) : (
            <HeatmapCanvas url={heatmap.url} clicks={heatmap.clicks} mode={mode} showPage={showPage} />
          )}
        </>
      )}
    </div>
  );
}

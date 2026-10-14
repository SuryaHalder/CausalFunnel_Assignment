import { useEffect, useMemo, useRef, useState } from "react";
import { drawDots, drawGrid, getReferenceSize, projectClicks } from "../utils/heatmap.js";

// Layers, bottom to top:
//   1) optional <iframe> showing the real page, scaled to fit
//   2) <canvas> where the clicks are painted
export default function HeatmapCanvas({ url, clicks, mode, showPage }) {
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const [width, setWidth] = useState(0);

  const reference = useMemo(() => getReferenceSize(clicks), [clicks]);
  const points = useMemo(() => projectClicks(clicks, reference), [clicks, reference]);

  // Track how wide the stage is on screen so everything can scale to fit.
  useEffect(() => {
    const element = stageRef.current;
    if (!element) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    setWidth(element.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  const scale = width > 0 ? width / reference.width : 0;
  const height = Math.round(reference.height * scale);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !width) return;

    // Draw at device resolution so dots stay sharp on retina screens.
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);

    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);

    if (mode === "grid") drawGrid(ctx, points, scale);
    else drawDots(ctx, points, scale);
  }, [points, mode, width, height, scale]);

  return (
    <div
      ref={stageRef}
      className={showPage ? "stage" : "stage stage-blank"}
      style={{ height: height || 240 }}
    >
      {showPage && scale > 0 && (
        <iframe
          title="Preview of the selected page"
          src={url}
          className="stage-frame"
          // No allow-scripts: the preview must NOT run tracker.js, otherwise merely
          // looking at the heatmap would record a fake page view.
          sandbox="allow-same-origin"
          tabIndex={-1}
          style={{
            width: reference.width,
            height: reference.height,
            transform: `scale(${scale})`,
          }}
        />
      )}
      <canvas ref={canvasRef} className="stage-canvas" style={{ width, height }} />
    </div>
  );
}

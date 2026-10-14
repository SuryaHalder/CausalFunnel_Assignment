import { formatClock, formatOffset, pathOf } from "../utils/format.js";

// What the person did, in plain words.
function describe(event) {
  if (event.eventType === "page_view") {
    return { title: `Viewed ${pathOf(event.pageUrl)}`, detail: null };
  }

  const { target } = event;
  let what = "the page";
  if (target?.text) what = `"${target.text}"`;
  else if (target?.id) what = `#${target.id}`;
  else if (target?.tag) what = `a ${target.tag}`;

  const kind = target?.text && target?.tag ? ` (${target.tag})` : "";
  return {
    title: `Clicked ${what}${kind}`,
    detail: `at x ${event.x}, y ${event.y} on ${pathOf(event.pageUrl)}`,
  };
}

export default function EventItem({ event, index, startTime }) {
  const { title, detail } = describe(event);
  const offset = new Date(event.timestamp) - startTime;
  const isClick = event.eventType === "click";

  return (
    <li className="event">
      <span className={isClick ? "event-marker is-click" : "event-marker"}>{index + 1}</span>
      <div className="event-body">
        <div className="event-title">
          <span>{title}</span>
          <span className={isClick ? "badge badge-click" : "badge badge-view"}>
            {isClick ? "click" : "page view"}
          </span>
        </div>
        {detail && <div className="event-detail">{detail}</div>}
      </div>
      <time className="event-time" dateTime={event.timestamp} title={formatClock(event.timestamp)}>
        {index === 0 ? formatClock(event.timestamp) : formatOffset(offset)}
      </time>
    </li>
  );
}

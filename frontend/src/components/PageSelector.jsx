import { hostOf, pathOf } from "../utils/format.js";

export default function PageSelector({ pages, value, onChange }) {
  return (
    <label className="field">
      <span className="field-label">Page</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {pages.map((page) => (
          <option key={page.url} value={page.url}>
            {pathOf(page.url)} on {hostOf(page.url)} ({page.clicks} clicks)
          </option>
        ))}
      </select>
    </label>
  );
}

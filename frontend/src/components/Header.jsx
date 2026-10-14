import { NavLink } from "react-router-dom";

export default function Header() {
  return (
    <header className="header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true" />
        <span className="brand-name">Pathlight</span>
      </div>
      <nav className="tabs" aria-label="Main">
        <NavLink to="/sessions" className={({ isActive }) => (isActive ? "tab is-active" : "tab")}>
          Sessions
        </NavLink>
        <NavLink to="/heatmap" className={({ isActive }) => (isActive ? "tab is-active" : "tab")}>
          Heatmap
        </NavLink>
      </nav>
    </header>
  );
}

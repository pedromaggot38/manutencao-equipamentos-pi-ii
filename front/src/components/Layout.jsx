import Sidebar from './Sidebar';

export default function Layout({ title, actions, children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div className="topbar-title">{title}</div>
          <div>{actions}</div>
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}

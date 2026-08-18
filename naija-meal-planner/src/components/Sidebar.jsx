function Sidebar({ activePage, setActivePage, familySize }) {
  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: "🏠" },
    { key: "timetable", label: "Meal Timetable", icon: "📅" },
    { key: "fruitPlan", label: "Fruit Plan", icon: "🍎" },
    { key: "prices", label: "Market Prices", icon: "🏪" },
    { key: "groceries", label: "Grocery List", icon: "🛒" },
    { key: "budget", label: "Budget", icon: "💰" },
    { key: "substitutes", label: "Substitutes", icon: "🔁" },
    { key: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <aside className="sidebar">
      <div>
        <div className="brand">
          <div className="logo">N</div>

          <div>
            <h1>NaijaMealPlanner</h1>
            <p>Meals • Prices • Budget</p>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={activePage === item.key ? "active" : ""}
              onClick={() => setActivePage(item.key)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="profile">
        <div className="profile-badge">👨‍👩‍👧‍👦</div>
        <div>
          <strong>Family Profile</strong>
          <p>Family of {familySize}</p>
          <p>Nigeria / U.S. pricing</p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
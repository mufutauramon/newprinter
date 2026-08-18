function Topbar({
  region,
  setRegion,
  activePage,
  showFruit,
  setShowFruit,
  showAppetizer,
  setShowAppetizer,
}) {
  const isLocked = activePage === "prices";

  return (
    <header className="topbar">
      <div>
        <h2>Meal Planning Dashboard</h2>
        <p>
          Plan Nigerian meals, U.S. alternatives, grocery list, and budget.
        </p>
      </div>

      <div className="topbar-actions">
        {/* REGION TOGGLE */}
        <div className="toggle">
          <button
            className={region === "ng" ? "active" : ""}
            disabled={isLocked}
            onClick={() => setRegion("ng")}
            title={isLocked ? "Location controls currency on this page" : ""}
          >
            🇳🇬 Nigeria
          </button>

          <button
            className={region === "us" ? "active" : ""}
            disabled={isLocked}
            onClick={() => setRegion("us")}
            title={isLocked ? "Location controls currency on this page" : ""}
          >
            🇺🇸 U.S.
          </button>
        </div>

        {/* OPTIONAL TOGGLES */}
        <div className="toggle">
          <button
            className={showFruit ? "active" : ""}
            onClick={() => setShowFruit(!showFruit)}
          >
            🍎 Fruit
          </button>

          <button
            className={showAppetizer ? "active" : ""}
            onClick={() => setShowAppetizer(!showAppetizer)}
          >
            🥗 Appetizer
          </button>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
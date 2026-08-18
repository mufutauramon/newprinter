
function Settings({
  region,
  setRegion,
  familySize,
  setFamilySize,
  showFruit,
  setShowFruit,
  showAppetizer,
  setShowAppetizer,
   user,
  signOut,
}
)

{
  
  return (
    <section className="card">
      <div className="section-head">
        <div>
          <h3>Settings</h3>
          <p>Customize your meal plan.</p>
        </div>
      </div>

      <div className="settings-grid">
        <div>
          <label>Family Size</label>
          <input
            type="number"
            min="1"
            value={familySize}
            onChange={(e) => setFamilySize(Number(e.target.value))}
          />
        </div>

        <div>
          <label>Region</label>
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="us">United States</option>
            <option value="ng">Nigeria</option>
          </select>
        </div>

        <div className="setting-check">
          <input
            type="checkbox"
            checked={showFruit}
            onChange={() => setShowFruit(!showFruit)}
          />
          <span>Include Fruit / Snack</span>
        </div>

        <div className="setting-check">
          <input
            type="checkbox"
            checked={showAppetizer}
            onChange={() => setShowAppetizer(!showAppetizer)}
          />
          <span>Include Appetizer / Starter</span>
        </div>
      </div>
    </section>
  );
}

export default Settings;
import { useState } from "react";
import MealModal from "../components/MealModal.jsx";

function Dashboard({
  weeklyMeals,
  showFruit,
  showAppetizer,
  formatCost,
  setActivePage,
  currencyTotal,
  familySize,
   setMealsState,
}) {  const [selectedMeal, setSelectedMeal] = useState(null);

const handleReplace = (day, field, newValue) => {
  setMealsState((prev) =>
    prev.map((m) => (m.day === day ? { ...m, [field]: newValue } : m))
  );

  setSelectedMeal((prev) =>
    prev ? { ...prev, [field]: newValue } : prev
  );
};
  return (
    <>
      <section className="stats">
        <div className="card stat">
          <span>📅</span>
          <p>Meal Plan</p>
          <h3>30 Days</h3>
        </div>

        <div className="card stat">
          <span>👨‍👩‍👧‍👦</span>
          <p>Family Size</p>
          <h3>{familySize} People</h3>
        </div>

        <div className="card stat">
          <span>💰</span>
          <p>Monthly Budget</p>
          <h3>{currencyTotal}</h3>
        </div>

        <div className="card stat">
          <span>🛒</span>
          <p>Shopping List</p>
          <h3>Weekly</h3>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="card">
          <div className="section-head">
            <div>
              <h3>This Week’s Timetable</h3>
              <p>Click any day to view meal details.</p>
            </div>

            <button onClick={() => setActivePage("timetable")}>
              View Full Plan
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Breakfast</th>
                  {showFruit && <th>Fruit</th>}
                  <th>Lunch</th>
                  {showAppetizer && <th>Appetizer</th>}
                  <th>Dinner</th>
                  <th>Cost</th>
                </tr>
              </thead>

              <tbody>
                {weeklyMeals.map((meal) => (
                  <tr key={meal.day} onClick={() => setSelectedMeal(meal)}>
                    <td>{meal.day}</td>
                    <td>{meal.breakfast}</td>
                    {showFruit && <td>{meal.fruit}</td>}
                    <td>{meal.lunch}</td>
                    {showAppetizer && <td>{meal.appetizer}</td>}
                    <td>{meal.dinner}</td>
                    <td>{formatCost(meal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card dark-card">
          <h3>Smart Cooking Plan</h3>

          <p>
            Cook stew and soup bases on Sunday. Reuse them for rice, beans,
            swallow, and spaghetti during the week.
          </p>

          <div className="tip">
            <strong>Cost saver:</strong> Buy rice, chicken, eggs, and frozen
            vegetables in bulk.
          </div>

          <div className="tip">
            <strong>Optional:</strong> Fruits and appetizers can be added only
            when the family wants them.
          </div>

          <button onClick={() => setActivePage("groceries")}>
            Generate Grocery List
          </button>
        </div>
      </section>

      <MealModal
  meal={selectedMeal}
  showFruit={showFruit}
  showAppetizer={showAppetizer}
  formatCost={formatCost}
  onClose={() => setSelectedMeal(null)}
  onReplace={handleReplace}
/>
    </>
  );
}


export default Dashboard;
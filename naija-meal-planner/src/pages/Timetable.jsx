import { useState } from "react";
import MealModal from "../components/MealModal.jsx";

function Timetable({ fullMonth, showFruit, showAppetizer, formatCost,setMealsState, }) {
  const [selectedMeal, setSelectedMeal] = useState(null);

  const handleReplace = (day, field, newValue) => {
  const weekDay = ((day - 1) % 7) + 1;

  setMealsState((prev) =>
    prev.map((m) =>
      m.day === weekDay ? { ...m, [field]: newValue } : m
    )
  );

  setSelectedMeal((prev) =>
    prev ? { ...prev, [field]: newValue } : prev
  );
};
  return (
    <>
      <section className="card">
        <div className="section-head">
          <div>
            <h3>30-Day Nigerian Meal Timetable</h3>
            <p>Click any day to view meal details.</p>
          </div>
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
              {fullMonth.map((meal) => (
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

export default Timetable;
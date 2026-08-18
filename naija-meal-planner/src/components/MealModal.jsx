import { useEffect, useState } from "react";
import { mealSuggestions } from "../data/suggestions";
function MealModal({
  meal,
  showFruit,
  showAppetizer,
  formatCost,
  onClose,
  onReplace,
}) {
  const [form, setForm] = useState({
    breakfast: "",
    fruit: "",
    lunch: "",
    appetizer: "",
    dinner: "",
  });

  useEffect(() => {
    if (meal) {
      setForm({
        breakfast: meal.breakfast || "",
        fruit: meal.fruit || "",
        lunch: meal.lunch || "",
        appetizer: meal.appetizer || "",
        dinner: meal.dinner || "",
      });
    }
  }, [meal]);

  if (!meal) return null;

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdateMeal = () => {
    onReplace(meal.day, "breakfast", form.breakfast);
    onReplace(meal.day, "fruit", form.fruit);
    onReplace(meal.day, "lunch", form.lunch);
    onReplace(meal.day, "appetizer", form.appetizer);
    onReplace(meal.day, "dinner", form.dinner);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="meal-modal">
        <div className="modal-head">
          <div>
            <h2>Day {meal.day} Meal Details</h2>
            <p>Estimated cost: {formatCost(meal)}</p>
          </div>

          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="meal-edit-grid">
          <div>
            <label>Breakfast</label>
            <input
              value={form.breakfast}
              onChange={(e) => updateField("breakfast", e.target.value)}
            />
          </div>

          {showFruit && (
            <div>
              <label>Fruit / Snack</label>
              <input
                value={form.fruit}
                onChange={(e) => updateField("fruit", e.target.value)}
              />
            </div>
          )}

          <div>
            <label>Lunch</label>
            <input
              value={form.lunch}
              onChange={(e) => updateField("lunch", e.target.value)}
            />
          </div>

          {showAppetizer && (
            <div>
              <label>Appetizer</label>
              <input
                value={form.appetizer}
                onChange={(e) => updateField("appetizer", e.target.value)}
              />
            </div>
          )}

          <div>
            <label>Dinner</label>
            <input
              value={form.dinner}
              onChange={(e) => updateField("dinner", e.target.value)}
            />
          </div>
        </div>

        <div className="modal-actions">
  <button onClick={handleUpdateMeal}>Update Meal</button>

  <button
    className="secondary-btn"
    onClick={() => {
      updateField(
        "lunch",
        mealSuggestions.cheap.lunch[
          Math.floor(Math.random() * mealSuggestions.cheap.lunch.length)
        ]
      );
    }}
  >
    💸 Suggest Cheap Lunch
  </button>

  <button
    className="secondary-btn"
    onClick={() => {
      updateField(
        "dinner",
        mealSuggestions.healthy.dinner[
          Math.floor(Math.random() * mealSuggestions.healthy.dinner.length)
        ]
      );
    }}
  >
    🥗 Suggest Healthy Dinner
  </button>

  <button className="secondary-btn" onClick={onClose}>
    Cancel
  </button>
</div>      </div>
    </div>
  );
}

export default MealModal;
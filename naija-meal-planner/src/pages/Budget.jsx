function Budget({ region, currencyTotal, familySize, groceries }) {
  const money = (amount) => {
    return region === "ng"
      ? `₦${Math.round(amount).toLocaleString()}`
      : `$${amount.toFixed(2)}`;
  };

  const categoryTotals = groceries.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.total;
    return acc;
  }, {});

  return (
    <section className="card">
      <h3>Budget Planner</h3>

      <p className="muted">
        Monthly grocery-based estimate for family of {familySize}.
      </p>

      {Object.entries(categoryTotals).map(([category, total]) => (
        <div className="budget-row" key={category}>
          <span>{category}</span>
          <strong>{money(total)}</strong>
        </div>
      ))}

      <div className="total">
        <small>Estimated Monthly Total</small>
        <h2>{currencyTotal}</h2>
      </div>
    </section>
  );
}

export default Budget;
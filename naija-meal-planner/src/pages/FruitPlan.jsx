function FruitPlan({ fullMonth }) {
  return (
    <section className="card">
      <div className="section-head">
        <div>
          <h3>30-Day Fruit Plan</h3>
          <p>Fruit is separated from the main meal timetable.</p>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Fruit / Snack</th>
            </tr>
          </thead>

          <tbody>
            {fullMonth.map((meal) => (
              <tr key={meal.day}>
                <td>{meal.day}</td>
                <td>{meal.fruit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default FruitPlan;
function Groceries({ region, groceries }) {
  const money = (amount) => {
    return region === "ng"
      ? `₦${Math.round(amount).toLocaleString()}`
      : `$${amount.toFixed(2)}`;
  };

  return (
    <section className="card">
      <div className="section-head">
        <div>
          <h3>Grocery List</h3>
          <p>Quantities and prices adjust based on family size.</p>
        </div>

        <button>Export List</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {groceries.map((item) => (
              <tr key={item.item}>
                <td>{item.item}</td>
                <td>{item.category}</td>
                <td>
                  {item.adjustedQty} {item.unit}
                </td>
                <td>{money(item.unitPrice)}</td>
                <td>{money(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default Groceries;
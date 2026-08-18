import { useEffect, useState } from "react";

const API_BASE = "https://naija-meal-planner-api.ramonmufutau16.workers.dev";

function MarketPrices({ groceries, region, setRegion, updateGroceryPrice }) {
 const [store, setStore] = useState("");
const [city, setCity] = useState("Ruston");
const [state, setState] = useState("LA");
  const [status, setStatus] = useState("");

  const moneySymbol = region === "ng" ? "₦" : "$";
  const locationKey = `${city}-${state}`;
  useEffect(() => {
    async function loadPrices() {
      try {
        const res = await fetch(
          `${API_BASE}/api/prices?location=${encodeURIComponent(location)}&region=${region}}`
        );

        const data = await res.json();

        if (data.ok && Array.isArray(data.prices)) {
          data.prices.forEach((priceRow) => {
            updateGroceryPrice(priceRow.item, Number(priceRow.price));
          });
        }
      } catch (err) {
        console.error(err);
      }
    }

    loadPrices();
  }, [location, region]);

  const savePrice = async (item, price) => {
    setStatus("Saving...");

    try {
      const res = await fetch(`${API_BASE}/api/prices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item: item.item,
          category: item.category,
          unit: item.unit,
          price,
          region,
          location: locationKey,
          store,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to save price");
      }

      setStatus(`Saved ${item.item} price for ${location}`);
    } catch (err) {
      console.error(err);
      setStatus("Failed to save price");
    }
  };
const detectLocation = () => {
  if (!navigator.geolocation) {
    setStatus("Geolocation is not supported by this browser.");
    return;
  }

  setStatus("Detecting location...");

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;

        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );

        const data = await res.json();

        const detectedCity =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.county ||
          "";

        const detectedState =
          data.address?.state ||
          data.address?.region ||
          "";
const detectedCountry = data.address?.country || "";
const detectedCountryCode = data.address?.country_code || "";

if (detectedCountryCode === "us") {
  setRegion("us");
}

if (detectedCountryCode === "ng") {
  setRegion("ng");
}
        setCity(detectedCity);
        setState(detectedState);

        setStatus(`Location detected: ${detectedCity}, ${detectedState}`);
      } catch (err) {
        console.error(err);
        setStatus("Could not detect city/state.");
      }
    },
    (error) => {
      console.error(error);
      setStatus("Location permission denied or unavailable.");
    }
  );
};
  return (
    <section className="card">
      <div className="section-head">
        <div>
          <h3>Market Prices</h3>
          <p>
            Update grocery prices by location. Saved prices can be shared by
            users in the same location.
          </p>
        </div>
      </div>

      <div className="settings-grid">
  <div>
    <label>Store</label>
    <input
      value={store}
      onChange={(e) => setStore(e.target.value)}
      placeholder="e.g. Walmart, Shoprite"
    />
  </div>

  <div>
    <label>City</label>
    <input
      value={city}
      onChange={(e) => setCity(e.target.value)}
      placeholder="e.g. Lagos, Houston"
    />
  </div>

  <div>
    <label>State</label>
    <input
      value={state}
      onChange={(e) => setState(e.target.value)}
      placeholder="e.g. TX, Lagos State"
    />
  </div>

  <div>
    <label>&nbsp;</label>
    <button onClick={detectLocation}>
      📍 Detect My Location
    </button>
  </div>
</div>
      {status && <p className="muted">{status}</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Current Price</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {groceries.map((item) => {
              const currentPrice =
                region === "ng" ? item.priceNG : item.priceUS;

              return (
                <tr key={item.item}>
                  <td>{item.item}</td>
                  <td>{item.category}</td>
                  <td>{item.unit}</td>
                  <td>
                    <div className="price-input-wrap">
                      <span>{moneySymbol}</span>

                      <input
                        type="text"
                        inputMode="numeric"
                        value={currentPrice}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, "");
                          updateGroceryPrice(item.item, Number(value));
                        }}
                        placeholder="Enter price"
                      />
                    </div>
                  </td>

                  <td>
                    <button
                      onClick={() => savePrice(item, Number(currentPrice))}
                    >
                      Save Price
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default MarketPrices;
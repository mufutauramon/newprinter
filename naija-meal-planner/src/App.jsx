import { useMemo, useState } from "react";
import "./App.css";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import {groceries as initialGroceries,substitutes,weeklyMeals as initialMeals,} from "./data/meals.js";
import Dashboard from "./pages/Dashboard.jsx";
import DeleteAccount from "./pages/DeleteAccount.jsx";
import Timetable from "./pages/Timetable.jsx";
import Groceries from "./pages/Groceries.jsx";
import Budget from "./pages/Budget.jsx";
import Substitutes from "./pages/Substitutes.jsx";
import Settings from "./pages/Settings.jsx";
import FruitPlan from "./pages/FruitPlan.jsx";
import MarketPrices from "./pages/MarketPrices.jsx";


function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [region, setRegion] = useState("us");
  const [showFruit, setShowFruit] = useState(false);
  const [showAppetizer, setShowAppetizer] = useState(false);
  const [familySize, setFamilySize] = useState(5);
  const [mealsState, setMealsState] = useState(initialMeals);
  const [groceriesState, setGroceriesState] = useState(initialGroceries);

  const fullMonth = useMemo(() => {
  return Array.from({ length: 30 }, (_, index) => {
    const base = mealsState[index % mealsState.length];
    return { ...base, day: index + 1 };
  });
}, [mealsState]);
const updateGroceryPrice = (itemName, newPrice) => {
  setGroceriesState((prev) =>
    prev.map((item) => {
      if (item.item !== itemName) return item;

      if (region === "ng") {
        return { ...item, priceNG: newPrice };
      }

      return { ...item, priceUS: newPrice };
    })
  );
};
 
  const formatCost = (meal) =>
    region === "ng"
      ? `₦${meal.costNGN.toLocaleString()}`
      : `$${meal.costUSD}`;
  
      const getAdjustedGroceries = () => {
  const multiplier = familySize / 5;

  return groceriesState
    .filter((item) => {
      if (!showFruit && item.category === "Fruit/Extras" && item.item === "Fruits") {
        return false;
      }

      if (!showAppetizer && item.category === "Extras") {
        return false;
      }

      return true;
    })
    .map((item) => {
      const adjustedQty =
        item.unit === "monthly set"
          ? item.baseQty
          : Math.ceil(item.baseQty * multiplier);

      const unitPrice = region === "ng" ? item.priceNG : item.priceUS;
      const total = adjustedQty * unitPrice;

      return {
        ...item,
        adjustedQty,
        unitPrice,
        total,
      };
    });
};

const adjustedGroceries = getAdjustedGroceries();

const monthlyBudget = adjustedGroceries.reduce(
  (sum, item) => sum + item.total,
  0
);

const currencyTotal =
  region === "ng"
    ? `₦${Math.round(monthlyBudget).toLocaleString()}`
    : `$${Math.round(monthlyBudget).toLocaleString()}`;

   if (window.location.pathname === "/delete-account") {
  return <DeleteAccount />;
}

  return (
    <div className="app">
      <Sidebar
  activePage={activePage}
  setActivePage={setActivePage}
  familySize={familySize}
/>

      <main className="main">
        <Topbar
          region={region}
          setRegion={setRegion}
          activePage={activePage} 
          showFruit={showFruit}
          setShowFruit={setShowFruit}
          showAppetizer={showAppetizer}
          setShowAppetizer={setShowAppetizer}
        />

        {activePage === "dashboard" && (
  <Dashboard
    weeklyMeals={mealsState}
    setMealsState={setMealsState}
    showFruit={showFruit}
    showAppetizer={showAppetizer}
    formatCost={formatCost}
    setActivePage={setActivePage}
    currencyTotal={currencyTotal}
    familySize={familySize}
  />
)}
        {activePage === "timetable" && (
  <Timetable
    setMealsState={setMealsState}
    fullMonth={fullMonth}
    showFruit={showFruit}
    showAppetizer={showAppetizer}
    formatCost={formatCost}
  />
)}
       {activePage === "groceries" && (
  <Groceries region={region} groceries={adjustedGroceries} />
)}
        {activePage === "budget" && (
  <Budget
  region={region}
  currencyTotal={currencyTotal}
  familySize={familySize}
  groceries={adjustedGroceries}
/>
)}
{activePage === "fruitPlan" && <FruitPlan fullMonth={fullMonth} />}

{activePage === "prices" && (
  <MarketPrices
    groceries={groceriesState}
    region={region}
    setRegion={setRegion}
    updateGroceryPrice={updateGroceryPrice}
  />
)}
{activePage === "substitutes" && (
  <Substitutes substitutes={substitutes} />
)}
{activePage === "settings" && (
  <Settings
    region={region}
    setRegion={setRegion}
    familySize={familySize}
    setFamilySize={setFamilySize}
    showFruit={showFruit}
    setShowFruit={setShowFruit}
    showAppetizer={showAppetizer}
    setShowAppetizer={setShowAppetizer}
  />
)}
      </main>
    </div>
  );
}

export default App;
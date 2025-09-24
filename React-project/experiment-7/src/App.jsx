import React from "react";
import ProductCard from "./components/ProductCard";
import "./App.css";

function App() {
  const products = [
    { name: "Wireless Mouse", price: 25.99, inStock: true },
    { name: "Monitor", price: 199.99, inStock: true },
    { name: "Camera", price: 350.0, inStock: false },
  ];

  return (
    <div className="App">
      <h1 className="title">Products List</h1>

      <div className="product-list">
        {products.map((p, i) => (
          <ProductCard
            key={i}
            name={p.name}
            price={p.price}
            inStock={p.inStock}
          />
        ))}
      </div>
    </div>
  );
}

export default App;

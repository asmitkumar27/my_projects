import React from "react";
import "./ProductCard.css";

export default function ProductCard({ name, price, inStock }) {
  return (
    <div className="product-card">
      <div className="product-name">{name}</div>
      <div className="product-price">Price: ${price}</div>
      <div className={`status ${inStock ? "in-stock" : "out-stock"}`}>
        Status: {inStock ? "In Stock" : "Out of Stock"}
      </div>
    </div>
  );
}

// client/src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to fetch data from the API
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/products');
        setProducts(response.data);
      } catch (err) {
        setError('Failed to fetch products. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []); // The empty dependency array ensures this runs only once when the component mounts

  // Conditional rendering based on state
  if (loading) {
    return <div className="container"><h1>Loading...</h1></div>;
  }

  if (error) {
    return <div className="container"><h1>{error}</h1></div>;
  }

  return (
    <div className="container">
      <h1>Product List</h1>
      <div className="product-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <h2>{product.name}</h2>
            <p>Price: ${product.price}</p>
            <button>Buy Now</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
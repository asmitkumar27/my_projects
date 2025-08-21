const filter = document.getElementById("categoryFilter");
const products = document.querySelectorAll(".product");

filter.addEventListener("change", () => {
  const selectedCategory = filter.value;

  products.forEach(product => {
    const productCategory = product.getAttribute("data-category");

    if (selectedCategory === "all" || productCategory === selectedCategory) {
      product.style.display = "block";
    } else {
      product.style.display = "none";
    }
  });
});

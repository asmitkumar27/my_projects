const svg = document.getElementById("drawingArea");
let isDrawing = false;
let currentPath = null;

// Get mouse position relative to SVG
function getMousePosition(event) {
  const rect = svg.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

// Start drawing
svg.addEventListener("mousedown", (e) => {
  isDrawing = true;
  const pos = getMousePosition(e);

  currentPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  currentPath.setAttribute("stroke", "blue");
  currentPath.setAttribute("stroke-width", "2");
  currentPath.setAttribute("fill", "none");
  currentPath.setAttribute("d", `M${pos.x},${pos.y}`);
  svg.appendChild(currentPath);
});

// Continue drawing
svg.addEventListener("mousemove", (e) => {
  if (!isDrawing) return;
  const pos = getMousePosition(e);
  let d = currentPath.getAttribute("d");
  d += ` L${pos.x},${pos.y}`;
  currentPath.setAttribute("d", d);
});

// Stop drawing
svg.addEventListener("mouseup", () => {
  isDrawing = false;
  currentPath = null;
});

// Stop if mouse leaves the canvas
svg.addEventListener("mouseleave", () => {
  isDrawing = false;
  currentPath = null;
});

---
title: "Mathematical Foundations and Visual Media"
date: "2024-10-11"
slug: "mathematical-foundations-visual-media"
---

# Lorem Ipsum with Mathematical Expressions

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. The fundamental theorem of calculus states that:

$$\int_a^b f'(x) dx = f(b) - f(a)$$

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Consider the quadratic formula:

$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$

## Visual Examples

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

![Sample Image](https://via.placeholder.com/600x400/0066cc/ffffff?text=Sample+Blog+Image)

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

![Animated GIF Example](https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif)

## Matrix Operations

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium. The identity matrix is defined as:

The identity matrix can be written as $I_{ij} = \delta_{ij}$ where $\delta_{ij}$ is the Kronecker delta function.

For a 3×3 identity matrix: $\delta_{ij} = 1$ when $i = j$, and $\delta_{ij} = 0$ when $i \neq j$.

Totam rem aperiam, eaque ipsa quae ab illa inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

```python
# Calculate matrix determinant using NumPy
import numpy as np

def calculate_determinant(matrix):
    """Calculate the determinant of a square matrix."""
    return np.linalg.det(matrix)

# Example usage
identity_matrix = np.array([[1, 0, 0], [0, 1, 0], [0, 0, 1]])
det = calculate_determinant(identity_matrix)
print(f"Determinant of identity matrix: {det}")
```

<video width="600" height="400" controls>
  <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4">
  <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

## Statistical Distributions

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit. The normal distribution probability density function is:

$$f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}$$

Sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.

## Code Examples

Here's how to implement the normal distribution in JavaScript:

```javascript
// Normal distribution probability density function
function normalPDF(x, mu = 0, sigma = 1) {
  const coefficient = 1 / (sigma * Math.sqrt(2 * Math.PI));
  const exponent = -0.5 * Math.pow((x - mu) / sigma, 2);
  return coefficient * Math.exp(exponent);
}

// Generate sample data
const data = [];
for (let x = -3; x <= 3; x += 0.1) {
  data.push({
    x: x,
    y: normalPDF(x, 0, 1)
  });
}

console.log('Normal distribution data:', data.slice(0, 5));
```

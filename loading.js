window.addEventListener('load', () => {
  const loader = document.getElementById('loading-container');

  // Simulate a minimum "presence" time or wait for Flutter
  // For a dramatic effect, we hold it for a moment then open.
  if (loader) {
    setTimeout(() => {
      // Trigger the curtain opening animation
      loader.classList.add('open');

      // Remove from DOM after transition (1.5s + buffer)
      setTimeout(() => {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      }, 2000);
    }, 1500); // Wait 1.5s before opening (or wait for app ready signal)
  }
});

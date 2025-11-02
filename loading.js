// Load Lottie animation
window.addEventListener('DOMContentLoaded', () => {
  const animationContainer = document.getElementById('lottie-animation');
  lottie.loadAnimation({
    container: animationContainer,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: 'lottie/loading.json' // You must add your Lottie JSON here
  });
});

// Show button when Flutter is ready
window.addEventListener('load', () => {
  const button = document.getElementById('start-app-btn');
  button.style.display = 'inline-block';

  button.addEventListener('click', () => {
    document.getElementById('landing-page').style.opacity = 0;
    setTimeout(() => {
      document.getElementById('landing-page').style.display = 'none';
    }, 500);
  });
});

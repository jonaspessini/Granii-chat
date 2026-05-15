(function () {
  'use strict';

  function preventZoom(event) {
    event.preventDefault();
  }

  document.addEventListener('gesturestart', preventZoom, { passive: false });
  document.addEventListener('gesturechange', preventZoom, { passive: false });
  document.addEventListener('gestureend', preventZoom, { passive: false });

  document.addEventListener('touchmove', function (event) {
    if (event.touches && event.touches.length > 1) {
      event.preventDefault();
    }
  }, { passive: false });
})();

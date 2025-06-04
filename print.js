// print.js

// Wait until the QR <img> has fully loaded before printing.
window.addEventListener("DOMContentLoaded", function () {
  const qrImg = document.querySelector("img");

  if (!qrImg) {
    // If for some reason there is no <img> element, just print.
    window.print();
    window.close();
    return;
  }

  // If the <img> is already loaded (dataURI), just print immediately.
  if (qrImg.complete) {
    window.print();
    window.close();
  } else {
    // Otherwise wait for its load event.
    qrImg.addEventListener("load", function () {
      window.print();
      window.close();
    });
    // If the image fails to load, still attempt a print after a short timeout.
    setTimeout(() => {
      if (!qrImg.complete) {
        window.print();
        window.close();
      }
    }, 1000);
  }
});

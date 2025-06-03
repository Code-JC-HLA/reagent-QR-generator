// app.js
document.addEventListener("DOMContentLoaded", function () {
  if (typeof QRious !== "function") {
    alert("Qrious failed to load. The script may be missing or corrupted.");
    return;
  }

  const reagentLists = {
    SAB: [
      "SAB Class I",
      "SAB Class II",
      "ExPlex Class I",
      "ExPlex Class II",
      "Negative Control",
      "Class I Positive Control",
      "Class II Positive Control",
      "EDTA",
      "Anti-IgG PE Stain",
      "Wash Buffer",
      "PBS"
    ],
    C1Q: [
      "SAB Class I",
      "SAB Class II",
      "ExPlex Class I",
      "ExPlex Class II",
      "Negative Control",
      "Class I Positive Control",
      "Class II Positive Control",
      "PBS",
      "C1q Screen",
      "C1q PE Stain",
      "C1q Positive Control Beads",
      "HEPES Buffer"
    ]
  };

  let currentList = reagentLists.SAB;
  const assaySelect = document.getElementById("assay");
  const container = document.getElementById("reagents");

  function buildReagents(list) {
    container.innerHTML = "";
    list.forEach((name) => {
      const id = name.replace(/\s+/g, "_");
      const row = document.createElement("div");
      row.className = "reagent-row";

      row.innerHTML =
        `<div class="reagent-field">` +
        `<label for="lot-${id}">${name} Lot No.</label>` +
        `<input type="text" id="lot-${id}" maxlength="30" placeholder="e.g. 12345A" required />` +
        `<div class="error" id="error-lot-${id}"></div>` +
        `</div>` +
        `<div class="reagent-field">` +
        `<label for="exp-${id}">${name} Exp.</label>` +
        `<input type="date" id="exp-${id}" required />` +
        `<div class="error" id="error-exp-${id}"></div>` +
        `</div>`;

      container.appendChild(row);
    });
  }

  assaySelect.addEventListener("change", function () {
    currentList = reagentLists[this.value];
    buildReagents(currentList);
  });

  // Initial build
  buildReagents(currentList);

  const qrCanvas = document.getElementById("qr-canvas");
  const qr = new QRious({
    element: qrCanvas,
    size: 200,
    level: "H",
    value: "",
  });

  const generateBtn = document.getElementById("generateBtn");
  const printBtn = document.getElementById("printBtn");

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function clearErrors() {
    document.getElementById("error-tasklist").textContent = "";
    document.getElementById("error-username").textContent = "";
    currentList.forEach((name) => {
      const id = name.replace(/\s+/g, "_");
      document.getElementById(`error-lot-${id}`).textContent = "";
      const expInput = document.getElementById(`exp-${id}`);
      document.getElementById(`error-exp-${id}`).textContent = "";
      expInput.classList.remove("expired");
    });
  }

  function validateInputs() {
    let valid = true;
    clearErrors();

    // Tasklist validation
    const tasklist = document.getElementById("tasklist").value.trim();
    if (!tasklist) {
      document.getElementById("error-tasklist").textContent = "Required";
      valid = false;
    }

    // Username validation
    const usernameInput = document.getElementById("username");
    const username = usernameInput.value.trim();
    if (!username) {
      document.getElementById("error-username").textContent = "Required";
      valid = false;
    }

    // Reagents validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    currentList.forEach((name) => {
      const id = name.replace(/\s+/g, "_");
      const lotInput = document.getElementById(`lot-${id}`);
      const expInput = document.getElementById(`exp-${id}`);

      const lot = lotInput.value.trim();
      const expVal = expInput.value;

      if (!lot) {
        document.getElementById(`error-lot-${id}`).textContent = "Required";
        valid = false;
      }
      if (!expVal) {
        document.getElementById(`error-exp-${id}`).textContent = "Required";
        valid = false;
      } else {
        const expDate = new Date(expVal);
        if (expDate <= today) {
          document.getElementById(`error-exp-${id}`).textContent =
            "EXPIRED. Double check reagent!!";
          expInput.classList.add("expired");
          valid = false;
        }
      }
    });

    return valid;
  }

  generateBtn.addEventListener("click", () => {
    if (!validateInputs()) return;

    const tasklist = document.getElementById("tasklist").value.trim();
    const username = document.getElementById("username").value.trim();
    const timestamp = new Date().toLocaleString();

    const rows = [
      ["Tasklist", tasklist],
      ["Username", username],
      ["Generated", timestamp],
    ];

    currentList.forEach((name) => {
      const id = name.replace(/\s+/g, "_");
      const lot = document
        .getElementById(`lot-${id}`)
        .value.trim()
        .toUpperCase();
      const exp = document.getElementById(`exp-${id}`).value;
      rows.push([name, `Lot: ${lot} | Exp: ${exp}`]);
    });

    // Build QR text & table HTML
    const text = rows.map((r) => `${r[0]}: ${r[1]}`).join("\n");
    qr.value = text;
    printBtn.disabled = false;

    // Un-hide the QR container once generated
    document.getElementById("qr-container").style.display = "block";

    let html = "<table><tbody>";
    rows.forEach((r) => {
      html += `<tr><td>${escapeHtml(r[0])}</td><td>${escapeHtml(
        r[1]
      )}</td></tr>`;
    });
    html += "</tbody></table>";
    document.getElementById("table-container").innerHTML = html;
  });

  printBtn.addEventListener("click", () => {
    if (!qr.value) return;

    // Re-read and escape Tasklist right when Print is clicked:
    const raw = document.getElementById("tasklist").value.trim();
    const tasklist = escapeHtml(raw);

    const imgData = qrCanvas.toDataURL();
    const tableHtml = document.getElementById("table-container").innerHTML;

    const printHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Print QR</title>
    <style>
      body { font-family: 'Segoe UI', sans-serif; margin: 2rem; }
      table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
      td { border: 1px solid #333; padding: 0.5rem; }
    </style>
  </head>
  <body onload="window.print();window.close();">
    <h1>Reagents used for "${tasklist}"</h1>
    <div style="text-align:center;">
      <img src="${imgData}" alt="QR Code" />
    </div>
    ${tableHtml}
  </body>
</html>`;

    const popup = window.open("", "_blank");
    if (!popup) {
      alert("Please allow popups to print.");
      return;
    }
    popup.opener = null;                       
    popup.document.open();
    popup.document.write(printHtml);
    popup.document.close();
  });
});

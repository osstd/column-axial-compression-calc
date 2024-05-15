const inputsContainer = document.getElementById("inputs-container");

function setDefault() {
  createShapeMenu(inputsContainer, beamDetails, "Dsg");

  createWshapeProperties(0);

  calculate();
}
function createShapeMenu(container, data, key) {
  if (inputsContainer && inputsContainer.querySelector("select")) {
    // Get the select element
    const selectElement = inputsContainer.querySelector("select");

    // Remove the select element from the inputsContainer
    inputsContainer.removeChild(selectElement);
  }

  const select = document.createElement("select");

  data.forEach((item, index) => {
    const option = document.createElement("option");
    option.textContent = item[key];
    option.setAttribute("value", index);
    select.appendChild(option);
  });

  select.addEventListener("change", function () {
    const selectedIndex = parseInt(this.value);
    // might need to pass it later, keep for now
    // const selectedBeam = data[selectedIndex];
    createWshapeProperties(selectedIndex);
    calculate();
  });

  container.appendChild(select);
}

function createWshapeProperties(index) {
  updateBeamSect(index, "Dsg");
  updateBeamSect(index, "Ds_i");

  updateBeampProp(index, "Mass", "kg/m",);
  updateBeampProp(index, "A", "mm<sup>2</sup>");
  updateBeampProp(index, "B", "mm");
  updateBeampProp(index, "D", "mm");
  updateBeampProp(index, "T", "mm");
  updateBeampProp(index, "W", "mm");
  updateBeampProp(index, "Rx", "mm");
  updateBeampProp(index, "Ry", "mm");

  updateSelectedColumn(index);
}

function updateBeamSect(index, notation) {
  const element = document.querySelector(`#${notation}`);
  const elementChildToRemove = element.children[0];
  if (elementChildToRemove) {
    element.removeChild(elementChildToRemove);
  }
  const elementSpan = document.createElement("span");
  elementSpan.textContent = beamDetails[index][notation];
  element.appendChild(elementSpan);
}

function updateBeampProp(index, notation, unit) {
  const element = document.querySelector(`#${notation}`);
  
  let lengthChildren = element.children.length;


  let elementChildToRemove;

  if (lengthChildren > 1) {
    elementChildToRemove = element.children[1];
  }
  if (elementChildToRemove) {
    element.removeChild(elementChildToRemove);
  }
  const elementSpan = document.createElement("span");
  elementSpan.innerHTML = " " + beamDetails[index][notation] + ` ${unit}`;

  element.appendChild(elementSpan);
}

// Load type radio buttons and load and length input event listeners

const metricOption = document
  .getElementById("metric")
  .addEventListener("change", () => {
    createShapeMenu(inputsContainer, beamDetails, "Dsg");
    createWshapeProperties(0);
    calculate();
  });

const imperialOption = document
  .getElementById("imperial")
  .addEventListener("change", () => {
    createShapeMenu(inputsContainer, beamDetails, "Ds_i");
    createWshapeProperties(0);
    calculate();
  });

// Strong axis, weak axis and load event listeners

const strongAxis = document
  .getElementById("strong-axis")
  .addEventListener("change", calculate);

const weakAxis = document
  .getElementById("weak-axis")
  .addEventListener("change", calculate);

const laodInput = document
  .getElementById("load-input")
  .addEventListener("change", calculate);

let selectedColumn = beamDetails[0];

function updateSelectedColumn(index) {
  selectedColumn = beamDetails[index];

  console.log("current selected column:", selectedColumn);
}

function updateResults(notation, result) {
  const element = document.querySelector(`#${notation}`);
  element.innerHTML = result;
}

function calculate() {
  console.log("during calculate selectedColumn:", selectedColumn);

  let A, B, D, T, W, Rx, Ry, FY, E, KLx, KLy, phiCompression, N, factoredLoad, utilizationRatio;

  A = selectedColumn.A;
  B = selectedColumn.B;
  D = selectedColumn.D;
  T = selectedColumn.T;
  W = selectedColumn.W;
  Rx = selectedColumn.Rx;
  Ry = selectedColumn.Ry;
  FY = 345;
  E = 200000;

  KLx = parseFloat(document.getElementById("strong-axis").value);
  KLy = parseFloat(document.getElementById("weak-axis").value);

  phiCompression = 0.9;
  N = 1.34;

  factoredLoad = parseFloat(document.getElementById("load-input").value);

  utilizationRatio = 0;

  let classState = true;
  let flangeLimit = false;
  let webLimit = false;

  flangeBuckling = B / 2 / T;
  webBuckling = (D - 2 * T) / W;

  if (flangeBuckling > 200 / Math.sqrt(FY)) {
    flangeLimit = true;
  }

  if (webBuckling > 670 / Math.sqrt(FY)) {
    webLimit = true;
  }

  if (flangeLimit || webLimit) {
    classState = false;
    document.getElementById("results").style.display = "none";
    document.getElementById("utilization").style.display = "none";
    document.getElementById("section-class").style.display = "block";
    updateResults(
      "section-class",
      `<h3>Section exceeds Maximum width to thickness ratios in Table 1 CSA S16
    Section must be designed as a Class 4 section. Cl 13.3.1. does not apply.</h3>`
    );
    return;
  }

  if (classState) {
    document.getElementById("section-class").style.display = "none";
    document.getElementById("results").style.display = "block";
    document.getElementById("utilization").style.display = "block";
    let slendernessStrong = (KLx / Rx).toFixed(2);
    let slendernessWeak = (KLy / Ry).toFixed(2);

    let lambdaStrong = (
      slendernessStrong * Math.sqrt(FY / (Math.pow(Math.PI, 2) * E))
    ).toFixed(3);
    let lambdaWeak = (
      slendernessWeak * Math.sqrt(FY / (Math.pow(Math.PI, 2) * E))
    ).toFixed(3);

    let resistanceStrong = (
      (phiCompression *
        A *
        FY *
        Math.pow(1 + Math.pow(lambdaStrong, 2 * N), -1 / N)) /
      1000
    ).toFixed(0);
    let resistanceWeak = (
      (phiCompression *
        A *
        FY *
        Math.pow(1 + Math.pow(lambdaWeak, 2 * N), -1 / N)) /
      1000
    ).toFixed(0);

    let axialCapacity = Math.min(resistanceStrong, resistanceWeak);

    updateResults(
      "slenderness-strong",
      `KL<sub>x</sub>/R<sub>x</sub> = ${slendernessStrong}`
    );
    updateResults(
      "slenderness-weak",
      `KL<sub>y</sub>/R<sub>y</sub> = ${slendernessWeak}`
    );

    updateResults("lambda-strong", `λ<sub>x</sub> = ${lambdaStrong}`);
    updateResults("lambda-weak", `λ<sub>y</sub> = ${lambdaWeak}`);

    updateResults(
      "resistance-strong",
      `C<sub>rx</sub> = ${resistanceStrong} kN`
    );
    updateResults("resistance-weak", `C<sub>ry</sub> = ${resistanceWeak} kN`);

    updateResults("axial-capacity", `C<sub>r</sub> = ${axialCapacity} kN`);

    utilizationRatio = (factoredLoad / axialCapacity).toFixed(2);

    if (utilizationRatio > 1) {
      updateResults("utilization", `C<sub>f</sub>/C<sub>r</sub> = ${utilizationRatio} > 1 - Section Fail`)
    } else {
      updateResults("utilization", `C<sub>f</sub>/C<sub>r</sub> = ${utilizationRatio} < 1 - OK`)
    }
  }
}

function managePopUp() {
  const headerLink = document.getElementById("popup");
  const popupContainer = document.getElementById("popupContainer");
  const copyBtn = document.getElementById("copyLinkBtn");

  // Function to open the popup
  headerLink.addEventListener("click", function (event) {
    event.preventDefault();
    console.log("clicked");
    setTimeout(() => {
      popupContainer.style.display = "block";
    }, 150);
  });

  // Function to close the popup
  function closePopup() {
    popupContainer.style.display = "none";
  }

  // Close the popup when clicking outside or pressing Esc
  document.addEventListener("click", function (event) {
    if (!popupContainer.contains(event.target)) {
      closePopup();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closePopup();
    }
  });

  copyBtn.addEventListener("click", function () {
    const linkToCopy = "https://column-axial-compression-calc.vercel.app";
    navigator.clipboard
      .writeText(linkToCopy)
      .then(function () {
        alert("Link copied to clipboard: " + linkToCopy);
      })
      .catch(function (error) {
        console.error("Unable to copy link: ", error);
      });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setDefault();
  managePopUp();
});
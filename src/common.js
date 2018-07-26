function calculateIc(q, fr) {
  return ((3.47 - Math.log10(q)) ** 2 + (1.22 + Math.log10(fr)) ** 2) ** 0.5;
}

function calculateQ(qc, total, effective, n) {
  return ((qc - total) / 2116.217) * (2116.217 / effective) ** n;
}

function calculateDeltaQC1n(qc1n, finesContent) {
  
  return 11.9+(qc1n/14.6)*Math.exp(1.63-(9.7/(finesContent+2))-((15.7/(finesContent+2))**2))
}

function calculateCSR(cptInput, projectInput) {
  let {
    depth,
    upperLayerDepth,
    coneResistance,
    sleeveFriction,
    n60,
    designTotalVerticalStress,
    designEffectiveVerticalStress
  } = cptInput;

  coneResistance *= 2000;
  sleeveFriction *= 2000;

  const {
    icCutOffForLiq,
    earthquakeMagnitude,
    pga,
    depthToGroundWater
  } = projectInput;

  const firstPassQ = calculateQ(
    coneResistance,
    designTotalVerticalStress,
    designEffectiveVerticalStress,
    1
  );
  const frictionRatio =
    (sleeveFriction / (coneResistance - designTotalVerticalStress)) * 100;

  const firstPassIc = calculateIc(firstPassQ, frictionRatio);

  const firstPassLiquefiable = firstPassIc > icCutOffForLiq ? "NO" : "MAYBE";

  const secondPassQ = calculateQ(
    coneResistance,
    designTotalVerticalStress,
    designEffectiveVerticalStress,
    0.5
  );
  const secondPassIc = calculateIc(secondPassQ, frictionRatio);

  const n = (() => {
    if (firstPassIc > 2.6) {
      return 1;
    }
    if (secondPassIc < 2.6) {
      return 0.5;
    }
    return 0.7;
  })();

  const Q = calculateQ(
    coneResistance,
    designTotalVerticalStress,
    designEffectiveVerticalStress,
    n
  );
  const ic = calculateIc(Q, frictionRatio);

  const cn = Math.min(1.7, (2116.217 / designEffectiveVerticalStress) ** 0.5);

  // based on m = 0.5
  const qc1n = cn * (coneResistance / 2116.217);

  const finesContent =
    ic < 1.16 ? 0 : -8.159 * ic ** 3 + 70.846 * ic ** 2 - 128.21 * ic + 67.474;

  const intialDeltaQc1n = calculateDeltaQC1n(qc1n, finesContent);
  const qc1ncs = qc1n + intialDeltaQc1n;
  const mAfterIteration = 1.338 - 0.249 * qc1ncs ** 0.264;
  const CNBasedOnNewM = Math.min(
    1.7,
    (2116.217 / designEffectiveVerticalStress) ** mAfterIteration
  );

  const qc1nBasedOnNewM = CNBasedOnNewM * (coneResistance / 2116.217);
  const finalDeltaQc1n = calculateDeltaQC1n(qc1nBasedOnNewM, finesContent);
  const finalQc1ncs = qc1nBasedOnNewM + finalDeltaQc1n;
  console.log(qc1nBasedOnNewM, finalDeltaQc1n, finalQc1ncs);

  const crr = (() => {
    if (finalQc1ncs < 21) {
      return "SMALL";
    }
    if (finalQc1ncs > 254) {
      return "LARGE";
    }

    return Math.exp(
      finalQc1ncs / 113 +
        (finalQc1ncs / 1000) ** 2 +
        (finalQc1ncs / 140) ** 3 -
        (finalQc1ncs / 140) ** 3 +
        (finalQc1ncs / 137) ** 4 -
        2.8
    );
  })();

  const alpha = -1.012 - 1.126 * Math.sin((depth * 0.3048) / 11.73 + 5.133);
  const beta = 0.106 + 0.118 * Math.sin((depth * 0.3048) / 11.28 + 5.142);

  const rd = Math.exp(alpha + beta * earthquakeMagnitude);
  const csr = 0.65 * pga * (designTotalVerticalStress / designEffectiveVerticalStress) * rd;
  const cs = Math.min(0.3, 1 / (37.3 - 8.27 * finalQc1ncs ** 0.264));
  const ks = Math.min(
    1.1,
    1 - cs * Math.log(designEffectiveVerticalStress / 2116.217)
  );
  const msfMax = Math.min(2.2, 1.09 + (finalQc1ncs / 180) ** 3);
  const msf =
    1 + (msfMax - 1) * (8.64 * Math.exp(-earthquakeMagnitude / 4) - 1.325);

  //factor of safety
  const factorOfSafety =
    depth < depthToGroundWater ||
    ic > icCutOffForLiq ||
    firstPassLiquefiable === "NO" ||
    finalQc1ncs > 253
      ? 3
      : Math.min(3, (crr * msf * ks) / csr);

  const thicknessOfLiqLayer = factorOfSafety > 1 ? 0 : depth - upperLayerDepth;

  const n160 = n60 * CNBasedOnNewM;
  const deltan160 = Math.exp(
    1.63 + 9.7 / (finesContent + 0.01) - (15.7 / (finesContent + 0.01)) ** 2
  );

  const n160cs = n160 + deltan160;

  return {
    finesContent,
    qc1ncs: finalQc1ncs,
    deltaQc1ncs: finalDeltaQc1n,
    cn,
    ic,
    Q,
    n,
    alpha,
    beta,
    rd,
    csr,
    cs,
    ks,
    msf,
    factorOfSafety,
    thicknessOfLiqLayer,
    n160,
    n160cs,
    qc1n,
    qc1nBasedOnNewM,
    qc1nBasedOnNewM,
    mAfterIteration,
    crr,

    deltan160,
    finalDeltaQc1n,
    finalQc1ncs


  };
}

module.exports = {
  calculateCSR,
  calculateDeltaQC1n,
  calculateQ, 
  calculateIc
}
const jt = require("./js-types");
const { radian } = require('./math');

function calculatePriebeBaezImprovement(liq) {
  let { cptLayers, projectInputs } = liq;

  if (!Array.isArray(cptLayers)) {
    throw new TypeError("Arugment must be of type array.");
  }

  // calcualte the stone column diamter for sand and sility sand
  const {
    areaReplacementRatioForSand,
    areaReplacementRatioForSiltySand,
    stoneColumnSpacing,

  } = projectInputs;
  const stoneColumnDiameterForSand =
    2 *
    Math.sqrt(
      (areaReplacementRatioForSand * stoneColumnSpacing * stoneColumnSpacing) /
        Math.PI
    );
  const stoneColumnDiameterForSiltySand =
    2 *
    Math.sqrt(
      (areaReplacementRatioForSiltySand *
        stoneColumnSpacing *
        stoneColumnSpacing) /
        Math.PI
    );

  projectInputs = {
    ...projectInputs,
    stoneColumnDiameterForSand,
    stoneColumnDiameterForSiltySand
  };

  cptLayers.forEach(cptLayer => {
    const {
      depth,
      designEffectiveVerticalStress,
      totalVerticalStress,
      n60,
      soilZone,
      coneResistance,
      sleeveFriction
    } = cptLayer.cptInput;

    // get the value of cn

    const { error } = jt
      .object({
        unimprovedCSR: jt.object({
          cn: jt.number(),
          n160: jt.number(),
          n160cs: jt.number(),
          ic: jt.number(),
          qc1ncs: jt.number(),
          deltaQc1ncs: jt.number()
        })
      })
      .validate(cptLayer.cptOutput);

    if (error) {
      throw error;
    }
    const {
      cn,
      n160,
      n160cs,
      ic,
      qc1ncs,
      deltaQc1ncs
    } = cptLayer.cptOutput.unimprovedCSR;

    // now perform the improvements

    const result = calculatePriebeBaez(
      {
        depth,
        designEffectiveVerticalStress,
        totalVerticalStress,
        n60,
        n160,
        n160cs,
        coneResistance,
        sleeveFriction,
        cn,
        ic,
        qc1ncs,
        deltaQc1ncs,
        soilZone
      },
      projectInputs
    );

    cptLayer.cptOutput = {
      ...cptLayer.cptOutput,
      priebeBaez: result
    };
  });

  return liq;
}

function calculateSoilFrictionAngle(n160, frictionAngleOfClay, soilZone) {
  if (soilZone === frictionAngleOfClay) {
    return 10;
  }
  if (soilZone > 5.5) {
    return Math.sqrt(20 * n160);
  }
  return 0.5 * Math.sqrt(20 * n160);
}

function calculateEs(n60, soilZone) {
  
  if (soilZone === 11) {
    return 600 * (n60 + 6);
  }
  if (soilZone === 10 || soilZone === 9) {
    return 500 * (n60 + 15);
  }
  if (soilZone === 8) {
    return 300 * (n60 + 6);
  }
  return 320 * (n60 + 15);
}

function calculatePercentFines(ic) {
  if (ic < 1.16) {
    return 0;
  }
  return -8.159 * ic ** 3 + 70.846 * ic ** 2 - 128.21 * ic + 67.474;
}



function performPriebeImprovement(cptInput, projectInputs) {
  const {
    percentFines,
    EsinTsf,
    qc1ncs,
    coneResistance,
    sleeveFriction
  } = cptInput;
  const {
    finesCutOffForSiltyOrSandySoils,
    stoneFrictionAngle,
    stoneColumnSpacing,
    US,
    columnEc
  } = projectInputs;

  const scArea =
    percentFines > finesCutOffForSiltyOrSandySoils
      ? (Math.PI *
          ((projectInputs.stoneColumnDiameterForSiltySand * 12) / 2) ** 2) /
        144
      : (Math.PI * ((projectInputs.stoneColumnDiameterForSand * 12) / 2) ** 2) /
        144;

  const Kac = Math.tan(radian(45 - stoneFrictionAngle / 2)) ** 2;

  const gross = stoneColumnSpacing * stoneColumnSpacing;

  const n0 =
    1 +
    (scArea / gross) *
      ((5 - scArea / gross) / (4 * Kac * (1 - scArea / gross)) - 1);

  const aCAminus =
    -((4 * Kac * (n0 - 2) + 5) / (2 * (4 * Kac - 1))) +
    0.5 *
      Math.sqrt(
        ((4 * Kac * (n0 - 2) + 5) / (4 * Kac - 1)) ** 2 +
          (16 * Kac * (n0 - 1)) / (4 * Kac - 1)
      );
  const aCAplus =
    -((4 * Kac * (n0 - 2) + 5) / (2 * (4 * Kac - 1))) -
    0.5 *
      Math.sqrt(
        ((4 * Kac * (n0 - 2) + 5) / (4 * Kac - 1)) ** 2 +
          (16 * Kac * (n0 - 1)) / (4 * Kac - 1)
      );

  let acA1 = (() => {
    if (aCAminus > 0 && aCAplus < 0) {
      return aCAminus;
    }
    if (aCAminus < 0 && aCAplus > 0) {
      return aCAplus;
    }
    if (aCAminus > 0 && aCAplus > 0) {
      return Math.min(aCAminus, aCAplus);
    }

    return "ERROR";
  })();

  const deltaAcA1 = 1 / acA1 - 1;
  const barAcA1 = 1 / (gross / scArea + deltaAcA1);
  const fu = ((1 - US) * (1 - barAcA1)) / (1 - 2 * US + barAcA1);
  const n1 = 1 + barAcA1 * ((0.5 + fu) / (Kac * fu) - 1);
  const nMax = 1 + (scArea / gross) * (columnEc / EsinTsf - 1);
  const nUse = Math.min(nMax, n1, n0);

  const improvedQc1ncs = qc1ncs * nUse;
  const origFr = sleeveFriction / coneResistance;
  const improvedNormFs = origFr * improvedQc1ncs;

  return {
    qc1ncs: improvedQc1ncs,
    scArea
  };
}

function calculateA(fr, Ar) {
  if (fr < 1) {
    return 0.33216 - 2.33 * Ar;
  }
  if (fr < 1.5) {
    return 0.52491 - 3.4577 * Ar;
  }
  if (fr < 2) {
    return 0.518578 - 3.5349 * Ar;
  }

  if (fr < 2.5) {
    return 1.26142 - 8.5983 * Ar;
  }
  return 1;
}

function calculateB(fr, A) {
  if (fr < 1) {
    return (1 - A) / 240;
  }
  if (fr < 1.5) {
    return (1 - A) / 200;
  }
  if (fr < 2) {
    return (1 - A) / 100;
  }
  if (fr < 2.5) {
    return (1 - A) / 50;
  }
  return 1;
}
function performBaezImprovement(cptInput, projectInputs) {
  const { normalizedFrictionRatio, qc1ncs, scArea } = cptInput;
  const { stoneColumnSpacing } = projectInputs;

  const normFr = normalizedFrictionRatio * 100;
  const Ar = scArea / (stoneColumnSpacing * stoneColumnSpacing);

  const A = calculateA(normFr, Ar);
  const B = calculateB(normFr, A);
  const n = normFr > 2.5 ? 1 : 1 / (A + B * qc1ncs);

  const nModified = n < 1 ? 1 : 1 + (n - 1) * 0.5;

  const improvedQc1ncs = nModified * qc1ncs;
  const improvedSleeveFriction = improvedQc1ncs * normFr;

  return {
    qc1ncs: improvedQc1ncs,
    Ar,
    A, 
    B, 
    n,
    nModified, 
    improvedQc1ncs,
    improvedSleeveFriction,
    normFr
  };
}

function calculatePriebeBaez(cptInput, projectInputs) {
  const {
    frictionAngleOfClay,
    stoneColumnLength,
    methodForGroundDensification
  } = projectInputs;

  const {
    depth,
    coneResistance,
    sleeveFriction,
    n160,
    soilZone,
    n60,
    totalVerticalStress,
    effectiveVerticalStress,
    ic,
    qc1ncs,
    deltaQc1ncs,
    cn
  } = cptInput;

  // friction angle of soil
  const frictionAngleOfSoil = calculateSoilFrictionAngle(
    n160,
    frictionAngleOfClay,
    soilZone
  );
  // calculate Es
  const Es = calculateEs(n60, soilZone);
  // Es in tsf
  const EsinTsf = Es * 0.01044272;
  // normalized friction ratio
  const normalizedFrictionRatio =
    sleeveFriction / (coneResistance - totalVerticalStress / 2000);
  // calcualte percentfines
  const percentFines = calculatePercentFines(ic);

  const { qc1ncs: priebeQc1nc, scArea } = performPriebeImprovement(
    { ...cptInput, percentFines, EsinTsf },
    projectInputs
  );

  const { qc1ncs: baezQc1ncs, Ar, ...rest } = performBaezImprovement(
    { ...cptInput, percentFines, normalizedFrictionRatio, scArea },
    projectInputs
  );

  // final determination of normalized and improved raw values
  const designQc1ncs = (() => {
    if (depth > stoneColumnLength || methodForGroundDensification === "NONE") {
      return qc1ncs;
    }
    if (methodForGroundDensification === "WEIGHTED_AVERAGE") {
      return (Math.max(priebeQc1nc, baezQc1ncs) + priebeQc1nc + baezQc1ncs) / 3;
    }
    if (methodForGroundDensification === "PRIEBE") {
      return priebeQc1nc;
    }
    return baezQc1ncs;
  })();

  const improvedQc1n = designQc1ncs - deltaQc1ncs;

  const improvedConeResistance =
    depth < stoneColumnLength
      ? Math.max(coneResistance, improvedQc1n / cn)
      : coneResistance;
  const improvedSleeveFriction =
    normalizedFrictionRatio * improvedConeResistance;

  return {
    improvedConeResistance,
    improvedSleeveFriction,
    Ar,
    Es
  };
}

module.exports = calculatePriebeBaezImprovement;

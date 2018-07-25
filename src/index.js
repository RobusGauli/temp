const CptLiquefaction = require("./CptLiquefaction");

const { calculateUnimprovedCSR } = require('./unImprovedCSR');
const  calculatePriebeBaezImprovement = require('./priebeBaez');


function main() {
  const projectInputs = {
    icCutOffForLiq: 2.6,
    earthquakeMagnitude: 7,
    pga: 0.55,
    depthToGroundWater: 5,
    frictionAngleOfClay: 10,
    stoneColumnLength: 35,
    stoneColumnSpacing: 8.2,
    stoneFrictionAngle: 43,
    stoneDensity: 125,        
    areaReplacementRatioForSand: 0.105,
    areaReplacementRatioForSiltySand: 0.105,
    finesCutOffForSiltyOrSandySoils: 10, // in percent,
    US: 0.35,
    columnEc: 900,
    methodForGroundDensification: 'WEIGHTED_AVERAGE'
  };
  const cptInputs = [
    {
      depth: 0.16404,
      coneResistance: 7.42,
      sleeveFriction: 0.12009182,
      n60: 1.34,
      totalVerticalStress: 955.163,
      effectiveVerticalStress: 955.163,
      soilZone: 9,
    },
    {
      depth: 0.32808,
      coneResistance: 33.5643,
      sleeveFriction: 0.1723,
      n60: 5.04,
      totalVerticalStress: 972.006,
      effectiveVerticalStress: 972.006,
      soilZone: 11
    },
    {
      depth: 0.49212,
      coneResistance: 36.233,
      sleeveFriction: 0.206,
      n60: 5.58711,
      totalVerticalStress: 988.97,
      effectiveVerticalStress: 988.97,
      soilZone: 11
    }
  ];

  const liq = new CptLiquefaction(projectInputs);
  liq.addCptLayers(cptInputs);
  liq.pipe(calculateUnimprovedCSR).pipe(calculatePriebeBaezImprovement);
  console.log(liq);
}

main();

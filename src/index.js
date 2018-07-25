const CptLiquefaction = require("./CptLiquefaction");

const { calculateUnimprovedCSR } = require('./unImprovedCSR');
const  calculatePriebeBaezImprovement = require('./priebeBaez');

const soilClassification = require('./soilClassification');



function main() {
  const projectInputs = {
    icCutOffForLiq: 2.6,
    earthquakeMagnitude: 7,
    pga: 0.55,
    depthToGroundWater: 5,
    frictionAngleOfClay: 10,
    stoneColumnLength: 25,
    stoneColumnSpacing: 8,
    stoneFrictionAngle: 45,
    stoneDensity: 105,        
    areaReplacementRatioForSand: 0.11,
    areaReplacementRatioForSiltySand: 0.11,
    finesCutOffForSiltyOrSandySoils: 15, // in percent,
    US: 0.35,
    columnEc: 900,
    methodForGroundDensification: 'NONE'
  };
  const cptInputs = [
    {
      depth: 0.16,
      coneResistance: 494.88,
      sleeveFriction: 0.3862,
      n60: 57.37,
      designTotalVerticalStress: 21.30,
      designEffectiveVerticalStress: 21.30,
      totalVerticalStress: 21.30,
      effectiveVerticalStress: 21.30,
      soilZone: 11,
    },
    {
      depth: 0.33,
      coneResistance: 155.68,
      sleeveFriction: 0.4625,
      n60: 21.19,
      totalVerticalStress: 42.59,
      effectiveVerticalStress: 42.59,
      designEffectiveVerticalStress: 42.59,
      designTotalVerticalStress: 42.59,
      soilZone: 11
    },
    {
      depth: 0.49,
      coneResistance: 86.99,
      sleeveFriction: 0.3976,
      n60: 13.04,
      totalVerticalStress: 60.81,
      designEffectiveVerticalStress: 60.81,
      designTotalVerticalStress: 60.81,
      effectiveVerticalStress: 60.81,
      soilZone: 11
    }
  ];
  
  const lookup = {
    soilClassification,
  }
  const liq = new CptLiquefaction(projectInputs, lookup);
  liq.addCptLayers(cptInputs);
  liq.pipe(calculateUnimprovedCSR).pipe(calculatePriebeBaezImprovement);
  console.log(liq);
}

main();

const jt = require('./js-types');

function calculateSoilStress(liq) {
  const { lookup, projectInputs } = liq;

  console.log(lookup);

  const { cptLayers } = liq;
  cptLayers.forEach(cptLayer => {
    const upperCptLayer = cptLayer.upperCptInstance;
    const result = calculateSoilStressForLayer(cptLayer, upperCptLayer, lookup, projectInputs);
    cptLayer.cptOutput = {
      ...cptLayer.cptOutput,
      stressAfterPriebeBaez: result
    }
  })
  return liq;

}

function calculateSoilStressForLayer(cptLayer, upperCptLayer, lookup, projectInputs) {
  const {
    depth,
    soilZone,
    ic
  } = cptLayer.cptInput;

  const {
    improvedConeResistance
  } = cptLayer.cptOutput.priebeBaez;

  const {
    densityType: densityTypeNumber,
    nfForMaxDensity,
    nfForMinDensity,
    stoneColumnLength,
    stoneDensity,
    areaReplacementRatioForSand,
    assumedWaterDepth,
    earthEmbankmentSurcharge
  } = projectInputs;

  const {
    soilClassification: { data }
  } = lookup;

  let upperDepth = 0;
  if (upperCptLayer !== null) {
    // first layer
    upperDepth = upperCptLayer.cptInput.depth;
  }
  const n60 = (improvedConeResistance/1.058)/(8.5*(1-ic/4.6));

  const densityType = densityTypeNumber === 1
    ? 'moist'
    : 'dry'
  const { min, max } = data[`${soilZone}`][densityType];
  
  const likelyGSat = calculateLikelyGSat(n60, min, max, nfForMinDensity, nfForMaxDensity)

  const layerWeight = depth < stoneColumnLength
    ? (((1-(areaReplacementRatioForSand/2))*likelyGSat)+(stoneDensity*areaReplacementRatioForSand))*(depth-upperDepth)
    : likelyGSat * (depth - upperDepth)

  
  const { error } = jt.object({
    cptOutput: jt.object({
      stressAfterPriebeBaez: jt.object({
        totalVerticalStress: jt.number()
      })
    })
  }).validate(upperCptLayer);

  const totalVerticalStress = error === null
    ? layerWeight + upperCptLayer.cptOutput.stressAfterPriebeBaez.totalVerticalStress
    : layerWeight
  
  const effectiveVerticalStress = depth < assumedWaterDepth
    ? totalVerticalStress
    : totalVerticalStress - ((depth - assumedWaterDepth) * 62.4)
  
  const designTotalVerticalStress = (totalVerticalStress + earthEmbankmentSurcharge) > 100
    ? totalVerticalStress + earthEmbankmentSurcharge
    : totalVerticalStress
  
  const designEffectiveVerticalStress = (effectiveVerticalStress + earthEmbankmentSurcharge) > 100
    ? effectiveVerticalStress + earthEmbankmentSurcharge
    : effectiveVerticalStress
  
  return {
    likelyGSat,
    layerWeight,
    totalVerticalStress,
    effectiveVerticalStress,
    designEffectiveVerticalStress,
    designTotalVerticalStress
  }

}

function calculateLikelyGSat(n60, minGSat, maxGSat, nfForMinDensity, nfForMaxDensity) {
  
    let gsat = null;
    
    if (n60 === 0) {
      gsat = minGSat;
    } else if (n60 > nfForMaxDensity - 0.001) {
      gsat = maxGSat;
    } else {
      const a = nfForMaxDensity - nfForMinDensity;
      const b = nfForMaxDensity - n60;
      const r = a / b;
      const z = maxGSat - minGSat;
      gsat = maxGSat - 1 / r * z;
    }

    return gsat;
}

module.exports = calculateSoilStress;

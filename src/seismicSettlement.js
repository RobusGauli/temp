function performSeismicSettlement(liq) {
  const {
    cptLayers,
    projectInputs
  } =  liq;

  const {
    depthToDfi,
    depthToZcr,
  } = projectInputs;

  
  const depthToZeroSettlement = depthToDfi === depthToZcr
    ? depthToZcr + 1
    : depthToZcr

  cptLayers.forEach(cptLayer => {
    const seismicSettlement = calculateForLayer(cptLayer, projectInputs, depthToZeroSettlement)
    cptLayer.cptOutput = {
      ...cptLayer.cptOutput,
      seismicSettlement,
    }
  })

  return liq;
}

function calculateForLayer(cptLayer, projectInputs, depthToZeroSettlement) {
  // here we ahave the lauer
  const {
    depthToZcr,
    depthToDfi,
    depthToSoilMix,
    seismicSettlementMethod,
    factorOfSafetyForMinSettlement: fsForMinSettlement,
    factorOfSafetyForMaxSettlement: fsForMaxSettlement
  } = projectInputs;

  const {
    depth
  } = cptLayer.cptInput;

  
  const df = (() => {
    if (seismicSettlementMethod === 'TOKIMATSU_AND_SEED') {
      return 1;
    }

    if (depth < depthToSoilMix) {
      return 0;
    }

    if (depth < depthToDfi) {
      return 1;
    }

    return Math.max(0,1-((depth-depthToDfi)/(depthToZeroSettlement-depthToDfi)));

  })();

  let upperDepth = cptLayer.upperCptInstance
    ? cptLayer.upperCptInstance.cptInput.depth
    : 0;
  
  const {
    factorOfSafety: fs_0,

  } = cptLayer.cptOutput.unimprovedCSR;

  const {
    unimprovedSettlement: v_0,
    improvedSettlementWithoutReinforce: v_1,
    improvedSettlementWithReinforce: v_2
  } = cptLayer.cptOutput.volStrain;

  const { minSettlement: min0, maxSettlement: max0 } = calculateMinMaxSettlement(fs_0, v_0, depth, df, upperDepth, fsForMinSettlement, fsForMaxSettlement);
  
  // for improved without reinforcement
  const { factorOfSafety: fs_1 } = cptLayer.cptOutput.improvedCSR;
  

  const { minSettlement: min1, maxSettlement: max1 } = calculateMinMaxSettlement(fs_1, v_1, df, depth, upperDepth, fsForMinSettlement, fsForMaxSettlement);

  const { improvedFactorOfSafety: fs_2 } = cptLayer.cptOutput.boulanger;
  const { minSettlement: min2, maxSettlement: max2 } = calculateMinMaxSettlement(fs_2, v_2, df, depth, upperDepth, fsForMinSettlement, fsForMaxSettlement);

  return {
    min0,
    min1,
    min2,
    max0,
    max1,
    max2
  }

}

function calculateMinMaxSettlement(fs, v, depth, df, upperDepth, fsMin, fsMax) {

  let settlement = 0;

  if (typeof df === 'number') {
    settlement = (v*(depth-upperDepth)*12)*df;
  }
  let minSettlement = fs < fsMin
    ? settlement
    : 0;
  
  let maxSettlement = fs < fsMax
    ? settlement
    : 0;

  return {
    minSettlement,
    maxSettlement
  }
}

module.exports = performSeismicSettlement;

const { LOOKUP_GREATER, LOOKUP_SMALLER } = require('./lookup');

// lets get to the calculation

function calculateSettlement(factorOfSafety, csr, n160cs) {
  if (
    typeof factorOfSafety === 'number' &&
    typeof csr === 'number' &&
    typeof n160cs === 'number'
  ) {
    csr = csr.toFixed(2);
    n160cs = Math.round(n160cs).toString();
    if (parseInt(n160cs) > 32) {
      return 0;
    }

    if (factorOfSafety > 1) {
      return parseFloat(LOOKUP_GREATER[csr][n160cs])
    }
    return parseFloat(LOOKUP_SMALLER[csr][n160cs]);
  }

  return 1;
}

function performVolStrainCalculation(liq) {
  const { cptLayers, projectInputs } = liq;
  
  // we can at this point assume the js object structure is maintained

  cptLayers.forEach(cptLayer => {
    const volStrain = performVolStrainCalcForLayer(cptLayer, projectInputs);

    cptLayer.cptOutput = {
      ...cptLayer.cptOutput,
      volStrain
    }
  })

  return liq;
}

function performVolStrainCalcForLayer(cptLayer, projectInputs) {
  // here we have the layer
  const {
    depth
  } = cptLayer.cptInput;

  // for the unimproved case

  const {
    factorOfSafety: factorOfSafety_0,
    csr: csr_0,
    n160cs: n160cs_0
  } = cptLayer.cptOutput.unimprovedCSR;

  const unimprovedSettlement = calculateSettlement(factorOfSafety_0, csr_0, n160cs_0);

  // for improved but not reinforced

  const {
    factorOfSafety: factorOfSafety_1,
    csr: csr_1,
    n160cs: n160cs_1
  } = cptLayer.cptOutput.improvedCSR

  const improvedSettlementWithoutReinforce = calculateSettlement(factorOfSafety_1, csr_1, n160cs_1);

  // for imporoved with reinforcement
  const {
    improvedFactorOfSafety: factorOfSafety_2,
    alphaCSR: csr_2,
    
  } = cptLayer.cptOutput.boulanger;

  const improvedSettlementWithReinforce = calculateSettlement(factorOfSafety_2, csr_2, n160cs_1);

  return {
    unimprovedSettlement,
    improvedSettlementWithoutReinforce,
    improvedSettlementWithReinforce
  }
}

module.exports = performVolStrainCalculation;

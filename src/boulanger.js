// this js represents sheet number 11
const jt = require('./js-types');
const { radian } = require('./math');


function pluckForProjectInputs(projectInputs) {
  const { error, value } = pluckForProjectInputs.schema.validate(projectInputs);
  if (error) {
    throw error;
  }
  return value;

}

pluckForProjectInputs.schema = jt.object({
  elevationOfTopOfSoilProfile: jt.number(),
  soilPoissonRatio: jt.number(),
  stoneFrictionAngle: jt.number(),
  soilReinforcementMethod: jt.string(),
  Gc: jt.number(),
  Ec: jt.number(),
  stoneColumnLength: jt.number(),
  assumedWaterDepth: jt.number(),
  
  
})


const upperLayerSchema = jt.object({
  upperCptInstance: jt.object({
    cptInput: jt.object({
      depth: jt.number()
    })
  })
});

function performBoulangerAnalysis(liq) {
  const { cptLayers, projectInputs } = liq;

  const { error } = jt.list(jt.any()).validate(cptLayers);
  if (error) {
    throw error;
  }

  const projectInputsForBoulanger = pluckForProjectInputs(projectInputs)

  cptLayers.forEach(cptLayer => {
    const boulanger = boulangerAnalysisForLayer(cptLayer, projectInputs);
    cptLayer.cptOutput = {
      ...cptLayer.cptOutput,
      boulanger
    }
  })

  return liq;
}


function boulangerAnalysisForLayer(cptLayer, projectInputs) {
  const { depth } = cptLayer.cptInput;
  const {
    elevationOfTopOfSoilProfile,
    soilPoissonRatio,
    stoneFrictionAngle,
    soilReinforcementMethod,
    Gc,
    Ec,
    stoneColumnLength,
    assumedWaterDepth
  } = projectInputs;
  
  const {
    Ar,
    Es: EsInKpa
  } = cptLayer.cptOutput.priebeBaez;

  const {
    crr,
    csr,
    msf,
    firstPassLiquefiable,
  } = cptLayer.cptOutput.improvedCSR;

  const elevation = depth === 0
    ? 0
    : elevationOfTopOfSoilProfile - depth;
  
  const Kac = (Math.tan(radian(45-(stoneFrictionAngle/2))))**2;

  const alphaPriebe = (Kac*(1-Ar))/((Ar+Kac)*(1-Ar));
  const Es = EsInKpa * 20.88543;

  const Gs = Es/(2*(1+soilPoissonRatio));
  const Gr = (2000*Gc)/Gs;

  const gr = Math.min(1,((1.05*(Gr**-0.65))-0.04));
  const Rrd = Math.min(1,(1/(Gr*((Ar*gr*1)+((1/Gr)*(1-Ar))))))

  const KgBaez = 1/(Gr*(Ar+((1/Gr)*(1-Ar))));

  const combShearAndFlex = (Rrd*0.65)+((KgBaez*(1-0.65)/2))+((alphaPriebe*(1-0.65)/2));

  const csrReductionValue = (() => {
    if(
      depth > stoneColumnLength ||
      soilReinforcementMethod === 'NONE'
    ) {
      return 1;
    }

    if (soilReinforcementMethod === 'PRIEBE') {
      return alphaPriebe;
    }
    
    if (soilReinforcementMethod === 'BAEZ') {
      return KgBaez;
    }

    if (soilReinforcementMethod === 'RAYAMAJHI') {
      return Rrd;
    }
    return combShearAndFlex;
  })();

  const alphaCSR = depth < stoneColumnLength
    ? csrReductionValue * csr
    : csr;
  
  const improvedFactorOfSafety = (() => {
    if (depth < assumedWaterDepth) {
      return 3;
    }

    if (typeof crr === 'number') {
      return Math.min(((crr/alphaCSR)*msf), 3)
    }
    return 3;
  })();

  const { error }  = upperLayerSchema.validate(cptLayer);
  const upperLayerDepth = error
    ? 0
    : cptLayer.upperCptInstance.cptInput.depth;

  const thicknessOfLiqLayer = improvedFactorOfSafety > 1
    ? 0
    : cptLayer.cptInput.depth - upperLayerDepth;
  
  return {
    alphaPriebe,
    Es,
    Gs,
    Gc,
    Gr,
    gr,
    Rrd,
    KgBaez,
    combShearAndFlex,
    csrReductionValue,
    alphaCSR,
    thicknessOfLiqLayer,
    improvedFactorOfSafety
  }
}
module.exports = performBoulangerAnalysis;

const jt = require("./js-types");

const { calculateCSR } = require('./common');

function calculateImprovedCSR(liq) {
  const { projectInputs, cptLayers } = liq;

  if (!Array.isArray(cptLayers)) {
    throw new Error("cptLayers must be of type array");
  }

  cptLayers.forEach(cptLayer => {
    const {
      depth,
      n60,
    } = cptLayer.cptInput;
    
    const { error } = jt
      .object({
        cptInput: jt.object({
          depth: jt.number()
        })
      })
      .validate(cptLayer.upperCptInstance);
    

    const upperLayerDepth = error
      ? 0
      : cptLayer.upperCptInstance.cptInput.depth;

    const { error: priebeBaezError } = jt
      .object({
        cptOutput: jt.object({
          priebeBaez: jt.object({
            improvedConeResistance: jt.number(),
            improvedSleeveFriction: jt.number()
          })
        })
      })
      .validate(cptLayer)
    
    if (priebeBaezError) {
      throw priebeBaezError;
    }

    const { improvedConeResistance: coneResistance, improvedSleeveFriction: sleeveFriction } = cptLayer.cptOutput.priebeBaez;


    const {error: stressError } = jt
      .object({
        cptOutput: jt.object({
          stressAfterPriebeBaez: jt.object({
            designEffectiveVerticalStress: jt.number(),
            designTotalVerticalStress: jt.number()
          })
        })
      })
      .validate(cptLayer);
    
    if (stressError) {
      throw stressError
    }
    
    const { designEffectiveVerticalStress, designTotalVerticalStress } = cptLayer.cptOutput.stressAfterPriebeBaez;
    
    const result = calculateCSR(
      {
        n60,
        depth,
        coneResistance,
        sleeveFriction,
        upperLayerDepth,
        designEffectiveVerticalStress,
        designTotalVerticalStress
      },
      projectInputs
    );

    cptLayer.cptOutput = {
      ...cptLayer.cptOutput,
      improvedCSR: result
    };
  });

  return liq;
}

module.exports = {
  calculateImprovedCSR,
};

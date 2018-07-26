const jt = require("./js-types");

const { calculateCSR } = require('./common');

function calculateUnimprovedCSR(liq) {
  const { projectInputs, cptLayers } = liq;

  if (!Array.isArray(cptLayers)) {
    throw new Error("cptLayers must be of type array");
  }

  cptLayers.forEach(cptLayer => {
    const {
      depth,
      coneResistance,
      sleeveFriction,
      n60,
      designTotalVerticalStress,
      designEffectiveVerticalStress,
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
      unimprovedCSR: result
    };
  });

  return liq;
}

module.exports = {
  calculateUnimprovedCSR,
};

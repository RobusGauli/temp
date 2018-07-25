const jt = require('./js-types');

function calculateSoilStress(liq) {
  const { lookup } = liq;

  console.log(lookup);

  const { cptLayers } = liq;
  cptLayers.forEach(cptLayer => {
    const result = calculateSoilStressForLayer(cptLayer, lookup);
    cptLayer.cptOutput = {
      ...cptLayer.cptOutput,
      stressAfterPriebeBaez: result
    }
  })

}

function calculateSoilStressForLayer(cptLayer, lookup) {
  return 'yo';
}
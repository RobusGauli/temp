const jt = require("./js-types");

// create a CPT instance
function createCpt(cptInputObject) {
  return {
    cptInput: cptInputObject,
    cptOutput: {},
    upperCptInstance: null,
    lowerCptInstance: null
  };
}

class CptLiquefaction {
  
  constructor(projectInputs) {
    this.projectInputs = projectInputs;
    this.cptLayers = [];
    this.firstCptInstance = null;
    this.lastCptInstance = null;
    this.currentCptInstance = null;
  }

  addCptLayers(cptInputObjects) {
    if (!Array.isArray(cptInputObjects)) {
      throw new TypeError("Argument must be of type array.");
    }

    const { error } = CptLiquefaction.validCptInputSchema.validate(
      cptInputObjects
    );
    if (error) {
      throw error;
    }

    cptInputObjects.forEach(cptInputObject => {
      this.addCpt(cptInputObject);
    });
  }

  pipe(func) {
    return func(this);
  }
  addCpt(cptInputObject) {
    // create and object
    const cptInstance = createCpt(cptInputObject);

    if (this.currentCptInstance !== null) {
      cptInstance.upperCptInstance = this.currentCptInstance;
      this.currentCptInstance.lowerCptInstance = cptInstance;

    }
    
    if (this.firstCptInstance === null) {
      // this is the first one in the add
      this.firstCptInstance = cptInstance;
    }
    this.lastCptInstance = cptInstance;
    // now add the cptInstance to the list
    this.cptLayers.push(cptInstance);
    // update the current cpt instance
    this.currentCptInstance = cptInstance;
  }
}

CptLiquefaction.validCptInputSchema = jt.list(
  jt.object({
    depth: jt.number(),
    coneResistance: jt.number(),
    sleeveFriction: jt.number(),
    n60: jt.number(),
    totalVerticalStress: jt.number(),
    effectiveVerticalStress: jt.number(),
    soilZone: jt.number()
  })
);

module.exports = CptLiquefaction;

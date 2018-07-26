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

const lookupSchema = jt.object({
  soilClassification: jt.object({
    data: jt.object({}).minLength(1)
  })
})

class CptLiquefaction {
  
  constructor(projectInputs, lookup) {
    // validate the projectInputs and lookup
    
    const { error } = lookupSchema.validate(lookup);
    if (error) {
      throw error;
    }

    const {error: err} = jt.object({}).minLength(1).validate(projectInputs);
    if (err) {
      throw err;
    }

    this.projectInputs = projectInputs;
    this.lookup = lookup;
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
    n60: jt.number(),
    depth: jt.number(),
    soilZone: jt.number(),
    coneResistance: jt.number(),
    sleeveFriction: jt.number(),
    totalVerticalStress: jt.number(),
    effectiveVerticalStress: jt.number(),
    designTotalVerticalStress: jt.number(),
    designEffectiveVerticalStress: jt.number()
  })
);

module.exports = CptLiquefaction;

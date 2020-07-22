module.exports = ({ Structures }, { bypass, applyToClass }) => {
  Structures.extend("structure", Structure => {
    return class newStructure extends Structure {
      
    }
  })
}

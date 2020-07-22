const Discord = require("discord.js")

module.exports = {
  User: require("./User.js"),
  Guild: require("./Guild.js"),
  GuildMember: require("./GuildMember.js"),
  Message: require("./Message.js"),
  TextChannel: require("./TextChannel.js"),
  
  init() {
    const bypass = (structure, _class) => {
      const hasInstance = structure[Symbol.hasInstance]
      
      Object.defineProperty(structure, Symbol.hasInstance, {
        value: function(instance) {
          return (instance && instance.constructor) === _class || instance instanceof _class || hasInstance(instance)
        },
        writable: true,
        configurable: true
      })
    }
    
    const applyToClass = (_class, parent, props) => {
      if (props === true) return Object.defineProperties(_class.prototype, Object.getOwnPropertyDescriptors(parent.prototype))
      
      for (const prop of props) {
        Object.defineProperty(
          _class.prototype,
          prop,
          Object.getOwnPropertyDescriptor(parent.prototype, prop)
        )
      }
      return _class
    }
    
    for (const i in this) {
      if (i !== "init") this[i](Discord, { bypass, applyToClass })
    }

    return this;
  }
}

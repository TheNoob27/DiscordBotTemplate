const { Commmand, Embed } = require("../classes")

module.exports = class extends Commmand {
  constructor(client) {
    super(client, {
      name: "",
      aliases: [],
      description: "",
      usage: "yiay ",
      category: "",
      cooldown: 1000
    })
  }
}
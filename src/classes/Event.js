const Toggler = require("./Toggle.js")

module.exports = class Event extends Toggler {
  constructor(client, name, emitter) {
    super()
    Object.defineProperty(this, "client", { value: client })
    this.name = name
    this.reloaded = false
    this.errors = 0
    if (emitter) this.emitter = emitter
  }

  disable() {
    this.errors = 0
    return super.disable()
  }

  shouldRun() {
    return this.enabled
  }

  getData() {}

  async fetchPartials(...args) {
    return args
  }

  reload(autoreload = false) {
    delete require.cache[require.resolve(`../events/${this.name}.js`)]
    this.reloaded = true

    if (autoreload) this.load()
    return true
  }

  load() {
    this.reloaded = false
    console.log("[EVENT] Loaded the " + this.name + " event!")
    return true
  }
}

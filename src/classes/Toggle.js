module.exports = class Toggle {
  constructor(status = true) {
    this.enabled = Boolean(status)
  }

  get disabled() {
    return !this.enabled
  }

  enable() {
    this.enabled = true
    return this
  }

  disable() {
    this.enabled = false
    return this
  }

  set(x) {
    this.enabled = Boolean(x)
    return this
  }

  toggle() {
    this.enabled = !this.enabled
    return this
  }
}

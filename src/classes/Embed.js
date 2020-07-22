const { MessageEmbed, Util } = require("discord.js")

class Embed extends MessageEmbed {
  constructor(data = {}, nows = false) {
    super(data)
    this.noWhitespace = nows
    return this
  }

  addBlankField(inline = false) {
    return this.addField(null, null, inline)
  }

  addField(name, value, inline = false) {
    if (!name && !this.noWhitespace) name = "\u200b"
    if (!value && !this.noWhitespace) value = "\u200b"

    return super.addField(name, value, inline)
  }

  addFields(...fields) {
    if (!this.noWhitespace) fields = fields.flat(2).map(f => ({
      name: f.name || "\u200b",
      value: f.value || "\u200b",
      inline: f.inline || false
    }))

    return super.addFields(...fields)
  }

  attachFile(file) {
    return super.attachFiles([file])
  }

  setFields(...fields) {
    this.fields = []

    return fields[0] ? this.addFields(...fields) : this
  }

  setColor(color) {
    super.setColor(color)
    if (this.color === 0xFFFFFF) this.color--
    return this
  }

  suppress(suppressOrNot = true) {
    this.suppressEmbeds = !!suppressOrNot
    return this
  }

  unsuppress() {
    return this.suppress(false)
  }

  spliceFields(i, c, ...fields) {
    if (!this.noWhitespace) fields = fields.flat(2).map(f => ({
      name: f.name || "\u200b",
      value: f.value || "\u200b",
      inline: f.inline || false
    }))

    return super.spliceFields(i, c, ...fields)
  }

  splitIntoFields(title = "", text = "", inline = false, options = {}) {
    if (!text && !title) throw new Error("No text was provided.")
    
    return this.addFields(Util.splitMessage(text, { ...options, maxLength: 1024 }).map((value, i) => i === 0 ? { name: title, value, inline } : { value, inline }))
  }

  spliceIntoFields(index = this.fields.length, count = 0, { name: title = "", value: text = "", inline = false } = {}, options = {}) {
    if (!text && !title) throw new Error("No text was provided.")

    return this.spliceFields(index, count, Util.splitMessage(text || "\u200b", { ...options, maxLength: 1024 }).map((value, i) => i === 0 ? { name: title, value, inline } : { value, inline }))
  }
}

module.exports = Embed

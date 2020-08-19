const { Collection } = require("discord.js")
const Toggle = require("./Toggle")

class Command extends Toggle {
  constructor(client, options = {}) {
    super()
    
    Object.defineProperty(this, "client", { value: client })
    
    this.help = {
      name: options.name || null,
      aliases: options.aliases || [],
      description: options.description || "Not Set",
      usage: options.usage || "Not Set",
      category: options.category || "None",
      example: options.example || ""
    }
    
    this.settings = {
      cooldown: options.cooldown || 1000,
      cooldownmsg: options.cooldownmsg || `You're using this command too frequently! Please wait {time} before using it again.${this.client.voters ? " Voters have their cooldown times cut in half." : ""}`,
      errorMessage: null,
      disableMessage: null,
      lowerCaseArgs: typeof options.lowerCaseArgs === "number" ? [options.lowerCaseArgs] : options.lowerCaseArgs || false,
      owner: Boolean(options.owner),
      requiredPermissions: options.requiredPermissions || [],
      botPerms: options.botPerms || []
    }
    
    this.cooldowns = new Collection()
  }
  
  addCooldown(id) {
    return this.cooldowns.set(id, {
      id,
      time: Date.now(),
      timer: setTimeout(() => {
        this.cooldowns.delete(id)
      }, this.client.voters && this.client.voters.includes(id) ? this.settings.cooldown / 2 : this.settings.cooldown)
    })
  }
  
  deleteCooldown(id) {
    if (!this.cooldowns.has(id)) return false;

    clearTimeout(this.cooldowns.get(id).timer)
    this.cooldowns.delete(id)
    return true
  }
  
  disable(reason) {
    if (reason && typeof reason === "string") this.settings.disableMessage = reason
    return super.disable()
  }
  
  getHelp(prefix = this.client.config.prefix) {
    return new Embed()
    .setTitle("Help")
    .setColor(this.enabled ? this.client.colors.help : this.client.colors.error)
    .addField(`Command: ${prefix}${this.help.name}`, `**Aliases**: ${this.help.aliases.join(", ") || "Not set"} \n**Description**: ${this.help.description} \n**Usage**: ${this.help.usage.replace(this.client.config.prefix, prefix)} \n${this.help.example ? `**Example${this.help.example.includes("\n") ? "s" : ""}**: ${this.help.example instanceof Array ? this.help.example.random().replace(this.client.config.prefix, prefix) : this.help.example.replace(this.client.config.prefix, prefix)}` : ""}`)
    .addField("Extra", `**Category**: ${this.help.category} \n**Cooldown**: ${ms(this.settings.cooldown)} \n**Enabled**: ${this.enabled ? "Yes" : "No"}`)
    .addField("Notices", this.notices ? (this.settings.errorMessage ? "Something is currently wrong with this command: **" + this.settings.errorMessage + "**.\n" : "") + (this.settings.disableMessage ? "This command is disabled: **" + this.settings.disableMessage + "**" : "") : "None")
    .setFooter("() = optional, <> = required.")
  }
  
  reload() {
    delete require.cache[require.resolve(`../commands/${this.help.name}.js`)]
    let newcmd = new (require(`../commands/${this.help.name}.js`))(this.client)
    
    if (this.help.name !== newcmd.help.name) this.client.commands.delete(this.help.name)
    this.client.commands.set(newcmd.help.name, newcmd)
    return this
  }

  toString() {
    return this.help.name
  }
  
  run() {
    return Promise.reject("No run function defined for command " + this.name)
  }
}

module.exports = Command

const { Collection } = require("discord.js")
const { readdirSync: readdir } = require("fs")

class CommandHandler extends Collection {
  constructor(client) {
    super()
    this.client = client
    this._aliases = null
  }

  get aliases() {
    if (this._aliases) return this._aliases
    const aliases = new Collection()
    for (const command of this.values()) {
      for (const alias of command.help.aliases) aliases.set(alias, command.help.name)
    }
    return this._aliases = aliases
  }
  
  set(k, v) {
    this._aliases = null
    return super.set(k, v)
  }
  
  delete(k) {
    this._aliases = null
    return super.delete(k)
  }

  load(filter, reload) {
    const cmdFiles = filter instanceof Array ? filter.map(f => f + ".js") : readdir("./src/commands/");

    console.log(`[CLIENT] Loading a total of ${cmdFiles.length} commands.`);
    cmdFiles.forEach(f => {
      let cmd;
      try {
        if (reload) delete require.cache[require.resolve(`../commands/${f}`)]
        cmd = new (require(`../commands/${f}`))(this.client)
        this.set(cmd.help.name, cmd)
      } catch(e) {
        if (reload) throw e 
        return console.error(`Couldn't load command: ${f} - Error:`, e)
      }
    })

    if (!reload) console.log(`[CLIENT] Loaded ${filter instanceof Array ? filter.length : this.size} commands and ${this.aliases.size} aliases`);

    return this
  }

  reload(cmd, throws, throwcmd) {
    if (cmd == null) {
      this.clear()
      ["Toggle", "Command"].forEach(i => delete require.cache[require.resolve(`../classes/${i}.js`)])
      return this.load(null, true)
    }

    if (Array.isArray(cmd)) return cmd.filter(c => c).map(c => this.reload(c, throws, throwcmd))[0]

    let c = this.resolve(cmd)
    if (c) c.reload()
    else if (typeof cmd === "string") {
      try {
        this.load([cmd], true)
      } catch(e) { if (throws) throw throwcmd ? [cmd, e] : e }
    }

    return this
  }

  resolve(cmd) {
    if (typeof cmd === "string") cmd = cmd.toLowerCase()
    return this.get(cmd) || this.get(this.aliases.get(cmd))
  }
}

module.exports = CommandHandler
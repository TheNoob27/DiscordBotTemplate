const { Client, Structures } = require("discord.js")
const { CommandHandler, EventHandler } = require("../handlers")
const db = require("../db")
const { Table } = db

class BOT extends Client {
  constructor() {
    super({
      shards: "auto",
      messageCacheMaxSize: 50, // if you need messages, higher this number lol
      allowedMentions: {
        parse: ["users"] // only mention users
      },
      partials: [
        "MESSAGE",
        "REACTION",
        "USER"
      ],
      restRequestTimeout: 30000,
      retryLimit: 2,
      restTimeOffset: 750,
      presence: {
        status: "dnd",
        activity: {
          name: "Loading...",
          type: "PLAYING"
        }
      },
      ws: {
        intents: [  // comment stuff that you dont need
          "GUILDS",
          "GUILD_MEMBERS",
       // "GUILD_BANS",
          "GUILD_EMOJIS",
       // "GUILD_INTEGRATIONS",
       // "GUILD_WEBHOOKS",
       // "GUILD_INVITES",
       // "GUILD_VOICE_STATES",
       // "GUILD_PRESENCES", // ram eater
          "GUILD_MESSAGES",
          "GUILD_MESSAGE_REACTIONS",
       // "GUILD_MESSAGE_TYPING",
       // "DIRECT_MESSAGES",
       // "DIRECT_MESSAGE_REACTIONS",
       // "DIRECT_MESSAGE_TYPING"
        ]
      }
    })

    this.commands = new CommandHandler(this)
    this.events = new EventHandler(this)
    this.config = require("../config")
    this.colors = this.config.colors
    this.db = new Table(
      "data", // input your own table name if you want
      true, // cache the stuff we get
      true // automatically save to the db when an entry has been changed 
    )

    this.ownerID = this.config.owner

    // state of the art emoji manager
    Object.defineProperty(this, "emojis", { value: new ClientEmojiManager(this), configurable: true })

    require("../misc/functions")(this)
  }

  /* ------- getters ------- */

  get aliases() {
    return this.commands.aliases
  }

  get owner() {
    return this._owner || this.users.cache.get(this.ownerID) || new (Structures.get("User"))(this, { id: this.ownerID })
  }

  /* ------- overwritten functions ------- */
  
  login() {
    console.log("[CLIENT] => Logging in...")
    return super.login(process.env.TOKEN).then(() => console.log(`[CLIENT] Logged in as ${this.user.tag}`) || this)
  }
  
  /* ------- loading stuff ------- */

  async init() {
    this._owner = await this.users.fetch(this.ownerID)
    this.events.load()
    this.commands.load()
  }
  
  static initialiseProcess() {
    require("../functions.js") // load functions

    console.log(`\n\n\n[${new Date().format()}] -- NEW PROCESS --\n`)
    const { log, error } = console
    // make everything log with a date
    console.log = function (...data) {
      data.unshift(new Date().format({ style: "[DD MM | HH:mm:SS]" }))
      return log(...data)
    }
    console.error = function (...data) {
      data.unshift(new Date().format({ style: "[DD MM | HH:mm:SS]" }))
      return error(...data)
    }

    require('dotenv').config() // load env variables
    require("../structures").init() // load structures

    return this
  }
}

module.exports = BOT
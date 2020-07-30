const { Client, Structures } = require("discord.js")
const ClientEmojiManager = require("./ClientEmojiManager")
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
  
  get messages() {
    return this.channels.cache.reduce((prev, channel) => channel.messages ? channel.messages.cache.size + prev : prev, 0)
  }

  get owner() {
    return this._owner || this.users.cache.get(this.ownerID) || new (Structures.get("User"))(this, { id: this.ownerID })
  }

  /* ------- overwritten functions ------- */
  
  login() {
    // process.env.TOKEN is the default location to check, you can change this
    console.log("[CLIENT] => Logging in...") 
    return super.login(process.env.TOKEN).then(() => console.log(`[CLIENT] Logged in as ${this.user.tag}`) || this)
  }
  
  
  /* ------- custom functions ------- */
  
  canSpeak(channel, embeds = false, user = this.user, custom = null) {
    let member = channel.guild.member(user)
    let perms = member ? channel.memberPermissions(member) : null
    return perms ? perms.has(custom ? custom : embeds ? 18432 : 2048) : false
  }
  
  hasPermission(channel, permission = 2048, user = this.user) {
    if (!channel) return;
    
    if (permission === "READ_MESSAGES") permission = ["VIEW_CHANNEL", "READ_MESSAGE_HISTORY"]
    else if (permission instanceof Array && permission.includes("READ_MESSAGES")) permission = permission.trim("READ_MESSAGES").concat([66560])
    
    return this.canSpeak(channel, undefined, user, permission)
  }

  hasVoted(user = {}) {
    if (!this.voters) return false
    if (user && user.id) user = user.id

    return this.voters.includes(user)
  }

  isOwner(user = {}) {
    user = user.id ? user.id : user
    return user === this.owner.id
  }
  
  /* ------- loading stuff ------- */

  async init() {
    this.events.load()
    this.commands.load()
    return;
    await this.login().then(() => {
      this.once("ready", async () => {
        if (!this.users.cache.has(this.ownerID)) this._owner = await this.users.fetch(this.ownerID).default(null)
      })
    })
  }
  
  static initialiseProcess() {
    require("../misc/functions.js") // load functions

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

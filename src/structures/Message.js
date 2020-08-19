const { Embed } = require("../classes")
const { TypeError } = require("../../node_modules/discord.js/src/errors"),
      ReactionManager = require("../../node_modules/discord.js/src/managers/ReactionManager.js")

module.exports = ({ Structures, Base, Collection, MessageAttachment, MessageFlags, Constants: { MessageTypes }, MessageMentions: Mentions, APIMessage }, { bypass, applyToClass }) => {
  Structures.extend("Message", M => {
    class Message extends Base {
      constructor(client, data, channel) {
        super(client);
        this.channel = channel;
        this.deleted = false;
        
        if (data) this._patch(data)
      }
      
      _patch(data) {
        this.id = data.id;
        this.type = MessageTypes[data.type];
        this.content = data.content;
        this.author = data.author ? this.client.users.add(data.author, !data.webhook_id) : null;
        this.pinned = data.pinned;

        this.embeds = (data.embeds || []).map(e => new Embed(e, true));
        this.attachments = new Collection();
        if (data.attachments) {
          for (const attachment of data.attachments) {
            this.attachments.set(attachment.id, new MessageAttachment(attachment.url, attachment.filename, attachment));
          }
        }
        
        this.createdTimestamp = new Date(data.timestamp).getTime();
        this.editedTimestamp = data.edited_timestamp ? new Date(data.edited_timestamp).getTime() : null;
        
        this.reactions = new ReactionManager(this);
        if (data.reactions && data.reactions.length > 0) {
          for (const reaction of data.reactions) {
            this.reactions.add(reaction);
          }
        }
        
        this.mentions = new Mentions(this, data.mentions, data.mention_roles, data.mention_everyone, data.mention_channels);
        this._edits = [];
        
        if (this.member && data.member) {
          this.member._patch(data.member);
        } else if (data.member && this.guild && this.author) {
          this.guild.members.add(Object.assign(data.member, { user: this.author }));
        }
        
        this.flags = new MessageFlags(data.flags).freeze();
        
        if (!this.content) {
          if (data.type === 6) this.content = `**${this.member ? this.member.displayName : this.author ? this.author.username || this.author.toString() : "An Unknown User"}** pinned **a message** to this channel. **See all the pins.**`
          else if (data.type === 7) this.content = this.constructor.JoinMessages.random().replace(/{user}/g, "**" + (this.author ? this.author.username || this.author.toString() : "An Unknown User") + "**")
          else if ([8, 9, 10, 11].includes(data.type)) this.content = `**${this.member ? this.member.displayName : this.author ? this.author.username || this.author.toString() : "An Unknown User"}** just boosted the server!${data.type !== 8 ? ` ${this.guild.name} has achieved **Level ${data.type - 8}!**` : ""}`
        }
      }
      
      get embed() {
        return this.embeds[0] || null
      }
      
      edit(content, options) {
        // passed an embed/options object 
        if (!options && content instanceof Embed) [content, options] = ["", content]
        
        // un/suppress embeds
        if (options && (options.suppressEmbeds || options.embeds === false) && !this.flags.has(MessageFlags.FLAGS.SUPPRESS_EMBEDS)) 
          options.flags = options.flags ? 
            options.flags | MessageFlags.FLAGS.SUPPRESS_EMBEDS :
            MessageFlags.FLAGS.SUPPRESS_EMBEDS
        
        else if (options && options.suppressEmbeds === false && this.flags.has(MessageFlags.FLAGS.SUPPRESS_EMBEDS))
          options.flags = options.flags ?
            options.flags & ~MessageFlags.FLAGS.SUPPRESS_EMBEDS :
            0
        
        // Embed.prototype.suppress()
        if (options instanceof Embed && options.flags) options = {flags: options.flags, embed: options}
        
        const { data } =
          content instanceof APIMessage ? content.resolveData() : APIMessage.create(this, content, options).resolveData();
        
        return this.client.api.channels[this.channel.id].messages[this.id].patch({ data }).then(d => {
          const clone = this._clone();
          clone._patch(d);
          clone._edits.length = 0;
          return clone;
        });
      }
          
      react(...emoji) {
        emoji = emoji.flat()
        
        if (emoji.length > 1) {
          return emoji.asyncMap(e => this.react(e))
        } else emoji = this.client.emojis.resolveIdentifier(emoji[0]);
        
        if (!emoji) throw new TypeError('EMOJI_TYPE');
        return this.client.api
          .channels(this.channel.id)
          .messages(this.id)
          .reactions(emoji, '@me')
          .put()
          .then(
            () =>
              this.client.actions.MessageReactionAdd.handle({
                user: this.client.user,
                channel: this.channel,
                message: this,
                emoji: parseEmojiToObject(emoji),
              }).reaction,
          );
      }
      
      unreact(...emojis) {
        emojis = emojis.flat()
        
        let reactions = emojis.map(e => {
          let resolve = this.reactions.cache.get(e)
          if (resolve) return resolve
          
          resolve = this.client.emojis.resolveIdentifier(e) // this.reactions.resolve(e) || this.reactions.cache.find(r => r.id && r.identifier === e)
          if (resolve) resolve = this.reactions.cache.find(r => r.emoji.identifier === resolve)
          
          return resolve || null
        }).trim(null, undefined).filter(r => r.users.cache.has(this.client.user.id))
        
        if (reactions.length) return reactions.asyncMap(r => r.users.remove(this.client.user.id))
        return Promise.resolve([])
      }
    }

    applyToClass(Message, M, [
      "deletable",
      "delete",
      "equals",
      "fetch",
      "guild",
      "member",
      "partial",
      "patch",
      "reply",
      "toString",
      "url"
    ])
    
    Message.JoinMessages = [ 
      "Welcome, {user}. We hope you brought pizza.",
      "{user} joined the party.",
      "A wild {user} appeared.",
      "{user} just slid into the server.",
      "{user} just showed up!",
      "Good to see you, {user}.",
      "Welcome {user}. Say hi!",
      "{user} hopped into the server.",
      "Good to see you, {user}.",
      "Everyone welcome {user}!",
      "{user} is here.",
      "{user} just landed.",
      "Glad you're here, {user}.",
      "Yay you made it, {user}!"
    ]
    
    
    bypass(M, Message)

    return Message
  })
}

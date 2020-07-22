module.exports = ({ Structures, Collection, Base, GuildEmojiManager, GuildChannelManager, GuildMemberManager, RoleManager }, { bypass, applyToClass }) => {
  Structures.extend("Guild", Guild => {
    class StarboardGuild extends Base {
      constructor(client, data) {
        super(client);
        this.channels = new GuildChannelManager(this);
        this.members = new GuildMemberManager(this);
        this.roles = new RoleManager(this);

        if (!data) return;
        if (data.unavailable) {
          this.available = false;
          this.id = data.id;
        } else {
          this._patch(data);
          if (!data.channels) this.available = false;
        }
        
        this.shardID = data.shardID;
        this.left = false
      }
      
      _patch(data) {
        this.name = data.name;
        this.icon = data.icon;
        this.memberCount = data.member_count || this.memberCount;
        this.large = Boolean('large' in data ? data.large : this.large);
        this.joinedTimestamp = data.joined_at ? new Date(data.joined_at).getTime() : this.joinedTimestamp;
        
        this.features = data.features || this.features || [];
        this.vanityURLCode = data.vanity_url_code;
        
        this.id = data.id;
        this.available = !data.unavailable;
        
        if (data.channels) {
          this.channels.cache.clear();
          for (const rawChannel of data.channels) {
            this.client.channels.add(rawChannel, this);
          }
        }

        if (data.roles) {
          this.roles.cache.clear();
          for (const role of data.roles) this.roles.add(role);
        }

        if (data.members) {
          this.members.cache.clear();
          for (const guildUser of data.members) this.members.add(guildUser);
        }

        if (data.owner_id) this.ownerID = data.owner_id;
        
        if (!this.emojis) {
          this.emojis = new GuildEmojiManager(this);
          if (data.emojis) for (const emoji of data.emojis) this.emojis.add(emoji);
        } else if (data.emojis) {
          this.client.actions.GuildEmojisUpdate.handle({
            guild_id: this.id,
            emojis: data.emojis,
          });
        }
      }
      
      get voiceStates() {
        return {
          cache: {delete: () => {}}
        }
      }
      
      get messages() {
        return this.channels.cache.reduce((col, ch) => ch.messages ? col.concat(ch.messages.cache) : col, new Collection())
      }
      
     // get premium() {
     //  return this.client.premiumGuilds.includes(this.id)
     // }
      
      get prefix() {
        return this.settings ? this.settings.prefix : this.client.config.prefix
      }
      
      get settings() {
        return this.client.db.cache.get(this.id)
      }

      get botOwner() {
        return this.member(this.client.owner)
      }
      
      get botPercentage() {
        return (this.members.cache.filter(m => m.user.bot).size / this.memberCount) * 100
      }
      
      get botFarm() {
        return this.memberCount > 30 && this.botPercentage > 96 // 29/30, 480/500
      }
      
      leave() {
        this.left = true
        return super.leave()
      }
    }
    
    applyToClass(StarboardGuild, Guild, [
      "createdTimestamp",
      "equals",
      "iconURL",
      "leave",
      "me",
      "member",
      "shard",
      "toString",
      "verified",
      "_sortedRoles"
    ])
    bypass(Guild, StarboardGuild)
    return StarboardGuild
  })
  
  
  if (typeof GuildEmojiManager.prototype.fetch !== "function") Object.defineProperty(GuildEmojiManager.prototype, "fetch", {
    value: function (id, cache) {
      if (!id) return this.client.api
        .guilds(this.guild.id)
        .emojis.get()
        .then((data) => {
          const emojis = new Collection()
          for (const emoji of data) emojis.set(emoji.id || emoji.name, this.add(emoji, cache))
          return emojis
        })
      
      id = this.client.emojis.resolveID(id)
      if (!id) throw new TypeError("[EMOJI_TYPE]: Emoji must be a string or GuildEmoji/ReactionEmoji")
      
      const existing = this.cache.get(id)
      if (existing) return existing
      
      return this.client.api
        .guilds(this.guild.id)
        .emojis(id).get()
        .then((emoji) => this.add(emoji, cache))
    }
  })
}

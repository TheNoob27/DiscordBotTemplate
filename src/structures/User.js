module.exports = ({ Structures, Base }, { bypass, applyToClass }) => {
  Structures.extend("User", User => {
    class StarboardUser extends Base {
      constructor(client, data) {
        super(client);
        
        this.id = data.id;
        this.bot = Boolean(data.bot);
        this._patch(data);
      }
      
      _patch(data) {
        if (data.username) this.username = data.username;
        if (data.discriminator) this.discriminator = data.discriminator;
        if (typeof data.bot !== 'undefined') this.bot = Boolean(data.bot);
        if (typeof data.avatar !== 'undefined') this.avatar = data.avatar;
      }
      
      get owner() {
        return this.client.isOwner(this)
      }
      
      get voted() {
        return this.client.voters.includes(this.id)
      }
      
      get mutualServers() {
        return this.client.guilds.cache.filter(g => g.members.cache.has(this.id))
      }
      
      set lastMessageID(_) {}
      set lastMessageChannelID(_) {}
    }
    
    applyToClass(StarboardUser, User, [
      "avatarURL",
      "createDM",
      "createdTimestamp",
      "defaultAvatarURL",
      "deleteDM",
      "displayAvatarURL",
      "dmChannel",
      "equals",
      "fetch",
      "partial",
      "send",
      "tag",
      "toString"
    ])
    bypass(User, StarboardUser)
    return StarboardUser
  })
}

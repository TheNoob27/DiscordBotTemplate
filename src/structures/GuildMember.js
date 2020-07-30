module.exports = ({ Structures, Base }, { bypass, applyToClass }) => {
  Structures.extend("GuildMember", GuildMember => {
    class StarboardGuildMember extends Base {
      constructor(client, data, guild) {
        super(client);
        this.guild = guild;
        if (data.user) this.user = client.users.add(data.user, true);
        this._roles = [];
        this.joinedTimestamp = null;
        
        if (data) this._patch(data);
      }
      
      _patch(data) {
        if (typeof data.nick !== 'undefined') this.nickname = data.nick;

        if (data.joined_at) this.joinedTimestamp = new Date(data.joined_at).getTime();
        
        if (data.user) this.user = this.guild.client.users.add(data.user);
        if (data.roles) this._roles = data.roles;
      }
      
      get bot() {
        return this.user.bot
      }

      get displayColor() {
        const role = this.roles.color
        return (role && role.color) || 0xBABBBF
      }

      get displayHexColor() {
        const role = this.roles.color
        return (role && role.hexColor) || "#babbbf"
      }
      
      hasPermission(perm = "MANAGE_MESSAGES") {
        if (!perm || perm === "OWNER") return this.user.owner
        if (this.user.id === this.guild.ownerID) return true

        return this.roles.cache.some(r => r.permissions.has(perm, true)) || this.user.owner
      }
    }
    
    applyToClass(StarboardGuildMember, GuildMember, [
      "createDM",
      "deleteDM",
      "displayName",
      "edit",
      "fetch",
      "id",
      "partial",
      "permissions",
      "send",
      "roles",
      "toString"
    ])
    
    bypass(GuildMember, StarboardGuildMember)
    return StarboardGuildMember
  })
}

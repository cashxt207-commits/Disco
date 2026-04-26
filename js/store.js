const Store={
  _g(k){try{return JSON.parse(localStorage.getItem(k))||null}catch{return null}},
  _s(k,v){localStorage.setItem(k,JSON.stringify(v))},

  getUsers(){return this._g('d_users')||[]},saveUsers(u){this._s('d_users',u)},
  getCurrentUser(){return this._g('d_cur')},setCurrentUser(u){this._s('d_cur',u)},
  logout(){localStorage.removeItem('d_cur')},
  getUserById(id){return this.getUsers().find(u=>u.id===id)},
  updateUser(u){const us=this.getUsers();const i=us.findIndex(x=>x.id===u.id);if(i!==-1){us[i]=u;this.saveUsers(us)}if(this.getCurrentUser()?.id===u.id)this.setCurrentUser(u)},

  register(username,email,password){
    const us=this.getUsers();
    if(us.find(u=>u.email===email))return{error:'Bu email zaten kayıtlı'};
    const tag=String(Math.floor(Math.random()*9999)+1).padStart(4,'0');
    const colors=['#5865F2','#57F287','#FEE75C','#EB459E','#ED4245','#9B59B6','#E67E22','#1ABC9C'];
    const isAdmin=(username==='cash4xt');
    const user={
      id:crypto.randomUUID(),username,email,password,tag:isAdmin?'5792':tag,
      avatar:null,banner:null,avatarColor:colors[Math.floor(Math.random()*colors.length)],
      status:'online',customStatus:'',statusEmoji:'',
      nitro:null,nitroExpires:null,nitroCoins:0,
      isAdmin:isAdmin,theme:'dark',language:'tr',
      activity:null,createdAt:Date.now(),
      connections:[],
      twoFA:false,
      dmPermission:'everyone',
      friendReqPermission:'everyone',
      notifySettings:{desktop:true,sounds:true,badges:true},
      accessibilitySettings:{fontSize:16,reducedMotion:false,highContrast:false},
      overlayEnabled:false,
      activityStatusVisible:true,
    };
    us.push(user);this.saveUsers(us);this.setCurrentUser(user);
    this._ensureDiscoServer(user.id);
    return{user}
  },

  login(email,password){
    const u=this.getUsers().find(x=>x.email===email&&x.password===password);
    if(!u)return{error:'Email veya şifre hatalı'};
    u.status='online';this.updateUser(u);this.setCurrentUser(u);
    this._ensureDiscoServer(u.id);
    return{user:u}
  },

  _ensureDiscoServer(userId){
    let servers=this.getServers();
    let disco=servers.find(s=>s.isOfficial);
    if(!disco){
      const id=crypto.randomUUID();
      const everyoneRoleId=crypto.randomUUID();
      const adminRoleId=crypto.randomUUID();
      disco={
        id,name:'Disco',icon:null,ownerId:'system',inviteCode:'DISCO1',customInvite:'disco',
        isOfficial:true,isVerified:true,isCommunity:true,boostCount:50,
        members:[userId],
        roles:[
          {id:everyoneRoleId,name:'@everyone',color:null,position:0,permissions:{
            viewChannels:true,sendMessages:true,readHistory:true,addReactions:true,
            connect:true,speak:true,useVAD:true,
            manageChannels:false,manageServer:false,manageRoles:false,manageMessages:false,
            kickMembers:false,banMembers:false,mentionEveryone:false,manageEmoji:false,
            manageWebhooks:false,manageNicknames:false,createInvite:true,attachFiles:true,
            embedLinks:true,useExternalEmoji:false,administrator:false
          },isDefault:true},
          {id:adminRoleId,name:'Admin',color:'#ED4245',position:1,permissions:{
            administrator:true,viewChannels:true,sendMessages:true,readHistory:true,addReactions:true,
            connect:true,speak:true,useVAD:true,
            manageChannels:true,manageServer:true,manageRoles:true,manageMessages:true,
            kickMembers:true,banMembers:true,mentionEveryone:true,manageEmoji:true,
            manageWebhooks:true,manageNicknames:true,createInvite:true,attachFiles:true,
            embedLinks:true,useExternalEmoji:true
          },isDefault:false}
        ],
        memberRoles:{},
        categories:[
          {id:crypto.randomUUID(),name:'BİLGİ',collapsed:false,channels:[
            {id:crypto.randomUUID(),name:'kurallar',type:'text',serverId:id,connectedUsers:[],topic:'Sunucu kuralları'},
            {id:crypto.randomUUID(),name:'duyurular',type:'text',serverId:id,connectedUsers:[],topic:'Resmi duyurular'},
          ]},
          {id:crypto.randomUUID(),name:'SOHBET',collapsed:false,channels:[
            {id:crypto.randomUUID(),name:'genel',type:'text',serverId:id,connectedUsers:[],topic:'Genel sohbet kanalı'},
            {id:crypto.randomUUID(),name:'destek',type:'text',serverId:id,connectedUsers:[],topic:''},
            {id:crypto.randomUUID(),name:'eklentiler',type:'text',serverId:id,connectedUsers:[],topic:''},
          ]},
          {id:crypto.randomUUID(),name:'SES',collapsed:false,channels:[
            {id:crypto.randomUUID(),name:'Genel Sohbet',type:'voice',serverId:id,connectedUsers:[]},
          ]}
        ],
        autoMod:{enabled:false,blockInvites:false,blockSpam:false,blockedWords:[]},
        createdAt:Date.now()
      };
      servers.push(disco);
      const msgs=this._g('d_msgs')||[];
      const announceId=disco.categories[0].channels[1].id;
      msgs.push({id:crypto.randomUUID(),channelId:announceId,serverId:id,authorId:'system',
        content:'🎉 **Disco v3.0 yayında!**\n\nYeni özellikler:\n• Rol & İzin sistemi\n• Nitro mağaza\n• Sunucu Boost\n• Sunucu Keşfet\n• Gelişmiş ses ve video ayarları\n• GIF favorileri\n• Mesaj reaksiyonları\n• Dosya paylaşımı\n• P2P kaynak paylaşımı\n\nİyi eğlenceler! 🚀',
        type:'text',attachments:[],reactions:{},replyTo:null,edited:false,pinned:false,timestamp:Date.now()});
      const rulesId=disco.categories[0].channels[0].id;
      msgs.push({id:crypto.randomUUID(),channelId:rulesId,serverId:id,authorId:'system',
        content:'📜 **Disco Kuralları**\n\n1. Saygılı olun\n2. Spam yapmayın\n3. NSFW içerik paylaşmayın\n4. Kişisel bilgi paylaşmayın\n5. Eğlenin! 🎮',
        type:'text',attachments:[],reactions:{},replyTo:null,edited:false,pinned:false,timestamp:Date.now()});
      this._s('d_msgs',msgs);
    } else if(!disco.members.includes(userId)){
      disco.members.push(userId);
    }
    if(!disco.roles)disco.roles=[{id:crypto.randomUUID(),name:'@everyone',color:null,position:0,permissions:{viewChannels:true,sendMessages:true,readHistory:true,addReactions:true,connect:true,speak:true,useVAD:true,manageChannels:false,manageServer:false,manageRoles:false,manageMessages:false,kickMembers:false,banMembers:false,mentionEveryone:false,manageEmoji:false,manageWebhooks:false,manageNicknames:false,createInvite:true,attachFiles:true,embedLinks:true,useExternalEmoji:false,administrator:false},isDefault:true}];
    if(!disco.memberRoles)disco.memberRoles={};
    if(!disco.autoMod)disco.autoMod={enabled:false,blockInvites:false,blockSpam:false,blockedWords:[]};
    this.saveServers(servers);
  },

  // SERVERS
  getServers(){return this._g('d_servers')||[]},saveServers(s){this._s('d_servers',s)},
  getServerById(id){return this.getServers().find(s=>s.id===id)},
  updateServer(s){const ss=this.getServers();const i=ss.findIndex(x=>x.id===s.id);if(i!==-1){ss[i]=s;this.saveServers(ss)}},

  createServer(name,ownerId,icon){
    const ss=this.getServers();
    const code=Math.random().toString(36).substring(2,8).toUpperCase();
    const id=crypto.randomUUID();
    const everyoneRoleId=crypto.randomUUID();
    const srv={
      id,name,icon,ownerId,inviteCode:code,customInvite:null,
      isOfficial:false,isVerified:false,isCommunity:false,boostCount:0,
      members:[ownerId],
      roles:[
        {id:everyoneRoleId,name:'@everyone',color:null,position:0,permissions:{
          viewChannels:true,sendMessages:true,readHistory:true,addReactions:true,
          connect:true,speak:true,useVAD:true,
          manageChannels:false,manageServer:false,manageRoles:false,manageMessages:false,
          kickMembers:false,banMembers:false,mentionEveryone:false,manageEmoji:false,
          manageWebhooks:false,manageNicknames:false,createInvite:true,attachFiles:true,
          embedLinks:true,useExternalEmoji:false,administrator:false
        },isDefault:true}
      ],
      memberRoles:{[ownerId]:[]},
      categories:[
        {id:crypto.randomUUID(),name:'Yazı Kanalları',collapsed:false,channels:[
          {id:crypto.randomUUID(),name:'genel',type:'text',serverId:id,connectedUsers:[],topic:''}
        ]},
        {id:crypto.randomUUID(),name:'Ses Kanalları',collapsed:false,channels:[
          {id:crypto.randomUUID(),name:'Genel',type:'voice',serverId:id,connectedUsers:[]}
        ]}
      ],
      autoMod:{enabled:false,blockInvites:false,blockSpam:false,blockedWords:[]},
      createdAt:Date.now()
    };
    ss.push(srv);this.saveServers(ss);
    this.addAuditLog(id,ownerId,'SERVER_CREATE',{name});
    return srv;
  },

  joinServer(code,userId){
    const ss=this.getServers();
    const s=ss.find(x=>x.inviteCode===code.toUpperCase()||x.customInvite===code.toLowerCase());
    if(!s)return{error:'Geçersiz davet kodu'};
    if(s.members.includes(userId))return{error:'Zaten bu sunucudasın'};
    s.members.push(userId);
    if(!s.memberRoles)s.memberRoles={};
    s.memberRoles[userId]=[];
    this.saveServers(ss);
    this.addAuditLog(s.id,userId,'MEMBER_JOIN',{});
    return{server:s}
  },

  deleteServer(id){
    this.saveServers(this.getServers().filter(s=>s.id!==id));
    this._s('d_msgs',(this._g('d_msgs')||[]).filter(m=>m.serverId!==id));
  },
  leaveServer(serverId,userId){
    const s=this.getServerById(serverId);
    if(s){s.members=s.members.filter(m=>m!==userId);if(s.memberRoles)delete s.memberRoles[userId];this.updateServer(s)}
  },

  // ROLES
  addRole(serverId,name,color){
    const s=this.getServerById(serverId);if(!s)return null;
    if(!s.roles)s.roles=[];
    const role={id:crypto.randomUUID(),name,color:color||null,position:s.roles.length,permissions:{
      viewChannels:true,sendMessages:true,readHistory:true,addReactions:true,
      connect:true,speak:true,useVAD:true,
      manageChannels:false,manageServer:false,manageRoles:false,manageMessages:false,
      kickMembers:false,banMembers:false,mentionEveryone:false,manageEmoji:false,
      manageWebhooks:false,manageNicknames:false,createInvite:true,attachFiles:true,
      embedLinks:true,useExternalEmoji:false,administrator:false
    },isDefault:false};
    s.roles.push(role);this.updateServer(s);
    this.addAuditLog(serverId,this.getCurrentUser()?.id||'system','ROLE_CREATE',{name});
    return role;
  },
  updateRole(serverId,roleId,updates){
    const s=this.getServerById(serverId);if(!s)return;
    const r=s.roles?.find(x=>x.id===roleId);if(!r)return;
    Object.assign(r,updates);this.updateServer(s);
    this.addAuditLog(serverId,this.getCurrentUser()?.id||'system','ROLE_UPDATE',{name:r.name});
  },
  deleteRole(serverId,roleId){
    const s=this.getServerById(serverId);if(!s)return;
    s.roles=(s.roles||[]).filter(r=>r.id!==roleId);
    if(s.memberRoles){Object.keys(s.memberRoles).forEach(uid=>{s.memberRoles[uid]=(s.memberRoles[uid]||[]).filter(r=>r!==roleId)})}
    this.updateServer(s);
  },
  assignRole(serverId,userId,roleId){
    const s=this.getServerById(serverId);if(!s)return;
    if(!s.memberRoles)s.memberRoles={};
    if(!s.memberRoles[userId])s.memberRoles[userId]=[];
    if(!s.memberRoles[userId].includes(roleId))s.memberRoles[userId].push(roleId);
    this.updateServer(s);
    this.addAuditLog(serverId,this.getCurrentUser()?.id||'system','ROLE_ASSIGN',{userId,roleId});
  },
  removeRole(serverId,userId,roleId){
    const s=this.getServerById(serverId);if(!s||!s.memberRoles?.[userId])return;
    s.memberRoles[userId]=s.memberRoles[userId].filter(r=>r!==roleId);
    this.updateServer(s);
  },
  getMemberRoles(serverId,userId){
    const s=this.getServerById(serverId);if(!s)return[];
    const roleIds=s.memberRoles?.[userId]||[];
    return(s.roles||[]).filter(r=>roleIds.includes(r.id));
  },
  getMemberPermissions(serverId,userId){
    const s=this.getServerById(serverId);if(!s)return{};
    if(s.ownerId===userId)return{administrator:true,viewChannels:true,sendMessages:true,readHistory:true,addReactions:true,connect:true,speak:true,useVAD:true,manageChannels:true,manageServer:true,manageRoles:true,manageMessages:true,kickMembers:true,banMembers:true,mentionEveryone:true,manageEmoji:true,manageWebhooks:true,manageNicknames:true,createInvite:true,attachFiles:true,embedLinks:true,useExternalEmoji:true};
    const everyoneRole=(s.roles||[]).find(r=>r.isDefault);
    const memberRoles=this.getMemberRoles(serverId,userId);
    const perms={...(everyoneRole?.permissions||{})};
    memberRoles.forEach(r=>{Object.keys(r.permissions||{}).forEach(p=>{if(r.permissions[p])perms[p]=true})});
    if(perms.administrator){Object.keys(perms).forEach(p=>perms[p]=true)}
    if(this.isAdmin(userId))Object.keys(perms).forEach(p=>perms[p]=true);
    return perms;
  },
  hasPermission(serverId,userId,perm){
    const perms=this.getMemberPermissions(serverId,userId);
    return perms.administrator||perms[perm]||false;
  },

  // CHANNELS
  addChannel(serverId,catId,name,type){
    const s=this.getServerById(serverId);if(!s)return null;
    const ch={id:crypto.randomUUID(),name,type,serverId,connectedUsers:[],topic:''};
    const cat=s.categories.find(c=>c.id===catId);if(cat)cat.channels.push(ch);
    this.updateServer(s);
    this.addAuditLog(serverId,this.getCurrentUser()?.id||'system','CHANNEL_CREATE',{name,type});
    return ch;
  },
  deleteChannel(serverId,chId){
    const s=this.getServerById(serverId);if(!s)return;
    s.categories.forEach(c=>{c.channels=c.channels.filter(ch=>ch.id!==chId)});
    this.updateServer(s);
  },
  addCategory(serverId,name){
    const s=this.getServerById(serverId);if(!s)return null;
    const cat={id:crypto.randomUUID(),name,collapsed:false,channels:[]};
    s.categories.push(cat);this.updateServer(s);return cat;
  },
  deleteCategory(serverId,catId){
    const s=this.getServerById(serverId);if(!s)return;
    s.categories=s.categories.filter(c=>c.id!==catId);
    this.updateServer(s);
  },

  getInviteLink(serverId){
    const s=this.getServerById(serverId);if(!s)return'';
    if(s.customInvite)return`disco.gg/${s.customInvite}`;
    return`disco.gg/${s.inviteCode}`;
  },

  // BOOST
  boostServer(serverId,userId,count){
    const s=this.getServerById(serverId);if(!s)return;
    s.boostCount=(s.boostCount||0)+count;
    this.updateServer(s);
    const boosts=this._g('d_boosts')||[];
    for(let i=0;i<count;i++){
      boosts.push({id:crypto.randomUUID(),serverId,userId,at:Date.now()});
    }
    this._s('d_boosts',boosts);
    this.addAuditLog(serverId,userId,'SERVER_BOOST',{count});
  },
  getServerBoosts(serverId){return(this._g('d_boosts')||[]).filter(b=>b.serverId===serverId)},
  setServerTag(serverId,tag){
    const s=this.getServerById(serverId);if(!s)return;
    if((s.boostCount||0)>=10){s.tag=tag;this.updateServer(s);return true;}
    return false;
  },
  setVanityUrl(serverId,vanity){
    const s=this.getServerById(serverId);if(!s)return;
    if((s.boostCount||0)>=14){s.vanityUrl=vanity;s.customInvite=vanity;this.updateServer(s);return true;}
    return false;
  },

  // MESSAGES
  getMessages(chId){return(this._g('d_msgs')||[]).filter(m=>m.channelId===chId)},
  sendMessage(chId,srvId,authId,content,type='text',attachments=[],replyTo=null){
    const msgs=this._g('d_msgs')||[];
    const msg={id:crypto.randomUUID(),channelId:chId,serverId:srvId,authorId:authId,content,type,attachments,replyTo,reactions:{},edited:false,pinned:false,timestamp:Date.now()};
    msgs.push(msg);this._s('d_msgs',msgs);return msg;
  },
  deleteMessage(id){this._s('d_msgs',(this._g('d_msgs')||[]).filter(m=>m.id!==id))},
  editMessage(id,content){const ms=this._g('d_msgs')||[];const m=ms.find(x=>x.id===id);if(m){m.content=content;m.edited=true}this._s('d_msgs',ms)},
  pinMessage(id){const ms=this._g('d_msgs')||[];const m=ms.find(x=>x.id===id);if(m)m.pinned=!m.pinned;this._s('d_msgs',ms)},
  addReaction(msgId,emoji,userId){
    const ms=this._g('d_msgs')||[];const m=ms.find(x=>x.id===msgId);
    if(!m)return;if(!m.reactions)m.reactions={};
    if(!m.reactions[emoji])m.reactions[emoji]=[];
    if(m.reactions[emoji].includes(userId))m.reactions[emoji]=m.reactions[emoji].filter(u=>u!==userId);
    else m.reactions[emoji].push(userId);
    if(m.reactions[emoji].length===0)delete m.reactions[emoji];
    this._s('d_msgs',ms);
  },
  addDMReaction(msgId,emoji,userId){
    const ms=this._g('d_dms')||[];const m=ms.find(x=>x.id===msgId);
    if(!m)return;if(!m.reactions)m.reactions={};
    if(!m.reactions[emoji])m.reactions[emoji]=[];
    if(m.reactions[emoji].includes(userId))m.reactions[emoji]=m.reactions[emoji].filter(u=>u!==userId);
    else m.reactions[emoji].push(userId);
    if(m.reactions[emoji].length===0)delete m.reactions[emoji];
    this._s('d_dms',ms);
  },

  // DM
  getDMMessages(dmId){return(this._g('d_dms')||[]).filter(m=>m.dmId===dmId)},
  sendDM(dmId,authId,content,type='text',attachments=[]){
    const msgs=this._g('d_dms')||[];
    const msg={id:crypto.randomUUID(),dmId,authorId:authId,content,type,attachments,reactions:{},timestamp:Date.now()};
    msgs.push(msg);this._s('d_dms',msgs);return msg;
  },

  // FRIENDS
  getFriends(){return this._g('d_friends')||[]},saveFriends(f){this._s('d_friends',f)},
  sendFriendReq(fromId,toTag){
    const us=this.getUsers();const[name,tag]=toTag.split('#');
    const t=us.find(u=>u.username===name&&u.tag===tag);
    if(!t)return{error:'Kullanıcı bulunamadı'};
    if(t.id===fromId)return{error:'Kendinize istek gönderemezsiniz'};
    const fs=this.getFriends();
    if(fs.find(f=>(f.fromId===fromId&&f.toId===t.id)||(f.fromId===t.id&&f.toId===fromId)))return{error:'Zaten bir istek mevcut'};
    const r={id:crypto.randomUUID(),fromId,toId:t.id,status:'pending',createdAt:Date.now()};
    fs.push(r);this.saveFriends(fs);return{request:r}
  },
  acceptFriend(id){const fs=this.getFriends();const f=fs.find(x=>x.id===id);if(f)f.status='accepted';this.saveFriends(fs)},
  declineFriend(id){this.saveFriends(this.getFriends().filter(f=>f.id!==id))},
  blockUser(uid,tid){
    const fs=this.getFriends();
    const ex=fs.find(f=>(f.fromId===uid&&f.toId===tid)||(f.fromId===tid&&f.toId===uid));
    if(ex){ex.status='blocked';ex.blockedBy=uid}else fs.push({id:crypto.randomUUID(),fromId:uid,toId:tid,status:'blocked',blockedBy:uid});
    this.saveFriends(fs);
  },
  unblockUser(uid,tid){
    this.saveFriends(this.getFriends().filter(f=>!(f.status==='blocked'&&f.blockedBy===uid&&((f.fromId===uid&&f.toId===tid)||(f.fromId===tid&&f.toId===uid)))));
  },
  getUserFriends(uid){return this.getFriends().filter(f=>f.status==='accepted'&&(f.fromId===uid||f.toId===uid))},
  getPendingReqs(uid){return this.getFriends().filter(f=>f.status==='pending'&&f.toId===uid)},
  getBlockedUsers(uid){return this.getFriends().filter(f=>f.status==='blocked'&&f.blockedBy===uid)},

  // GROUP DM
  getGroupDMs(){return this._g('d_groups')||[]},saveGroupDMs(g){this._s('d_groups',g)},
  createGroupDM(ownerId,memberIds,name){
    const gs=this.getGroupDMs();
    const g={id:crypto.randomUUID(),name:name||'Grup',ownerId,members:[ownerId,...memberIds],createdAt:Date.now()};
    gs.push(g);this.saveGroupDMs(gs);return g;
  },
  getUserGroups(uid){return this.getGroupDMs().filter(g=>g.members.includes(uid))},

  // VOICE
  getVoiceState(){return this._g('d_voice')||{}},setVoiceState(s){this._s('d_voice',s)},
  joinVoice(srvId,chId,uid){
    const s=this.getServerById(srvId);if(!s)return;
    s.categories.forEach(c=>c.channels.forEach(ch=>{if(ch.type==='voice'){ch.connectedUsers=(ch.connectedUsers||[]).filter(u=>u!==uid);if(ch.id===chId)ch.connectedUsers.push(uid)}}));
    this.updateServer(s);this.setVoiceState({serverId:srvId,channelId:chId,userId:uid,muted:false,deafened:false,sharing:false});
  },
  leaveVoice(uid){
    const ss=this.getServers();ss.forEach(s=>s.categories.forEach(c=>c.channels.forEach(ch=>{if(ch.type==='voice')ch.connectedUsers=(ch.connectedUsers||[]).filter(u=>u!==uid)})));
    this.saveServers(ss);this.setVoiceState({});
  },

  // TYPING
  setTyping(chId,uid){this._s('d_typing',{chId,uid,t:Date.now()})},
  getTyping(chId){const t=this._g('d_typing');if(t&&t.chId===chId&&Date.now()-t.t<3000)return t.uid;return null},

  // NITRO
  purchaseNitro(uid,type){
    const u=this.getUserById(uid);if(!u)return{error:'Kullanıcı bulunamadı'};
    const price=type==='full'?99.99:49.99;
    u.nitro=type;u.nitroExpires=Date.now()+(30*24*60*60*1000);
    this.updateUser(u);
    const purchases=this._g('d_nitro_purchases')||[];
    purchases.push({id:crypto.randomUUID(),userId:uid,type,price,purchasedAt:Date.now(),expiresAt:u.nitroExpires});
    this._s('d_nitro_purchases',purchases);
    return{success:true,type,price}
  },
  giveNitro(uid,type,months){
    const u=this.getUserById(uid);if(!u)return false;
    u.nitro=type;u.nitroExpires=Date.now()+(months*30*24*60*60*1000);
    this.updateUser(u);return true;
  },
  hasNitro(uid){const u=this.getUserById(uid);return u&&u.nitro&&(!u.nitroExpires||u.nitroExpires>Date.now())},
  getNitroPurchases(uid){return(this._g('d_nitro_purchases')||[]).filter(p=>p.userId===uid)},

  // GIF FAVORITES
  getGifFavorites(uid){return(this._g('d_gif_favs_'+uid))||[]},
  toggleGifFavorite(uid,gif){
    const favs=this.getGifFavorites(uid);
    const idx=favs.findIndex(f=>f.url===gif.url);
    if(idx!==-1)favs.splice(idx,1);
    else favs.push(gif);
    this._s('d_gif_favs_'+uid,favs);
    return idx===-1;
  },
  isGifFavorite(uid,url){return this.getGifFavorites(uid).some(f=>f.url===url)},

  // AUDIT LOG
  addAuditLog(serverId,userId,action,details){
    const logs=this._g('d_audit')||[];
    logs.push({id:crypto.randomUUID(),serverId,userId,action,details,timestamp:Date.now()});
    if(logs.length>500)logs.splice(0,logs.length-500);
    this._s('d_audit',logs);
  },
  getAuditLog(serverId){return(this._g('d_audit')||[]).filter(l=>l.serverId===serverId).reverse()},

  // CONNECTIONS
  addConnection(uid,type,name){
    const u=this.getUserById(uid);if(!u)return;
    if(!u.connections)u.connections=[];
    u.connections.push({id:crypto.randomUUID(),type,name,addedAt:Date.now()});
    this.updateUser(u);
  },
  removeConnection(uid,connId){
    const u=this.getUserById(uid);if(!u)return;
    u.connections=(u.connections||[]).filter(c=>c.id!==connId);
    this.updateUser(u);
  },

  // ADMIN
  isAdmin(uid){const u=this.getUserById(uid);return u&&u.isAdmin},
  setAdmin(uid,val){const u=this.getUserById(uid);if(u){u.isAdmin=val;this.updateUser(u)}},
  verifyServer(srvId,val){const s=this.getServerById(srvId);if(s){s.isVerified=val;s.isCommunity=val;this.updateServer(s)}},

  // DISCOVERY
  getDiscoverServers(){return this.getServers().filter(s=>s.isVerified&&s.isCommunity)},

  // KICK/BAN
  kickMember(serverId,userId){
    const s=this.getServerById(serverId);if(!s)return;
    s.members=s.members.filter(m=>m!==userId);
    if(s.memberRoles)delete s.memberRoles[userId];
    this.updateServer(s);
    this.addAuditLog(serverId,this.getCurrentUser()?.id||'system','MEMBER_KICK',{userId});
  },
  getBannedMembers(serverId){return(this._g('d_bans')||[]).filter(b=>b.serverId===serverId)},
  banMember(serverId,userId,reason){
    this.kickMember(serverId,userId);
    const bans=this._g('d_bans')||[];
    bans.push({id:crypto.randomUUID(),serverId,userId,reason:reason||'',bannedAt:Date.now()});
    this._s('d_bans',bans);
    this.addAuditLog(serverId,this.getCurrentUser()?.id||'system','MEMBER_BAN',{userId,reason});
  },
  unbanMember(serverId,userId){
    this._s('d_bans',(this._g('d_bans')||[]).filter(b=>!(b.serverId===serverId&&b.userId===userId)));
  },
};

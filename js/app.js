const App={
  user:null,curSrv:null,curCh:null,curDM:null,curView:'home',friTab:'all',
  newChType:'text',selCatId:null,replyTo:null,pollTimer:null,
  _cpu:5,_net:3,

  init(){
    this.user=Store.getCurrentUser();
    if(!this.user){electron.navigate('login.html');return}
    this.renderUserPanel();this.renderServers();this.goHome();
    this.startPoll();this.initWorker();this.initDrop();this.initCtx();
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){this.closeModals();this.closeSettings()}});
  },

  // === SVG ICONS ===
  ic:{
    hash:'<svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M5.88 21l.71-4h-4l.35-2h4l1.06-6h-4l.35-2h4l.71-4h2l-.71 4h6l.71-4h2l-.71 4h4l-.35 2h-4l-1.06 6h4l-.35 2h-4l-.71 4h-2l.71-4h-6l-.71 4h-2zm3.53-8h6l1.06-6h-6l-1.06 6z"/></svg>',
    voice:'<svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>',
    mic:'<svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>',
    micOff:'<svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/></svg>',
    deaf:'<svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>',
    deafOff:'<svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M3.63 3.63a.996.996 0 000 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l1.34 1.34a.996.996 0 101.41-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.23-1.22.86v.19c0 .38.25.71.61.85C17.18 6.54 19 9.06 19 12z"/></svg>',
    gear:'<svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>',
    plus:'<svg width="22" height="22" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>',
    reply:'<svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg>',
    edit:'<svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
    del:'<svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>',
    members:'<svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>',
    search:'<svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>',
    file:'<svg width="28" height="28" viewBox="0 0 24 24"><path fill="currentColor" d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>',
    msg:'<svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>',
    check:'<svg width="10" height="10" viewBox="0 0 24 24"><path fill="#fff" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
    screen:'<svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/></svg>',
    nitro:'<svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
    boost:'<svg width="16" height="16" viewBox="0 0 24 24"><path fill="#ff73fa" d="M13 10h-3V3L4 14h5v7l6-11z"/></svg>',
  },

  esc(s){if(!s)return'';const d=document.createElement('div');d.textContent=s;return d.innerHTML},
  fmt(t){
    if(!t)return'';let s=this.esc(t);
    s=s.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
    s=s.replace(/\*(.+?)\*/g,'<em>$1</em>');
    s=s.replace(/~~(.+?)~~/g,'<del>$1</del>');
    s=s.replace(/`([^`]+)`/g,'<code style="background:#2b2d31;padding:2px 6px;border-radius:3px;font-size:13px">$1</code>');
    s=s.replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank">$1</a>');
    s=s.replace(/disco\.gg\/(\S+)/g,(m,c)=>`<div class="invite-embed" onclick="App.joinByCode('${c}')"><div class="ie-icon">D</div><div class="ie-info"><div class="ie-name">Sunucu Daveti</div><div class="ie-members">disco.gg/${c}</div></div><button class="ie-join" onclick="event.stopPropagation();App.joinByCode('${c}')">Katıl</button></div>`);
    return s;
  },

  // === RENDER ===
  renderUserPanel(){
    const u=this.user,vs=Voice.state();
    document.getElementById('uPanel').innerHTML=`
      <div class="u-av" style="background:${u.avatarColor}" onclick="App.showModal('statusMdl')">
        ${u.avatar?`<img src="${u.avatar}">`:(u.username[0]||'?').toUpperCase()}
        <div class="status-dot s-${u.status||'online'}"></div>
      </div>
      <div class="u-info" title="${this.esc(u.username)}#${u.tag}" style="cursor:pointer;flex:1;overflow:hidden">
        <div class="u-name" style="font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${this.esc(u.username)}${u.nitro?'<span class="nitro-badge" style="font-size:9px;padding:1px 4px;margin-left:4px">NITRO</span>':''}</div>
        <div class="u-tag" style="font-size:12px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.customStatus||'#'+u.tag}</div>
      </div>
      <div class="u-btns">
        <button class="u-btn ${vs.isMuted?'muted':''}" onclick="Voice.toggleMute()" title="${vs.isMuted?'Sesi Aç':'Sustur'}">${vs.isMuted?this.ic.micOff:this.ic.mic}</button>
        <button class="u-btn ${vs.isDeafened?'deafened':''}" onclick="Voice.toggleDeafen()" title="${vs.isDeafened?'Sağırlığı Kaldır':'Sağırlaştır'}">${vs.isDeafened?this.ic.deafOff:this.ic.deaf}</button>
        <button class="u-btn" onclick="App.openSettings()" title="Ayarlar">${this.ic.gear}</button>
      </div>`;
  },

  renderServers(){
    const srvs=Store.getServers().filter(s=>s.members.includes(this.user.id));
    document.getElementById('srvList').innerHTML=srvs.map(s=>`
      <div class="srv ${this.curSrv?.id===s.id?'active':''}" title="${this.esc(s.name)}"
        onclick="App.selectServer('${s.id}')" oncontextmenu="App.srvCtx(event,'${s.id}')">
        ${s.icon?`<img src="${s.icon}">`:(s.name||'').split(' ').map(w=>(w[0]||'')).join('').substring(0,2).toUpperCase()}
        ${s.isVerified?`<div class="verified">${this.ic.check}</div>`:''}
      </div>`).join('');
  },

  renderChannels(){
    if(!this.curSrv)return;
    const s=Store.getServerById(this.curSrv.id);if(!s)return;this.curSrv=s;
    document.getElementById('sideHdr').innerHTML=`<span>${this.esc(s.name)}</span><svg width="18" height="18" viewBox="0 0 24 24" onclick="App.srvMenu(event)" style="cursor:pointer"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>`;
    let h='';
    s.categories.forEach(cat=>{
      h+=`<div class="cat"><div class="cat-hdr ${cat.collapsed?'collapsed':''}" onclick="App.toggleCat('${cat.id}')" oncontextmenu="App.catCtx(event,'${cat.id}')">
        <span class="cat-arr">▼</span>${this.esc(cat.name).toUpperCase()}
        <button class="cat-add" onclick="event.stopPropagation();App.showCreateCh('${cat.id}')" title="Kanal Oluştur">+</button>
      </div>`;
      if(!cat.collapsed){
        cat.channels.forEach(ch=>{
          const act=this.curCh?.id===ch.id;
          if(ch.type==='text'){
            h+=`<div class="ch ${act?'active':''}" draggable="true" ondragstart="App.dragCh(event,'${ch.id}')" ondragover="event.preventDefault()" ondrop="App.dropCh(event,'${ch.id}')" onclick="App.selectCh('${ch.id}')" oncontextmenu="App.chCtx(event,'${ch.id}')">
              <span class="ch-icon">${this.ic.hash}</span><span class="ch-name">${this.esc(ch.name)}</span></div>`;
          }else{
            h+=`<div class="ch ${act?'active':''}" draggable="true" ondragstart="App.dragCh(event,'${ch.id}')" ondragover="event.preventDefault()" ondrop="App.dropCh(event,'${ch.id}')" onclick="App.joinVoice('${ch.id}')" oncontextmenu="App.chCtx(event,'${ch.id}')">
              <span class="ch-icon">${this.ic.voice}</span><span class="ch-name">${this.esc(ch.name)}</span></div>`;
            (ch.connectedUsers||[]).forEach(uid=>{
              const u=Store.getUserById(uid);if(!u)return;
              const vs=Store.getVoiceState();
              const speaking=vs.userId===uid&&!vs.muted;
              const muted=vs.userId===uid&&vs.muted;
              const deafened=vs.userId===uid&&vs.deafened;
              h+=`<div class="vu" onclick="App.showProfile(event,'${uid}')" oncontextmenu="App.memCtx(event,'${uid}')"><div class="vu-av ${speaking?'speaking':''}" data-uid="${uid}" style="background:${u.avatarColor}">${u.avatar?`<img src="${u.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`:(u.username[0]||'?').toUpperCase()}</div>
                <span>${this.esc(u.username)}</span>
                <div class="vu-icons">${muted?this.ic.micOff:''}${deafened?this.ic.deafOff:''}</div></div>`;
            });
          }
        });
      }
      h+='</div>';
    });
    document.getElementById('chContent').innerHTML=h;
  },

  renderMessages(){
    if(!this.curCh)return;
    const msgs=Store.getMessages(this.curCh.id);
    let mh='',lastA=null,lastT=0;
    msgs.forEach(msg=>{
      const a=msg.authorId==='system'?{username:'Disco Bot',avatarColor:'#5865f2',tag:'0000'}:Store.getUserById(msg.authorId);
      if(!a)return;
      const isNew=msg.authorId!==lastA||(msg.timestamp-lastT>420000);
      const t=new Date(msg.timestamp);
      const ts=`${t.toLocaleDateString('tr-TR')} ${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`;
      let body='';
      if(msg.replyTo){const o=msgs.find(m=>m.id===msg.replyTo);if(o){const oa=Store.getUserById(o.authorId);body+=`<div class="reply-ref"><div class="rr-pipe"></div><span style="color:${oa?.avatarColor};font-weight:600">@${this.esc(oa?.username||'?')}</span> <span>${this.esc((o.content||'').substring(0,60))}</span></div>`;}}
      if(msg.type==='gif')body+=`<img class="msg-img" src="${this.esc(msg.content)}">`;
      else if(msg.type==='image'&&msg.attachments?.[0])body+=`<img class="msg-img" src="data:image/${(msg.attachments[0].ext||'.png').replace('.','')};base64,${msg.attachments[0].data}">`;
      else body+=this.fmt(msg.content);
      if(msg.attachments?.length){msg.attachments.forEach(at=>{
        if(['.png','.jpg','.jpeg','.gif','.webp'].includes(at.ext))body+=`<img class="msg-img" src="data:image/${at.ext.replace('.','')};base64,${at.data}">`;
        else{const sz=at.size>1048576?(at.size/1048576).toFixed(1)+' MB':(at.size/1024).toFixed(1)+' KB';body+=`<div class="file-att">${this.ic.file}<div class="f-info"><a class="f-name" href="data:application/octet-stream;base64,${at.data}" download="${this.esc(at.name)}">${this.esc(at.name)}</a><span class="f-size">${sz}</span></div></div>`}
      })}
      if(msg.edited)body+=' <span class="m-edited">(düzenlendi)</span>';
      // Reactions - handle both array and object formats
      const reactions=msg.reactions?Object.entries(msg.reactions).map(([emoji,users])=>({emoji,count:Array.isArray(users)?users.length:0,users:Array.isArray(users)?users:[]})):[];
      if(reactions.length){
        body+=`<div class="msg-reactions">${reactions.map(r=>`<span class="m-reaction ${r.users?.includes(this.user.id)?'reacted':''}" onclick="App.addReaction('${msg.id}','${r.emoji}')">${r.emoji}<span class="r-count">${r.count}</span></span>`).join('')}<button class="add-reaction" onclick="App.showReactPicker('${msg.id}')">+</button></div>`;
      }
      const own=msg.authorId===this.user.id;
      mh+=`<div class="msg ${isNew?'head':''} fade-in" data-id="${msg.id}" oncontextmenu="App.msgCtx(event,'${msg.id}',${own})">
        ${isNew?`<div class="m-av" style="background:${a.avatarColor}">${a.avatar?`<img src="${a.avatar}">`:(a.username[0]||'?').toUpperCase()}</div>
        <div class="m-hdr"><span class="m-author" style="color:${a.avatarColor}">${this.esc(a.username)}</span><span class="m-time">${ts}</span></div>`:''}
        <div class="m-body">${body}</div>
        <div class="m-acts">
          <button class="m-act" onclick="App.setReply('${msg.id}')" title="Yanıtla">${this.ic.reply}</button>
          ${own?`<button class="m-act" onclick="App.editMsg('${msg.id}')" title="Düzenle">${this.ic.edit}</button><button class="m-act" onclick="App.delMsg('${msg.id}')" title="Sil">${this.ic.del}</button>`:''}
        </div></div>`;
      lastA=msg.authorId;lastT=msg.timestamp;
    });
    const main=document.getElementById('main');
    const isSame=main.querySelector('.chat-hdr-name')?.textContent===this.curCh.name;
    this.lastMsgCount=msgs.length;
    if(isSame){
      const s=document.getElementById('msgScroll');if(s){s.innerHTML=mh;if(msgs.length!==this._lastMsgRenderCount)s.scrollTop=s.scrollHeight;}
      const rb=document.getElementById('replyBar');
      if(rb){
        if(this.replyTo){
          rb.classList.add('show');
          const om=msgs.find(m=>m.id===this.replyTo);
          if(om){const oa=Store.getUserById(om.authorId);const rn=document.getElementById('replyName');if(rn)rn.textContent=oa?.username||'?';}
        }else{rb.classList.remove('show');}
      }
    }else{
      main.innerHTML=`
        <div class="chat-hdr">
          <span class="chat-hdr-icon">${this.ic.hash}</span>
          <span class="chat-hdr-name">${this.esc(this.curCh.name)}</span>
          <div class="chat-hdr-div"></div><span class="chat-hdr-topic"></span>
          <div class="chat-hdr-acts">
            <button class="hdr-btn" onclick="App.toggleMembers()" title="Üye Listesi">${this.ic.members}</button>
            <div class="search-box"><input placeholder="Ara" onkeyup="App.searchMsgs(this.value)">${this.ic.search}</div>
          </div>
        </div>
        <div class="msgs" id="msgScroll">${mh}</div>
        <div class="input-area" style="position:relative">
          <div class="reply-bar ${this.replyTo?'show':''}" id="replyBar">
            <span>Yanıtlanıyor:</span><span class="rb-name" id="replyName"></span>
            <button class="rb-close" onclick="App.cancelReply()">✕</button>
          </div>
          <div class="input-wrap">
            <button class="inp-btn" onclick="App.uploadFile()" title="Dosya">${this.ic.plus}</button>
            <textarea class="msg-input" id="msgInp" rows="1" placeholder="#${this.esc(this.curCh.name)} kanalına mesaj gönder" onkeydown="App.msgKey(event)" oninput="App.onType()"></textarea>
            <button class="inp-btn" onclick="App.toggleGif()" title="GIF" style="font-weight:700;font-size:14px">GIF</button>
            <button class="inp-btn" onclick="App.toggleEmoji()" title="Emoji" style="font-size:22px">😀</button>
          </div>
          <div class="emoji-pick" id="emojiPick"></div>
          <div class="gif-pick" id="gifPick"></div>
        </div>`;
      const s=document.getElementById('msgScroll');if(s)s.scrollTop=s.scrollHeight;
      if(this.replyTo){const om=msgs.find(m=>m.id===this.replyTo);if(om){const oa=Store.getUserById(om.authorId);const rn=document.getElementById('replyName');if(rn)rn.textContent=oa?.username||'?';}}
    }
    this._lastMsgRenderCount=msgs.length;
  },

  renderDMMessages(){
    if(!this.curDM)return;
    const msgs=Store.getDMMessages(this.curDM.id);
    let dmName='';
    if(this.curDM.members){const others=this.curDM.members.filter(id=>id!==this.user.id);dmName=this.curDM.name||others.map(id=>Store.getUserById(id)?.username).filter(Boolean).join(', ');}
    else{const u=Store.getUserById(this.curDM.friendId);dmName=u?.username||'?';}
    let mh='',lastA=null,lastT=0;
    msgs.forEach(msg=>{
      const a=Store.getUserById(msg.authorId);if(!a)return;
      const isNew=msg.authorId!==lastA||(msg.timestamp-lastT>420000);
      const t=new Date(msg.timestamp);
      const ts=`${t.toLocaleDateString('tr-TR')} ${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`;
      let body=msg.type==='gif'?`<img class="msg-img" src="${this.esc(msg.content)}">`:(this.fmt(msg.content));
      if(msg.attachments?.length)msg.attachments.forEach(at=>{
        if(['.png','.jpg','.jpeg','.gif','.webp'].includes(at.ext))body+=`<img class="msg-img" src="data:image/${at.ext.replace('.','')};base64,${at.data}">`;
        else{const sz=at.size>1048576?(at.size/1048576).toFixed(1)+' MB':(at.size/1024).toFixed(1)+' KB';body+=`<div class="file-att">${this.ic.file}<div class="f-info"><a class="f-name" href="data:application/octet-stream;base64,${at.data}" download="${this.esc(at.name)}">${this.esc(at.name)}</a><span class="f-size">${sz}</span></div></div>`}
      });
      mh+=`<div class="msg ${isNew?'head':''} fade-in" oncontextmenu="App.msgCtx(event,'${msg.id}',${msg.authorId===this.user.id})">
        ${isNew?`<div class="m-av" style="background:${a.avatarColor}">${a.avatar?`<img src="${a.avatar}">`:(a.username[0]||'?').toUpperCase()}</div>
        <div class="m-hdr"><span class="m-author" style="color:${a.avatarColor}">${this.esc(a.username)}</span><span class="m-time">${ts}</span></div>`:''}
        <div class="m-body">${body}</div></div>`;
      lastA=msg.authorId;lastT=msg.timestamp;
    });
    const main=document.getElementById('main');
    const isSame=main.querySelector('.chat-hdr-name')?.textContent===dmName;
    this.lastMsgCount=msgs.length;
    if(isSame){
      const s=document.getElementById('msgScroll');if(s){s.innerHTML=mh;if(msgs.length!==this._lastDmRenderCount)s.scrollTop=s.scrollHeight;}
    }else{
      main.innerHTML=`
        <div class="chat-hdr"><span class="chat-hdr-icon" style="font-size:20px">@</span><span class="chat-hdr-name">${this.esc(dmName)}</span></div>
        <div class="msgs" id="msgScroll">${mh}</div>
        <div class="input-area" style="position:relative">
          <div class="reply-bar ${this.replyTo?'show':''}" id="replyBar">
            <span>Yanıtlanıyor:</span><span class="rb-name" id="replyName"></span>
            <button class="rb-close" onclick="App.cancelReply()">✕</button>
          </div>
          <div class="input-wrap">
            <button class="inp-btn" onclick="App.uploadFile()" title="Dosya">${this.ic.plus}</button>
            <textarea class="msg-input" id="msgInp" rows="1" placeholder="@${this.esc(dmName)} kullanıcısına mesaj gönder" onkeydown="App.dmKey(event)"></textarea>
            <button class="inp-btn" onclick="App.toggleGif()" title="GIF" style="font-weight:700;font-size:14px">GIF</button>
            <button class="inp-btn" onclick="App.toggleEmoji()" title="Emoji" style="font-size:22px">😀</button>
          </div>
          <div class="emoji-pick" id="emojiPick"></div>
          <div class="gif-pick" id="gifPick"></div>
        </div>`;
      const s=document.getElementById('msgScroll');if(s)s.scrollTop=s.scrollHeight;
    }
    this._lastDmRenderCount=msgs.length;
  },

  renderMembers(){
    if(!this.curSrv)return;
    const s=Store.getServerById(this.curSrv.id);if(!s)return;
    const el=document.getElementById('memList');
    const on=[],off=[];
    s.members.forEach(uid=>{const u=Store.getUserById(uid);if(u){(u.status==='online'||u.status==='idle'||u.status==='dnd'?on:off).push(u)}});
    el.innerHTML=`
      <div class="mem-cat">Çevrimiçi — ${on.length}</div>
      ${on.map(u=>`<div class="mem" onclick="App.showProfile(event,'${u.id}')" oncontextmenu="App.memCtx(event,'${u.id}')">
        <div class="mem-av" style="background:${u.avatarColor}">${u.avatar?`<img src="${u.avatar}">`:(u.username[0]||'?').toUpperCase()}<div class="status-dot s-${u.status||'online'}"></div></div>
        <div style="flex:1;min-width:0">
          <div class="mem-name">${this.esc(u.username)}${u.isAdmin?'<span class="admin-badge" title="Disco Staff">STAFF</span>':''}${u.nitro?'<span class="mem-role" style="background:rgba(255,115,250,.15);color:#ff73fa;margin-left:2px;border-radius:3px;padding:1px 4px;font-size:9px">NITRO</span>':''}</div>
          ${u.activity?`<div class="mem-activity">🎮 ${this.esc(u.activity)}</div>`:(u.customStatus?`<div class="mem-activity">${this.esc(u.customStatus)}</div>`:'')}
        </div></div>`).join('')}
      <div class="mem-cat">Çevrimdışı — ${off.length}</div>
      ${off.map(u=>`<div class="mem" style="opacity:.4">
        <div class="mem-av" style="background:${u.avatarColor}">${u.avatar?`<img src="${u.avatar}">`:(u.username[0]||'?').toUpperCase()}<div class="status-dot s-offline"></div></div>
        <div><div class="mem-name">${this.esc(u.username)}</div></div></div>`).join('')}`;
  },

  renderHome(){
    this.curView='home';this.curSrv=null;this.curCh=null;this.curDM=null;
    document.getElementById('sideHdr').innerHTML=`<span>Direkt Mesajlar</span>`;
    document.getElementById('memList').style.display='none';
    document.querySelectorAll('.srv').forEach(el=>el.classList.remove('active'));
    document.getElementById('homeBtn').classList.add('active');
    const fris=Store.getUserFriends(this.user.id);
    const grps=Store.getUserGroups(this.user.id);
    let dh=`<div class="dm-hdr"><span>Direkt Mesajlar</span><button onclick="App.showModal('createGrpMdl')" title="Grup Oluştur">+</button></div>`;
    fris.forEach(f=>{const fid=f.fromId===this.user.id?f.toId:f.fromId;const fr=Store.getUserById(fid);if(fr)dh+=`<div class="dm" onclick="App.openDM('${fid}')"><div class="dm-av" style="background:${fr.avatarColor}">${fr.avatar?`<img src="${fr.avatar}">`:(fr.username[0]||'?').toUpperCase()}</div><span class="dm-name">${this.esc(fr.username)}</span></div>`});
    grps.forEach(g=>dh+=`<div class="dm" onclick="App.openGroup('${g.id}')"><div class="dm-av" style="background:var(--brand)">👥</div><span class="dm-name">${this.esc(g.name)}</span></div>`);
    document.getElementById('chContent').innerHTML=dh;
    this.renderFriends();this.renderServers();
  },

  renderFriends(){
    const fris=Store.getUserFriends(this.user.id);
    const pend=Store.getPendingReqs(this.user.id);
    const blocked=Store.getFriends().filter(f=>f.status==='blocked'&&f.blockedBy===this.user.id);
    let lh='';
    if(this.friTab==='add'){
      lh=`<div class="add-friend-view">
        <h2>Arkadaş Ekle</h2>
        <p>Discord kullanıcı adını kullanarak arkadaşlarını ekleyebilirsin.</p>
        <div class="add-friend-box">
          <input id="addFriInp" placeholder="Kullanıcı Adı#0000" onkeydown="if(event.key==='Enter')App.sendFriendReq()">
          <button class="btn btn-p" onclick="App.sendFriendReq()">Arkadaşlık İsteği Gönder</button>
        </div>
        <div id="friErr" class="err-msg" style="display:none;text-align:left;margin-top:8px"></div>
        <div id="friOk" style="display:none;color:var(--green);font-size:13px;margin-top:8px;font-weight:600"></div>
      </div>`;
    }else if(this.friTab==='pending'){
      pend.forEach(r=>{const from=Store.getUserById(r.fromId);if(!from)return;lh+=`<div class="fri" onclick="App.showProfile(event,'${from.id}')"><div class="fri-av" style="background:${from.avatarColor}">${from.avatar?`<img src="${from.avatar}">`:(from.username[0]||'?').toUpperCase()}</div><div class="fri-info"><div class="fri-name">${this.esc(from.username)}#${from.tag}</div><div class="fri-status">Gelen Arkadaşlık İsteği</div></div><div class="fri-acts"><button class="fri-btn" onclick="event.stopPropagation();App.acceptFri('${r.id}')" style="color:var(--green)" title="Kabul">✓</button><button class="fri-btn" onclick="event.stopPropagation();App.declineFri('${r.id}')" style="color:var(--red)" title="Reddet">✕</button></div></div>`});
      if(!pend.length)lh='<div style="text-align:center;padding:40px;color:var(--text-muted)">Bekleyen istek yok</div>';
    }else if(this.friTab==='blocked'){
      blocked.forEach(b=>{const t=Store.getUserById(b.fromId===this.user.id?b.toId:b.fromId);if(!t)return;lh+=`<div class="fri" onclick="App.showProfile(event,'${t.id}')"><div class="fri-av" style="background:${t.avatarColor}">${t.avatar?`<img src="${t.avatar}">`:(t.username[0]||'?').toUpperCase()}</div><div class="fri-info"><div class="fri-name">${this.esc(t.username)}</div><div class="fri-status">Engellendi</div></div></div>`});
      if(!blocked.length)lh='<div style="text-align:center;padding:40px;color:var(--text-muted)">Engellenen yok</div>';
    }else{
      const list=fris.filter(f=>{if(this.friTab==='online'){const fid=f.fromId===this.user.id?f.toId:f.fromId;const u=Store.getUserById(fid);return u?.status==='online'}return true});
      list.forEach(f=>{const fid=f.fromId===this.user.id?f.toId:f.fromId;const fr=Store.getUserById(fid);if(!fr)return;
        lh+=`<div class="fri" onclick="App.showProfile(event,'${fr.id}')" ondblclick="App.openDM('${fid}')"><div class="fri-av" style="background:${fr.avatarColor}">${fr.avatar?`<img src="${fr.avatar}">`:(fr.username[0]||'?').toUpperCase()}</div><div class="fri-info"><div class="fri-name">${this.esc(fr.username)}</div><div class="fri-status">${fr.status==='online'?'Çevrimiçi':'Çevrimdışı'}${fr.activity?' • 🎮 '+this.esc(fr.activity):''}</div></div><div class="fri-acts"><button class="fri-btn" onclick="event.stopPropagation();App.openDM('${fid}')" title="Mesaj">${this.ic.msg}</button></div></div>`});
      if(!list.length)lh='<div style="text-align:center;padding:40px;color:var(--text-muted)">Henüz arkadaş yok. Arkadaş Ekle sekmesini kullan!</div>';
    }
    const main=document.getElementById('main');
    main.innerHTML=`
      <div class="chat-hdr">
        <span class="chat-hdr-icon">${this.ic.members}</span><span class="chat-hdr-name">Arkadaşlar</span>
        <div class="chat-hdr-div"></div>
        <div class="friends-tabs">
          <button class="f-tab ${this.friTab==='online'?'active':''}" onclick="App.setFriTab('online')">Çevrimiçi</button>
          <button class="f-tab ${this.friTab==='all'?'active':''}" onclick="App.setFriTab('all')">Tümü</button>
          <button class="f-tab ${this.friTab==='pending'?'active':''}" onclick="App.setFriTab('pending')">Bekleyen${pend.length?' ('+pend.length+')':''}</button>
          <button class="f-tab ${this.friTab==='blocked'?'active':''}" onclick="App.setFriTab('blocked')">Engellenen</button>
          <button class="f-tab add-f ${this.friTab==='add'?'active':''}" onclick="App.setFriTab('add')">Arkadaş Ekle</button>
        </div>
        <div style="margin-left:auto"><button class="hdr-btn" onclick="App.showModal('nitroMdl')" title="Nitro" style="color:#ff73fa">${this.ic.nitro}</button></div>
      </div>
      <div class="friends-list">${lh}</div>`;
  },

  renderVoicePanel(){
    const vs=Voice.state(),p=document.getElementById('voicePanel');
    if(vs.currentVC){
      p.classList.add('show');
      const s=Store.getServerById(vs.currentVC.serverId);let cn='';
      if(s)s.categories.forEach(c=>c.channels.forEach(ch=>{if(ch.id===vs.currentVC.channelId)cn=ch.name}));
      document.getElementById('vpText').textContent=vs.isScreenSharing?'Ekran Paylaşılıyor':(vs.isCameraOn?'Kamera Açık':'Ses Bağlantısı');
      document.getElementById('vpCh').textContent=`🔊 ${cn} / ${s?.name||''}`;
      const cb=document.getElementById('vpCam');if(cb)cb.className=`vp-btn${vs.isCameraOn?' active':''}`;
      const sb=document.getElementById('vpScreen');if(sb)sb.className=`vp-btn${vs.isScreenSharing?' active':''}`;
      const mb=document.getElementById('vpMute');if(mb)mb.className=`vp-btn${vs.isMuted?' active':''}`;
      const nb=document.getElementById('vpNoise');if(nb)nb.className=`vp-btn${vs.isNoiseSuppressed?' active':''}`;
      const db=document.getElementById('vpDeaf');if(db)db.className=`vp-btn${vs.isDeafened?' active':''}`;
    }else p.classList.remove('show');
    this.renderUserPanel();
  },

  // === ACTIONS ===
  goHome(){this.renderHome()},

  updateVoiceActivity(uid, speaking){
    document.querySelectorAll(`.vu-av[data-uid="${uid}"]`).forEach(el=>{
      if(speaking)el.classList.add('speaking');
      else el.classList.remove('speaking');
    });
  },

  selectServer(id){
    this.curSrv=Store.getServerById(id);this.curView='server';this.curDM=null;
    document.querySelectorAll('.srv').forEach(el=>el.classList.remove('active'));
    this.renderServers();this.renderChannels();
    const first=this.firstTextCh();
    if(first)this.selectCh(first.id);
    else document.getElementById('main').innerHTML=`<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:18px">Lütfen soldan bir kanal seç.</div>`;
    document.getElementById('memList').style.display='flex';this.renderMembers();
  },

  firstTextCh(){if(!this.curSrv)return null;for(const c of this.curSrv.categories)for(const ch of c.channels)if(ch.type==='text')return ch;return null},

  selectCh(id){
    if(!this.curSrv)return;const s=Store.getServerById(this.curSrv.id);let found=null;
    s.categories.forEach(c=>c.channels.forEach(ch=>{if(ch.id===id)found=ch}));
    if(!found||found.type!=='text')return;
    this.curCh=found;this.curView='channel';this.replyTo=null;
    this.renderChannels();this.renderMessages();
    document.getElementById('memList').style.display='flex';this.renderMembers();
  },

  async joinVoice(chId){
    if(!this.curSrv)return;
    const vs=Voice.state();if(vs.currentVC?.channelId===chId)return;
    await Voice.join(this.curSrv.id,chId);
    this.setActivity('voice');
  },
  leaveVoice(){
    Voice.leave();
    this.setActivity('idle');
  },

  toggleCat(catId){const s=Store.getServerById(this.curSrv.id);const c=s.categories.find(x=>x.id===catId);if(c){c.collapsed=!c.collapsed;Store.updateServer(s)}this.renderChannels()},

  // Server CRUD
  showModal(id){document.getElementById(id).classList.add('show')},
  closeModals(){document.querySelectorAll('.modal-bg').forEach(el=>el.classList.remove('show'))},

  createServer(){
    const n=document.getElementById('newSrvName').value.trim();if(!n)return;
    const s=Store.createServer(n,this.user.id);this.closeModals();this.renderServers();this.selectServer(s.id);
  },
  joinServer(){
    let code=document.getElementById('joinCode').value.trim();
    code=code.replace(/^(https?:\/\/)?(disco\.gg\/)/i,'');
    if(!code)return;
    const r=Store.joinServer(code,this.user.id);
    if(r.error){const e=document.getElementById('joinErr');e.textContent=r.error;e.style.display='block';setTimeout(()=>e.style.display='none',3000);return}
    this.closeModals();this.renderServers();this.selectServer(r.server.id);
  },
  joinByCode(code){const r=Store.joinServer(code,this.user.id);if(!r.error){this.renderServers();this.selectServer(r.server.id)}},

  showInvite(srvId){
    const s=Store.getServerById(srvId);if(!s)return;
    this.showModal('inviteMdl');
    document.getElementById('invSrvName').textContent=s.name;
    document.getElementById('invCode').textContent=Store.getInviteLink(srvId);
  },
  copyInvite(){
    const code=document.getElementById('invCode').textContent;
    navigator.clipboard.writeText(code);
    const btns=document.querySelectorAll('#inviteMdl .btn-p');btns.forEach(b=>{b.textContent='Kopyalandı!';setTimeout(()=>b.textContent='Kopyala',2000)});
  },
  sendInviteToChannel(){
    if(!this.curCh)return;
    const link=document.getElementById('invCode').textContent;
    Store.sendMessage(this.curCh.id,this.curSrv.id,this.user.id,link);
    this.closeModals();this.renderMessages();
  },

  showCreateCh(catId){this.selCatId=catId;this.newChType='text';this.showModal('createChMdl');document.getElementById('newChName').value='';this.setChType('text')},
  setChType(t){this.newChType=t;document.getElementById('chTText').className=t==='text'?'btn btn-p':'btn btn-s';document.getElementById('chTVoice').className=t==='voice'?'btn btn-p':'btn btn-s';document.getElementById('chTText').style.border='';document.getElementById('chTVoice').style.border=t==='voice'?'':'1px solid #4e5058'},
  createChannel(){const n=document.getElementById('newChName').value.trim().toLowerCase().replace(/\s+/g,'-');if(!n||!this.curSrv)return;Store.addChannel(this.curSrv.id,this.selCatId,n,this.newChType);this.closeModals();this.curSrv=Store.getServerById(this.curSrv.id);this.renderChannels()},

  // Messages
  msgKey(e){
    if(e.key==='Enter'&&!e.shiftKey){
      e.preventDefault();
      this.sendMsg();
    }
  },
  sendMsg(){
    const inp=document.getElementById('msgInp');if(!inp)return;
    const t=inp.value.trim();
    if(!t&&!(this._attachments&&this._attachments.length))return;
    Store.sendMessage(this.curCh.id,this.curSrv.id,this.user.id,t,'text',this._attachments||[],this.replyTo);
    this._attachments=[];this.replyTo=null;inp.value='';
    this.renderMessages();Sounds.play('message');
    const rb=document.getElementById('replyBar');if(rb)rb.classList.remove('show');
    setTimeout(()=>document.getElementById('msgInp')?.focus(),10);
  },
  dmKey(e){
    if(e.key==='Enter'&&!e.shiftKey){
      e.preventDefault();
      this.sendDM();
    }
  },
  sendDM(){
    const inp=document.getElementById('msgInp');if(!inp)return;
    const t=inp.value.trim();
    if(!t&&!(this._attachments&&this._attachments.length))return;
    Store.sendDMMessage(this.curDM.id,this.user.id,t,'text',this._attachments||[],this.replyTo);
    this._attachments=[];this.replyTo=null;inp.value='';
    this.renderDMMessages();Sounds.play('message');
    const rb=document.getElementById('replyBar');if(rb)rb.classList.remove('show');
    setTimeout(()=>document.getElementById('msgInp')?.focus(),10);
  },

  setReply(id){this.replyTo=id;this.renderMessages();document.getElementById('msgInp')?.focus()},
  cancelReply(){this.replyTo=null;const b=document.getElementById('replyBar');if(b)b.classList.remove('show')},
  delMsg(id){Store.deleteMessage(id);this.renderMessages()},
  editMsg(id){const msgs=Store.getMessages(this.curCh.id);const m=msgs.find(x=>x.id===id);if(!m)return;const nc=prompt('Mesajı düzenle:',m.content);if(nc!==null&&nc.trim()){Store.editMessage(id,nc.trim());this.renderMessages()}},
  
  dragCh(e,id){e.dataTransfer.setData('chId',id)},
  dropCh(e,targetId){
    const srcId=e.dataTransfer.getData('chId');if(!srcId||srcId===targetId)return;
    const s=Store.getServerById(this.curSrv.id);if(!s)return;
    let srcCat,tgtCat,srcIdx=-1,tgtIdx=-1,ch;
    s.categories.forEach(c=>{
      const idx1=c.channels.findIndex(x=>x.id===srcId);
      if(idx1>-1){srcCat=c;srcIdx=idx1;ch=c.channels[idx1]}
      const idx2=c.channels.findIndex(x=>x.id===targetId);
      if(idx2>-1){tgtCat=c;tgtIdx=idx2}
    });
    if(!srcCat||!tgtCat)return;
    srcCat.channels.splice(srcIdx,1);
    tgtCat.channels.splice(tgtIdx,0,ch);
    Store.updateServer(s);this.renderChannels();
  },

  reactMenu(e,msgId){
    e.preventDefault();
    this._reactTarget=msgId;
    this.toggleEmoji();
    const p=document.getElementById('emojiPick');
    if(p){
      p.style.bottom='auto';p.style.right='auto';
      p.style.top=Math.min(e.clientY,window.innerHeight-450)+'px';
      p.style.left=Math.min(e.clientX,window.innerWidth-400)+'px';
    }
  },
  toggleReaction(msgId,emoji){
    if(this.curView==='dm')Store.addDMReaction(msgId,emoji,this.user.id);
    else Store.addReaction(msgId,emoji,this.user.id);
    if(this.curView==='dm')this.renderDMMessages();else this.renderMessages();
  },
  addReaction(msgId,emoji){
    Store.addReaction(msgId,emoji,this.user.id);
    this.renderMessages();
  },
  showReactPicker(msgId){
    const p=document.getElementById('emojiPick');
    if(p){
      p.classList.add('show');
      p.innerHTML=`<div class="ep-search"><span style="color:var(--text-muted);font-size:12px">Tepki seç</span></div>
        <div class="ep-grid">${['👍','❤️','😂','😮','😢','🎉','🔥','👀'].map(e=>`<button class="ep-item" onclick="App.addReaction('${msgId}','${e}');document.getElementById('emojiPick').classList.remove('show')">${e}</button>`).join('')}</div>`;
    }
  },
  onType(){
    if(this.curCh)Store.setTyping(this.curCh.id,this.user.id);
    this.setActivity('messaging');
    clearTimeout(this._activityTimeout);
    this._activityTimeout=setTimeout(()=>{
      const vs=Voice.state();
      if(vs.currentVC)this.setActivity('voice');
      else this.setActivity('idle');
    },3000);
  },

  async uploadFile(){
    const files=await electron.openFileDialog();if(!files)return;
    files.forEach(f=>{
      if(this.curCh){
        const t=['.png','.jpg','.jpeg','.gif','.webp'].includes(f.ext)?'image':'text';
        Store.sendMessage(this.curCh.id,this.curSrv.id,this.user.id,t==='image'?'':f.name,t,[f]);
        this.renderMessages();
      }else if(this.curDM){Store.sendDM(this.curDM.id,this.user.id,f.name,'text',[f]);this.renderDMMessages()}
    });
  },

  // GIF
  async toggleGif(){
    const p=document.getElementById('gifPick');if(!p)return;
    const ep=document.getElementById('emojiPick');if(ep)ep.classList.remove('show');
    if(p.classList.contains('show')){p.classList.remove('show');return}
    this._gifTab='trend';
    p.innerHTML=`<div class="gp-tabs">
      <button class="gp-tab active" id="gtTrend" onclick="App.setGifTab('trend')">🔥 Trendler</button>
      <button class="gp-tab" id="gtSearch" onclick="App.setGifTab('search')">🔍 Ara</button>
      <button class="gp-tab" id="gtFav" onclick="App.setGifTab('fav')">⭐ Favoriler</button>
    </div>
      <div class="gp-search"><input placeholder="GIF ara..." id="gifSearchInp" onkeyup="if(event.key==='Enter')App.searchGif(this.value)"><button class="gs-btn" onclick="App.searchGif(document.getElementById('gifSearchInp').value)">🔍</button></div>
      <div class="gp-grid" id="gifGrid">Yükleniyor...</div>
      <div class="gp-foot">Powered by GIPHY</div>`;
    p.classList.add('show');
    this.setGifTab('trend');
  },
  async setGifTab(t){
    this._gifTab=t;
    document.getElementById('gtTrend')?.classList.toggle('active',t==='trend');
    document.getElementById('gtSearch')?.classList.toggle('active',t==='search');
    document.getElementById('gtFav')?.classList.toggle('active',t==='fav');
    const g=document.getElementById('gifGrid');if(!g)return;
    if(t==='trend'){
      g.innerHTML='<div class="gp-loading">🔥 Trend GIF\'ler yükleniyor...</div>';
      const gifs=await Giphy.trending();
      g.innerHTML=gifs.map(x=>`<div class="gp-item" onclick="App.sendGif('${x.medium}')"><img src="${x.small}" loading="lazy"><button class="gp-fav" onclick="event.stopPropagation();App.favGif('${x.medium}','${x.small}')">★</button></div>`).join('');
    }else if(t==='search'){
      g.innerHTML='<div class="gp-empty">🔍 Bir şey ara...</div>';
    }else{
      if(!Store.getGifFavs) { Store.getGifFavs = () => Store._g('gif_favs')||[]; Store.saveGifFavs = (f) => Store._s('gif_favs',f); }
      const favs=Store.getGifFavs();
      if(!favs.length)g.innerHTML='<div class="gp-empty">⭐ Favori GIF yok<br><small>Bir GIF\'e ⭐ tıklayarak ekle</small></div>';
      else g.innerHTML=favs.map(x=>`<div class="gp-item" onclick="App.sendGif('${x.url}')"><img src="${x.smallUrl}" loading="lazy"><button class="gp-fav faved" onclick="event.stopPropagation();App.unfavGif('${x.url}')">★</button></div>`).join('');
    }
  },
  async searchGif(q){
    if(!q){this.setGifTab('trend');return;}
    const g=document.getElementById('gifGrid');if(!g)return;
    g.innerHTML='<div class="gp-loading">🔍 "'+q+'" için aranıyor...</div>';
    const gifs=await Giphy.search(q);
    if(!gifs.length)g.innerHTML='<div class="gp-empty">❌ Sonuç bulunamadı</div>';
    else g.innerHTML=gifs.map(x=>`<div class="gp-item" onclick="App.sendGif('${x.medium}')"><img src="${x.small}" loading="lazy"><button class="gp-fav" onclick="event.stopPropagation();App.favGif('${x.medium}','${x.small}')">★</button></div>`).join('');
  },
  favGif(url,smallUrl){
    if(!Store.getGifFavs) { Store.getGifFavs = () => Store._g('gif_favs')||[]; Store.saveGifFavs = (f) => Store._s('gif_favs',f); }
    const f=Store.getGifFavs();
    if(!f.find(x=>x.url===url)){f.push({url,smallUrl});Store.saveGifFavs(f);}
    Sounds.play('notify');
  },
  unfavGif(url){
    const f=Store.getGifFavs().filter(x=>x.url!==url);Store.saveGifFavs(f);
    if(this._gifTab==='fav')this.setGifTab('fav');
  },
  async searchGif(q){
    if(this._gifTab==='fav')return;
    const gifs=await Giphy.search(q);
    const g=document.getElementById('gifGrid');
    if(g)g.innerHTML=gifs.map(x=>`<div class="gp-item" onclick="App.sendGif('${x.medium}')"><img src="${x.small}" loading="lazy"><button class="gp-fav" onclick="event.stopPropagation();App.favGif('${x.medium}','${x.small}')">★</button></div>`).join('');
  },
  sendGif(url){
    if(this.curCh){Store.sendMessage(this.curCh.id,this.curSrv.id,this.user.id,url,'gif');this.renderMessages()}
    else if(this.curDM){Store.sendDM(this.curDM.id,this.user.id,url,'gif');this.renderDMMessages()}
    const p=document.getElementById('gifPick');if(p)p.classList.remove('show');
  },

  // Emoji
  toggleEmoji(){
    const p=document.getElementById('emojiPick');if(!p)return;
    const gp=document.getElementById('gifPick');if(gp)gp.classList.remove('show');
    if(p.classList.contains('show') && !this._reactTarget){p.classList.remove('show');return}
    p.style.top=''; p.style.left=''; p.style.bottom=''; p.style.right='';
    const cats=Object.keys(EMOJIS);
    const hasNitro=this.user?.nitro;
    let html=`<div class="ep-search"><input placeholder="Emoji ara" oninput="App.filterEmoji(this.value)"></div>`;
    if(hasNitro){
      html+=`<div class="ep-cats"><button class="ep-cat" onclick="App.showEmojiCat('nitro')" title="Nitro Özel">✨</button>${cats.map((c,i)=>`<button class="ep-cat ${i===0?'active':''}" onclick="App.showEmojiCat(${i})" title="${c}">${EMOJIS[c][0]}</button>`).join('')}</div>`;
      html+=`<div class="ep-grid" id="emojiGrid">${Object.values(ANIMATED_EMOJIS)[0].map(e=>`<button class="ep-item ep-anim" onclick="App.insEmoji('${e.emoji}','${e.url}')"><img src="${e.url}" alt="${e.emoji}"></button>`).join('')}</div>`;
    }else{
      html+=`<div class="ep-cats">${cats.map((c,i)=>`<button class="ep-cat ${i===0?'active':''}" onclick="App.showEmojiCat(${i})" title="${c}">${EMOJIS[c][0]}</button>`).join('')}</div>`;
      html+=`<div class="ep-grid" id="emojiGrid">${EMOJIS[cats[0]].map(e=>`<button class="ep-item" onclick="App.insEmoji('${e}')">${e}</button>`).join('')}</div>`;
    }
    p.innerHTML=html;
    p.classList.add('show');
  },
  showEmojiCat(i){
    if(i==='nitro'){
      const g=document.getElementById('emojiGrid');
      if(g)g.innerHTML=Object.values(ANIMATED_EMOJIS)[0].map(e=>`<button class="ep-item ep-anim" onclick="App.insEmoji('${e.emoji}','${e.url}')"><img src="${e.url}" alt="${e.emoji}"></button>`).join('');
    }else{
      const cats=Object.keys(EMOJIS);const g=document.getElementById('emojiGrid');if(g)g.innerHTML=EMOJIS[cats[i]].map(e=>`<button class="ep-item" onclick="App.insEmoji('${e}')">${e}</button>`).join('');document.querySelectorAll('.ep-cat').forEach((b,j)=>b.classList.toggle('active',j===i+1));
    }
  },
  filterEmoji(q){if(!q){this.showEmojiCat(0);return}const all=Object.values(EMOJIS).flat();const g=document.getElementById('emojiGrid');if(g)g.innerHTML=all.map(e=>`<button class="ep-item" onclick="App.insEmoji('${e}')">${e}</button>`).join('')},
  insEmoji(e,url){
    if(this._reactTarget){
      this.toggleReaction(this._reactTarget, e);
      this._reactTarget=null;
    }else{
      const inp=document.getElementById('msgInp');
      if(inp){inp.value+=e;inp.focus();this.onType();}
    }
    document.getElementById('emojiPick')?.classList.remove('show');
  },

  // Friends
  setFriTab(t){this.friTab=t;this.renderFriends()},
  sendFriendReq(){
    const tag=document.getElementById('addFriInp').value.trim();
    if(!tag.includes('#')){document.getElementById('friErr').textContent='Format: Kullanıcı#0001';document.getElementById('friErr').style.display='block';return}
    const r=Store.sendFriendReq(this.user.id,tag);
    if(r.error){document.getElementById('friErr').textContent=r.error;document.getElementById('friErr').style.display='block';document.getElementById('friOk').style.display='none'}
    else{document.getElementById('friOk').textContent='Arkadaşlık isteği gönderildi!';document.getElementById('friOk').style.display='block';document.getElementById('friErr').style.display='none';Sounds.play('notify')}
  },
  acceptFri(id){Store.acceptFriend(id);Sounds.play('notify');this.renderHome()},
  declineFri(id){Store.declineFriend(id);this.renderHome()},

  // DM & Groups
  openDM(fid){
    this.curDM={id:`dm_${[this.user.id,fid].sort().join('_')}`,friendId:fid};
    this.curSrv=null;this.curCh=null;this.curView='dm';
    document.getElementById('memList').style.display='none';
    document.querySelectorAll('.srv').forEach(el=>el.classList.remove('active'));
    document.getElementById('homeBtn').classList.add('active');
    this.renderDMMessages();
  },
  openGroup(gid){
    const g=Store.getGroupDMs().find(x=>x.id===gid);if(!g)return;
    this.curDM=g;this.curSrv=null;this.curCh=null;this.curView='dm';
    document.getElementById('memList').style.display='none';this.renderDMMessages();
  },
  createGroup(){
    const n=document.getElementById('grpName').value.trim()||'Grup';
    const checked=document.querySelectorAll('.grp-cb:checked');
    const mids=Array.from(checked).map(cb=>cb.value);if(!mids.length)return;
    const g=Store.createGroupDM(this.user.id,mids,n);this.closeModals();this.openGroup(g.id);
  },

  // Status
  setStatus(){
    const status=document.getElementById('statusType').value;
    const cs=document.getElementById('statusText').value.trim();
    this.user.status=status;this.user.customStatus=cs;
    Store.updateUser(this.user);this.closeModals();this.renderUserPanel();
  },

  // Nitro
  showNitroPurchase(type){
    this._pendingNitro=type;
    document.getElementById('nitroBuyBadge').textContent=type==='full'?'NITRO':'NITRO BASIC';
    document.getElementById('nitroBuyPrice').textContent=type==='full'?'₺99.99':'₺49.99';
    document.getElementById('nitroBuyFeatures').innerHTML=type==='full'?
      '<li>Tüm Basic özellikleri</li><li>Profil banner</li><li>500MB dosya yükleme</li><li>2x Sunucu Boost</li>':
      '<li>Özel avatar</li><li>50MB dosya yükleme</li><li>Özel emoji kullanımı</li>';
    
    document.getElementById('payCard').value='';
    document.getElementById('payExpiry').value='';
    document.getElementById('payCvv').value='';
    document.getElementById('payName').value='';
    
    this.closeModals();
    this.showModal('nitroBuyMdl');
  },
  completePurchase(){
    const c=document.getElementById('payCard').value;
    const e=document.getElementById('payExpiry').value;
    const v=document.getElementById('payCvv').value;
    const n=document.getElementById('payName').value;
    if(c.length<19||e.length<5||v.length<3||!n.trim()){alert('Lütfen kart bilgilerini eksiksiz girin.');return;}
    
    Store.giveNitro(this.user.id,this._pendingNitro,1);
    this.user=Store.getCurrentUser();
    this.closeModals();this.renderUserPanel();
    if(document.getElementById('settingsPage').classList.contains('show'))this.setTab('nitro');
    Sounds.play('notify');
    alert(this._pendingNitro==='full'?'Ödeme başarılı! Disco Nitro aktif!':'Ödeme başarılı! Disco Nitro Basic aktif!');
  },

  // Boost
  showBoost(srvId){
    const s=Store.getServerById(srvId);if(!s)return;
    document.getElementById('boostSrvName').textContent=s.name+' (Mevcut: '+s.boostCount+' boost)';
    this.showModal('boostMdl');this._boostSrv=srvId;
  },
  doBoost(){
    const count=parseInt(document.getElementById('boostCount').value)||1;
    Store.boostServer(this._boostSrv,this.user.id,count);
    this.closeModals();Sounds.play('notify');
    const s=Store.getServerById(this._boostSrv);
    if(s){
      if(s.boostCount>=14&&!s.vanityUrl){
        const ci=prompt('14 Boost! Özel davet linki belirle (disco.gg/isim):');
        if(ci){Store.setVanityUrl(this._boostSrv,ci.toLowerCase().replace(/\s+/g,''));}
      }else if(s.boostCount>=2&&!s.customInvite){
        const ci=prompt('Sunucu boosted! Özel davet linki belirle (disco.gg/isim):');
        if(ci){s.customInvite=ci.toLowerCase().replace(/\s+/g,'');Store.updateServer(s);}
      }
      if(s.boostCount>=10&&!s.tag){
        const tag=prompt('10 Boost! Sunucu tagı belirle (örn: DISCO):');
        if(tag){Store.setServerTag(this._boostSrv,tag.toUpperCase());}
      }
    }
  },

  // Discover
  showDiscover(){
    this.curView='discover';this.curSrv=null;this.curCh=null;this.curDM=null;
    document.getElementById('memList').style.display='none';
    document.querySelectorAll('.srv').forEach(el=>el.classList.remove('active'));
    const srvs=Store.getDiscoverServers();
    document.getElementById('main').innerHTML=`<div class="discover">
      <h2>Sunucu Keşfet</h2>
      <p style="color:var(--text-muted);margin-bottom:24px">Toplulukları keşfet ve katıl — sadece doğrulanmış sunucular burada.</p>
      <div class="discover-grid">${srvs.map(s=>`
        <div class="discover-card" onclick="App.joinByCode('${s.inviteCode}')">
          <div class="dc-banner">${s.icon?`<img src="${s.icon}">`:''}
            <div class="dc-icon" style="background:${s.icon?'':'var(--brand)'}">${s.icon?`<img src="${s.icon}">`:(s.name||'').split(' ').map(w=>(w[0]||'')).join('').substring(0,2).toUpperCase()}</div>
          </div>
          <div class="dc-body">
            <div class="dc-name">${this.esc(s.name)} <div class="verified-tick">${this.ic.check}</div></div>
            <div class="dc-desc">${s.isOfficial?'Disco resmi sunucusu. Güncellemeler, duyurular ve destek.':'Doğrulanmış topluluk sunucusu.'}</div>
            <div class="dc-stats"><span class="online">${s.members.length} çevrimiçi</span><span class="total">${s.members.length} üye</span></div>
          </div>
        </div>`).join('')}
      ${srvs.length===0?'<div style="text-align:center;padding:40px;color:var(--text-muted);grid-column:1/-1">Henüz doğrulanmış sunucu yok. Admin panelden sunucu doğrulayabilirsiniz.</div>':''}
      </div>
    </div>`;
  },

  // Settings
  openSettings(){
    document.getElementById('settingsPage').classList.add('show');
    const isAdm=Store.isAdmin(this.user.id);
    document.getElementById('setSide').innerHTML=`
      <div class="set-hdr">Kullanıcı Ayarları</div>
      <div class="set-nav active" onclick="App.setTab('account')">Hesabım</div>
      <div class="set-nav" onclick="App.setTab('profile')">Profiller</div>
      <div class="set-nav" onclick="App.setTab('privacy')">Gizlilik & Güvenlik</div>
      <div class="set-nav" onclick="App.setTab('connections')">Bağlantılar</div>
      <div class="set-nav" onclick="App.setTab('nitro')">Disco Nitro</div>
      <div class="set-sep"></div>
      <div class="set-hdr">Uygulama Ayarları</div>
      <div class="set-nav" onclick="App.setTab('appearance')">Görünüm</div>
      <div class="set-nav" onclick="App.setTab('accessibility')">Erişilebilirlik</div>
      <div class="set-nav" onclick="App.setTab('voice')">Ses ve Video</div>
      <div class="set-nav" onclick="App.setTab('notifications')">Bildirimler</div>
      <div class="set-nav" onclick="App.setTab('keybinds')">Klavye Kısayolları</div>
      <div class="set-nav" onclick="App.setTab('resources')">P2P Kaynaklar</div>
      ${isAdm?`<div class="set-sep"></div><div class="set-hdr">Yönetici</div><div class="set-nav" onclick="App.setTab('admin')" style="color:var(--red)">Admin Panel</div>`:''}
      <div class="set-sep"></div>
      <div class="set-nav" onclick="App.doLogout()" style="color:var(--red)">Çıkış Yap</div>`;
    this.setTab('account');
  },
  closeSettings(){
    if(Voice.isMicTesting) Voice.stopMicTest();
    document.getElementById('settingsPage').classList.remove('show');
  },

  openSrvSettings(id){
    this._setSrvId=id;
    document.getElementById('srvSettingsPage').classList.add('show');
    document.getElementById('srvSetSide').innerHTML=`
      <div class="set-hdr">Sunucu Ayarları</div>
      <div class="set-nav active" onclick="App.setSrvTab('overview')">Genel Görünüm</div>
      <div class="set-nav" onclick="App.setSrvTab('roles')">Roller</div>
      <div class="set-nav" onclick="App.setSrvTab('emoji')">Emoji / Sticker</div>
      <div class="set-nav" onclick="App.setSrvTab('moderation')">Moderasyon</div>
      <div class="set-nav" onclick="App.setSrvTab('invites')">Davet Ayarları</div>
      <div class="set-nav" onclick="App.setSrvTab('boost')">Server Boost Durumu</div>
      <div class="set-nav" onclick="App.setSrvTab('audit')">Denetim Kaydı (Audit Log)</div>
      <div class="set-nav" onclick="App.setSrvTab('webhooks')">Entegrasyonlar (Webhooks)</div>
      <div class="set-sep"></div>
      <div class="set-nav" onclick="App.delServer('${id}')" style="color:var(--red)">Sunucuyu Sil</div>`;
    this.setSrvTab('overview');
  },
  closeSrvSettings(){document.getElementById('srvSettingsPage').classList.remove('show')},

  setSrvTab(tab){
    document.querySelectorAll('#srvSettingsPage .set-nav').forEach(el=>el.classList.remove('active'));
    const s=Store.getServerById(this._setSrvId);if(!s)return;
    const el=document.getElementById('srvSetCont');
    if(tab==='overview'){
      el.innerHTML=`<h2 style="color:var(--header-primary);font-size:20px;margin-bottom:20px">Sunucu Genel Görünümü</h2>
        <div class="m-field"><label class="m-label">Sunucu Adı</label><input class="m-input" id="setSrvName" value="${this.esc(s.name)}"></div>
        ${(s.boostCount||0)>=10?`<div class="m-field"><label class="m-label">Sunucu Tagı (10 Boost Avantajı)</label><input class="m-input" id="setSrvTag" value="${s.tag||''}" placeholder="Örn: DISCO"></div>`:''}
        ${(s.boostCount||0)>=14?`<div class="m-field"><label class="m-label">Özel Davet Linki (14 Boost Avantajı)</label><div style="display:flex;align-items:center"><span style="color:var(--text-muted);padding-right:8px;font-size:15px">disco.gg/</span><input class="m-input" id="setSrvVanity" value="${s.vanityUrl||''}" placeholder="isim"></div></div>`:''}
        <button class="btn btn-g" onclick="App.saveSrvName()">Değişiklikleri Kaydet</button>`;
    }else if(tab==='roles'){
      el.innerHTML=`<h2 style="color:var(--header-primary);font-size:20px;margin-bottom:20px">Roller</h2>
        <p style="color:var(--text-muted);font-size:13px;margin-bottom:16px">Yakında eklenecek: Gelişmiş rol ve izin sistemi</p>
        <button class="btn btn-p" onclick="alert('Rol oluşturma paneli yakında')">Rol Oluştur</button>`;
    }else if(tab==='boost'){
      const bc=s.boostCount||0;
      let lvl=0; if(bc>=14)lvl=3; else if(bc>=7)lvl=2; else if(bc>=2)lvl=1;
      const next=lvl===0?2:(lvl===1?7:(lvl===2?14:'Maks'));
      const prog=next==='Maks'?100:(bc/(next)*100);
      el.innerHTML=`
        <h2 style="color:#ff73fa;display:flex;align-items:center;gap:8px">${this.ic.nitro} Sunucu Boost Durumu</h2>
        <p style="color:var(--text-muted);margin-bottom:24px">Sunucunuzu destekleyerek yeni özelliklerin kilidini açın.</p>
        <div style="background:var(--bg-secondary);padding:24px;border-radius:12px;margin-bottom:24px;position:relative;overflow:hidden">
          <div style="position:relative;z-index:2">
            <div style="font-size:24px;font-weight:700">Seviye ${lvl}</div>
            <div style="color:var(--text-muted);margin-top:4px">${bc} Boost • ${next==='Maks'?'Maksimum seviyedesiniz':`Sonraki seviyeye ${next-bc} boost kaldı`}</div>
            <div style="width:100%;height:12px;background:var(--bg-tertiary);border-radius:6px;margin-top:16px;overflow:hidden">
              <div style="height:100%;background:#ff73fa;width:${prog}%"></div>
            </div>
          </div>
        </div>
        <button class="btn btn-p" style="background:#ff73fa;color:#fff;width:100%;padding:12px;font-size:16px;margin-bottom:32px" onclick="App.boostServer()">Bu Sunucuya Boost Bas</button>
        <h3 style="margin-bottom:16px">Seviye Avantajları</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px">
          <div style="background:var(--bg-secondary);padding:16px;border-radius:8px;border:1px solid ${lvl>=1?'#ff73fa':'transparent'}"><div style="font-weight:700;margin-bottom:8px">Seviye 1 (2 Boost)</div><ul style="font-size:13px;color:var(--text-muted);padding-left:16px"><li>+50 Emoji Slotu</li><li>128 Kbps Ses Kalitesi</li><li>Gelişmiş Yayın Kalitesi</li></ul></div>
          <div style="background:var(--bg-secondary);padding:16px;border-radius:8px;border:1px solid ${lvl>=2?'#ff73fa':'transparent'}"><div style="font-weight:700;margin-bottom:8px">Seviye 2 (7 Boost)</div><ul style="font-size:13px;color:var(--text-muted);padding-left:16px"><li>+50 Emoji Slotu (Toplam 100)</li><li>256 Kbps Ses Kalitesi</li><li>Sunucu Afişi</li><li>1080p 60fps Yayın</li></ul></div>
          <div style="background:var(--bg-secondary);padding:16px;border-radius:8px;border:1px solid ${lvl>=3?'#ff73fa':'transparent'}"><div style="font-weight:700;margin-bottom:8px">Seviye 3 (14 Boost)</div><ul style="font-size:13px;color:var(--text-muted);padding-left:16px"><li>+100 Emoji Slotu (Toplam 250)</li><li>384 Kbps Ses Kalitesi</li><li>Özel Davet Bağlantısı</li><li>Hareketli Sunucu İkonu</li></ul></div>
        </div>`;
    }else{
      el.innerHTML=`<h2 style="color:var(--header-primary);font-size:20px;margin-bottom:20px">${tab} Ayarları</h2>
        <p style="color:var(--text-muted);font-size:13px">Bu özellik henüz geliştirme aşamasındadır.</p>`;
    }
  },
  saveSrvName(){
    const n=document.getElementById('setSrvName').value.trim();
    if(n){
      const s=Store.getServerById(this._setSrvId);s.name=n;
      const tagInp=document.getElementById('setSrvTag');if(tagInp)s.tag=tagInp.value.trim().toUpperCase();
      const vanityInp=document.getElementById('setSrvVanity');if(vanityInp)s.vanityUrl=vanityInp.value.trim().toLowerCase().replace(/\s+/g,'-');
      Store.updateServer(s);this.renderServers();this.renderChannels();alert('Ayarlar güncellendi.');
    }
  },
  boostServer(){
    if(!this._setSrvId)return;
    Store.boostServer(this._setSrvId,this.user.id,1);
    Sounds.play('notify');
    this.setSrvTab('boost');
    this.renderServers();
  },

  async setTab(tab){
    if(Voice.isMicTesting) Voice.stopMicTest();
    document.querySelectorAll('.set-nav').forEach(el=>el.classList.remove('active'));
    const el=document.getElementById('setCont');
    if(tab==='account'){
      el.innerHTML=`<h2 style="color:var(--header-primary);font-size:20px;margin-bottom:20px">Hesabım</h2>
        <div style="background:#232428;border-radius:8px;overflow:hidden">
          <div style="height:100px;background:${this.user.banner?`url(${this.user.banner}) center/cover`:(this.user.nitro?'linear-gradient(135deg,#ff73fa,#5865f2)':this.user.avatarColor)}"></div>
          <div style="padding:16px;display:flex;gap:16px;align-items:center;margin-top:-40px">
            <div style="width:80px;height:80px;border-radius:50%;background:${this.user.avatarColor};display:flex;align-items:center;justify-content:center;font-size:32px;color:#fff;font-weight:700;border:6px solid #232428;overflow:hidden;cursor:pointer" onclick="App.changeAvatar()">
              ${this.user.avatar?`<img src="${this.user.avatar}" style="width:100%;height:100%;object-fit:cover">`:(this.user.username[0]||'?').toUpperCase()}
            </div>
            <div><div style="font-size:20px;font-weight:700;color:var(--header-primary)">${this.esc(this.user.username)}#${this.user.tag}${this.user.nitro?'<span class="nitro-badge" style="margin-left:8px">NITRO</span>':''}</div>
            <div style="color:var(--text-muted);font-size:14px;margin-top:4px">${this.esc(this.user.email)}</div></div>
          </div>
        </div>
        <div class="m-field" style="margin-top:24px"><label class="m-label">Kullanıcı Adı</label><input class="m-input" id="setUser" value="${this.esc(this.user.username)}"></div>
        <div class="m-field"><label class="m-label">Profil Fotoğrafı</label><button class="btn btn-p" onclick="App.changeAvatar()">Değiştir</button></div>
        ${Store.hasNitro(this.user.id)?`<div class="m-field"><label class="m-label">Banner</label><button class="btn btn-n" onclick="App.changeBanner()">Banner Değiştir</button></div>`:''}
        <button class="btn btn-g" onclick="App.saveAccount()" style="margin-top:8px">Kaydet</button>`;
    }else if(tab==='profile'){
      el.innerHTML=`<h2 style="color:var(--header-primary);font-size:20px;margin-bottom:20px">Profil</h2>
        <div class="m-field"><label class="m-label">Özel Durum</label><input class="m-input" id="setCustStatus" value="${this.esc(this.user.customStatus||'')}" placeholder="Durum mesajı"></div>
        <div class="m-field"><label class="m-label">Oyun Aktivitesi</label><input class="m-input" id="setActivity" value="${this.esc(this.user.activity||'')}" placeholder="Şu an oynadığın oyun"></div>
        <button class="btn btn-g" onclick="App.saveProfile()">Kaydet</button>`;
    }else if(tab==='nitro'){
      el.innerHTML=`<h2 style="background:var(--nitro-gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:24px;font-weight:700;margin-bottom:16px">Disco Nitro</h2>
        ${this.user.nitro?`<div class="nitro-card"><div class="nitro-badge">${this.user.nitro==='full'?'NITRO':'NITRO BASIC'}</div><p style="margin-top:8px;color:var(--text-muted)">Aboneliğin aktif!</p></div>`:''}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0">
          <div class="nitro-card" style="cursor:pointer" onclick="App.showNitroPurchase('basic')"><div class="nitro-badge">NITRO BASIC</div><div style="font-size:24px;font-weight:700;color:var(--header-primary);margin-top:8px">₺49.99<span style="font-size:13px;font-weight:400;color:var(--text-muted)">/ay</span></div><ul style="font-size:12px;color:var(--text-muted);margin-top:8px;padding-left:16px;list-style:none"><li>✓ Özel avatar</li><li>✓ 50MB dosya yükleme</li><li>✓ Özel emoji kullanımı</li></ul></div>
          <div class="nitro-card" style="cursor:pointer;border-color:rgba(255,115,250,.4)" onclick="App.showNitroPurchase('full')"><div class="nitro-badge">NITRO</div><div style="font-size:24px;font-weight:700;color:var(--header-primary);margin-top:8px">₺99.99<span style="font-size:13px;font-weight:400;color:var(--text-muted)">/ay</span></div><ul style="font-size:12px;color:var(--text-muted);margin-top:8px;padding-left:16px;list-style:none"><li>✓ Tüm Basic özellikleri</li><li>✓ Profil banner</li><li>✓ 500MB dosya yükleme</li><li>✓ 2x Sunucu Boost</li><li>✓ HD video & ekran paylaşımı</li><li>✓ Özel profil temaları</li></ul></div>
        </div>`;
    }else if(tab==='voice'){
      let devices=[];try{devices=await electron.getMediaDevices()}catch{}
      const inputs=devices.filter(d=>d.kind==='audioinput');
      const outputs=devices.filter(d=>d.kind==='audiooutput');
      el.innerHTML=`<h2 style="color:var(--header-primary);font-size:20px;margin-bottom:20px">Ses ve Video Ayarları</h2>
        <div style="display:flex;gap:16px;margin-bottom:24px">
          <div class="m-field" style="flex:1"><label class="m-label">Giriş Cihazı</label>
            <select class="m-input" id="setInput" onchange="Voice.setInputDevice(this.value)">
              <option value="default">Varsayılan</option>
              ${inputs.map(d=>`<option value="${d.deviceId}">${d.label||'Mikrofon'}</option>`).join('')}
            </select></div>
          <div class="m-field" style="flex:1"><label class="m-label">Çıkış Cihazı</label>
            <select class="m-input" id="setOutput" onchange="Voice.setOutputDevice(this.value)">
              <option value="default">Varsayılan</option>
              ${outputs.map(d=>`<option value="${d.deviceId}">${d.label||'Hoparlör'}</option>`).join('')}
            </select></div>
        </div>
        <h3 style="color:var(--header-primary);font-size:16px;margin-bottom:12px;margin-top:24px">Mikrofon Testi</h3>
        <p style="color:var(--text-muted);font-size:14px;margin-bottom:16px">Sesinin iyi gelip gelmediğini kontrol et.</p>
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;background:var(--bg-secondary);padding:16px;border-radius:8px">
          <button class="btn btn-p" id="micTestBtn" onclick="Voice.toggleMicTest()">Testi Başlat</button>
          <div style="flex:1;height:24px;background:var(--bg-tertiary);border-radius:4px;overflow:hidden;position:relative">
            <div id="micTestBar" style="width:0%;height:100%;background:var(--brand);transition:width 0.1s"></div>
          </div>
        </div>
        <div style="display:flex;gap:16px;margin-bottom:24px">
          <div class="m-field" style="flex:1"><label class="m-label">Giriş Hassasiyeti (Input Sensitivity)</label><input type="range" class="m-input" style="width:100%" value="50"></div>
          <div class="m-field" style="flex:1"><label class="m-label">Çıkış Sesi</label><input type="range" class="m-input" style="width:100%" value="100"></div>
        </div>
        <h3 style="color:var(--header-primary);font-size:16px;margin-bottom:12px;margin-top:24px">Gelişmiş Ses İşleme</h3>
        <label style="display:flex;align-items:center;gap:8px;color:var(--text-normal);margin-bottom:8px"><input type="checkbox" checked> Gürültü Engelleme (Noise suppression)</label>
        <label style="display:flex;align-items:center;gap:8px;color:var(--text-normal);margin-bottom:8px"><input type="checkbox" checked> Yankı Giderme (Echo cancellation)</label>
        <div style="margin-top:24px">
          <h3 style="color:var(--header-primary);font-size:16px;margin-bottom:12px">Kamera (Video)</h3>
          <div class="m-field"><label class="m-label">Kamera Seçimi</label><select class="m-input"><option>Varsayılan Web Kamerası</option></select></div>
          <button class="btn btn-s" onclick="alert('Kamera testi başlatılıyor...')">Test Video</button>
        </div>`;
    }else if(tab==='privacy'){
      el.innerHTML=`<h2 style="color:var(--header-primary);font-size:20px;margin-bottom:20px">Gizlilik & Güvenlik</h2>
        <div style="background:#232428;padding:16px;border-radius:8px;margin-bottom:16px">
          <div style="font-weight:600;color:var(--header-primary);margin-bottom:8px">Güvenli Direkt Mesajlaşma</div>
          <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">Spam mesajları otomatik filtrele</p>
          <label style="display:block;margin-bottom:8px"><input type="radio" name="dmFilter" checked> Beni güvende tut (Tarama açık)</label>
          <label style="display:block;margin-bottom:8px"><input type="radio" name="dmFilter"> Sadece arkadaşlarım dışındakileri tara</label>
          <label style="display:block"><input type="radio" name="dmFilter"> Tarama yapma</label>
        </div>
        <h3 style="color:var(--header-primary);font-size:16px;margin-bottom:12px">Sunucu Gizliliği</h3>
        <label style="display:flex;align-items:center;gap:8px;color:var(--text-normal);margin-bottom:8px"><input type="checkbox" checked> Sunucu üyelerinden direkt mesajlara izin ver</label>
        <h3 style="color:var(--header-primary);font-size:16px;margin-bottom:12px;margin-top:24px">İki Faktörlü Doğrulama (2FA)</h3>
        <button class="btn btn-p" onclick="alert('2FA kurulumu başlatılıyor')">İki Faktörlü Doğrulamayı Etkinleştir</button>`;
    }else if(tab==='appearance'){
      el.innerHTML=`<h2 style="color:var(--header-primary);font-size:20px;margin-bottom:20px">Görünüm</h2>
        <h3 style="color:var(--header-primary);font-size:16px;margin-bottom:12px">Tema</h3>
        <div style="display:flex;gap:12px">
          <div style="background:#313338;padding:12px;border-radius:8px;border:2px solid var(--brand);cursor:pointer;flex:1;text-align:center;color:#fff">Karanlık (Dark)</div>
          <div style="background:#ffffff;padding:12px;border-radius:8px;border:2px solid transparent;cursor:pointer;flex:1;text-align:center;color:#313338" onclick="alert('Light tema yakında!')">Aydınlık (Light)</div>
        </div>`;
    }else if(tab==='resources'){
      el.innerHTML=`<h2 style="color:var(--header-primary);font-size:20px;margin-bottom:20px">P2P Kaynak Paylaşımı</h2>
        <div style="background:#232428;border-radius:8px;padding:16px">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
            <div style="width:48px;height:48px;border-radius:50%;background:var(--brand);display:flex;align-items:center;justify-content:center;font-size:24px">⚡</div>
            <div><div style="font-weight:600;color:var(--header-primary)">Kaynak Paylaşımı Aktif</div><div style="color:var(--text-muted);font-size:13px">CPU ve ağ kaynakları P2P ağına katkıda bulunuyor</div></div>
          </div>
          <div class="res-row" style="font-size:13px;margin:8px 0"><span style="width:50px">CPU</span><div class="res-fill" style="height:8px"><div style="width:${this._cpu}%;background:var(--brand)"></div></div><span style="width:40px;text-align:right">${this._cpu}%</span></div>
          <div class="res-row" style="font-size:13px;margin:8px 0"><span style="width:50px">Ağ</span><div class="res-fill" style="height:8px"><div style="width:${this._net}%;background:var(--green)"></div></div><span style="width:40px;text-align:right">${this._net}%</span></div>
        </div>`;
    }else if(tab==='admin'){
      el.innerHTML=`<h2 style="color:var(--red);font-size:20px;margin-bottom:20px">Admin Panel</h2>
        <div class="admin-panel"><h3>👑 Admin İşlemleri</h3>
          <div class="admin-row"><input class="m-input" id="admUserId" placeholder="Kullanıcı ID veya Kullanıcı#tag"><button class="btn btn-p" onclick="App.adminGiveAdmin()">Admin Ver</button></div>
          <div class="admin-row"><input class="m-input" id="admNitroId" placeholder="Kullanıcı ID veya Kullanıcı#tag"><select class="m-input" id="admNitroType" style="width:120px"><option value="basic">Basic</option><option value="full">Full</option></select><button class="btn btn-n" onclick="App.adminGiveNitro()">Nitro Ver</button></div>
        </div>
        <div class="admin-panel"><h3>${this.ic.boost} Sunucu Boost</h3>
          <div class="admin-row"><input class="m-input" id="admBoostSrv" placeholder="Sunucu davet kodu veya ID"><input class="m-input" id="admBoostCount" type="number" value="1" min="1" style="width:80px"><button class="btn btn-n" onclick="App.adminBoost()">Boost</button></div>
        </div>
        <div class="admin-panel"><h3>✓ Sunucu Doğrulama</h3>
          <div class="admin-row"><input class="m-input" id="admVerifySrv" placeholder="Sunucu davet kodu veya ID"><button class="btn btn-g" onclick="App.adminVerify()">Doğrula</button></div>
        </div>
        <div class="admin-panel"><h3>📊 İstatistikler</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:8px">
            <div style="text-align:center"><div style="font-size:24px;font-weight:700;color:var(--header-primary)">${Store.getUsers().length}</div><div style="font-size:12px;color:var(--text-muted)">Kullanıcı</div></div>
            <div style="text-align:center"><div style="font-size:24px;font-weight:700;color:var(--header-primary)">${Store.getServers().length}</div><div style="font-size:12px;color:var(--text-muted)">Sunucu</div></div>
            <div style="text-align:center"><div style="font-size:24px;font-weight:700;color:var(--header-primary)">${(Store._g('d_msgs')||[]).length}</div><div style="font-size:12px;color:var(--text-muted)">Mesaj</div></div>
          </div>
        </div>`;
    }
  },

  _findUser(input){
    if(input.includes('#')){const[n,t]=input.split('#');return Store.getUsers().find(u=>u.username===n&&u.tag===t)}
    return Store.getUserById(input)||Store.getUsers().find(u=>u.username===input);
  },
  _findServer(input){return Store.getServerById(input)||Store.getServers().find(s=>s.inviteCode===input.toUpperCase()||s.customInvite===input.toLowerCase())},

  adminGiveAdmin(){const u=this._findUser(document.getElementById('admUserId').value.trim());if(!u)return alert('Kullanıcı bulunamadı');Store.setAdmin(u.id,true);alert(`${u.username} admin yapıldı!`)},
  adminGiveNitro(){const u=this._findUser(document.getElementById('admNitroId').value.trim());if(!u)return alert('Kullanıcı bulunamadı');const t=document.getElementById('admNitroType').value;Store.giveNitro(u.id,t,1);alert(`${u.username} kullanıcısına ${t} Nitro verildi!`)},
  adminBoost(){const s=this._findServer(document.getElementById('admBoostSrv').value.trim());if(!s)return alert('Sunucu bulunamadı');const c=parseInt(document.getElementById('admBoostCount').value)||1;Store.boostServer(s.id,this.user.id,c);alert(`${s.name} sunucusuna ${c} boost basıldı! Toplam: ${s.boostCount+c}`)},
  adminVerify(){const s=this._findServer(document.getElementById('admVerifySrv').value.trim());if(!s)return alert('Sunucu bulunamadı');s.isVerified=true;s.isCommunity=true;Store.updateServer(s);alert(`${s.name} doğrulandı ve keşfete eklendi!`);this.renderServers()},

  saveAccount(){const n=document.getElementById('setUser')?.value.trim();if(n)this.user.username=n;Store.updateUser(this.user);this.renderUserPanel();this.renderServers()},
  saveProfile(){this.user.customStatus=document.getElementById('setCustStatus')?.value||'';this.user.activity=document.getElementById('setActivity')?.value||'';Store.updateUser(this.user);this.renderUserPanel()},
  async changeAvatar(){const img=await electron.openImageDialog();if(img){this.user.avatar=img;Store.updateUser(this.user);this.renderUserPanel();this.openSettings()}},
  async changeBanner(){const img=await electron.openImageDialog();if(img){this.user.banner=img;Store.updateUser(this.user);this.openSettings()}},
  doLogout(){Store.logout();electron.navigate('login.html')},
  toggleMembers(){const m=document.getElementById('memList');m.style.display=m.style.display==='none'?'flex':'none';if(m.style.display==='flex')this.renderMembers()},
  searchMsgs(q){document.querySelectorAll('.msg').forEach(el=>{const c=el.querySelector('.m-body')?.textContent?.toLowerCase()||'';el.style.display=!q.trim()||c.includes(q.toLowerCase())?'':'none'})},

  // Context Menus
  showProfile(e,uid){
    e.stopPropagation();
    let p=document.getElementById('profilePop');
    if(!p){p=document.createElement('div');p.id='profilePop';p.className='profile-pop';document.body.appendChild(p)}
    const u=Store.getUserById(uid);if(!u)return;
    const isOwn=uid===this.user.id;
    p.innerHTML=`
      <div class="pp-banner" style="background:${u.banner?`url(${u.banner}) center/cover`:(u.nitro?'linear-gradient(135deg,#ff73fa,#5865f2)':u.avatarColor)}"></div>
      <div class="pp-header">
        <div class="pp-av" style="background:${u.avatarColor}">${u.avatar?`<img src="${u.avatar}">`:(u.username[0]||'?').toUpperCase()}<div class="status-dot s-${u.status||'offline'}"></div></div>
        ${!isOwn?`<button class="btn btn-p pp-msg" onclick="App.openDM('${uid}');document.getElementById('profilePop').classList.remove('show')">Mesaj</button>`:''}
      </div>
      <div class="pp-body">
        <div class="pp-name">${this.esc(u.username)}${u.tag!=='0000'?`#${u.tag}`:''} ${u.isAdmin?'<span class="admin-badge">STAFF</span>':''}${u.nitro?'<span class="nitro-badge" style="margin-left:4px">NITRO</span>':''}</div>
        <div class="pp-since">Disco üyesi • ${new Date(u.createdAt).toLocaleDateString('tr-TR')}</div>
        ${u.activity?`<div class="pp-act"><strong>Oynuyor</strong><br>${this.esc(u.activity)}</div>`:''}
        ${u.customStatus?`<div class="pp-act">${this.esc(u.customStatus)}</div>`:''}
      </div>
    `;
    p.style.top=Math.min(e.clientY,window.innerHeight-350)+'px';
    p.style.left=Math.min(e.clientX+15,window.innerWidth-300)+'px';
    p.classList.add('show');
    
    const clickOut=(ev)=>{if(!p.contains(ev.target)){p.classList.remove('show');document.removeEventListener('click',clickOut)}};
    setTimeout(()=>document.addEventListener('click',clickOut),10);
  },
  initCtx(){document.addEventListener('click',()=>document.getElementById('ctxMenu').classList.remove('show'))},
  showCtx(e,items){
    e.preventDefault();const m=document.getElementById('ctxMenu');
    m.innerHTML=items.map(i=>i==='sep'?'<div class="ctx-sep"></div>':`<div class="ctx-item ${i.d?'danger':''}" onclick="${i.a}">${i.l}</div>`).join('');
    m.style.left=Math.min(e.clientX,window.innerWidth-200)+'px';m.style.top=Math.min(e.clientY,window.innerHeight-items.length*30)+'px';m.classList.add('show');
  },
  srvCtx(e,id){
    const s=Store.getServerById(id);if(!s)return;
    const items=[{l:'📨 Davet Oluştur',a:`App.showInvite('${id}')`},{l:`${this.ic.boost} Boost Bas`,a:`App.showBoost('${id}')`},'sep'];
    if(s.ownerId===this.user.id||Store.isAdmin(this.user.id)){
      items.push({l:'⚙️ Sunucu Ayarları',a:`App.openSrvSettings('${id}')`});
      items.push({l:'🗑️ Sunucuyu Sil',a:`App.delServer('${id}')`,d:1});
    }
    else items.push({l:'🚪 Sunucudan Ayrıl',a:`App.leaveSrv('${id}')`,d:1});
    this.showCtx(e,items);
  },
  srvMenu(e){
    if(!this.curSrv)return;
    this.showCtx(e,[
      {l:'📨 Davet Oluştur',a:`App.showInvite('${this.curSrv.id}')`},
      {l:'⚙️ Sunucu Ayarları',a:`App.openSrvSettings('${this.curSrv.id}')`},
      {l:'📁 Kategori Ekle',a:'App.addCat()'},
      {l:'🔗 Sunucuya Katıl',a:`App.showModal('joinSrv')`},
      {l:`${this.ic.boost} Boost Bas`,a:`App.showBoost('${this.curSrv.id}')`}
    ]);
  },
  catCtx(e,catId){
    if(!this.curSrv)return;
    this.showCtx(e,[
      {l:'# Yazı Kanalı Oluştur',a:`App.selCatId='${catId}';App.newChType='text';App.quickCh()`},
      {l:'🔊 Ses Kanalı Oluştur',a:`App.selCatId='${catId}';App.newChType='voice';App.quickCh()`},
      'sep',
      {l:'🗑️ Kategoriyi Sil',a:`App.delCat('${catId}')`,d:1}
    ]);
  },
  quickCh(){const n=prompt((this.newChType==='text'?'Yazı':'Ses')+' kanalı adı:');if(n?.trim()){Store.addChannel(this.curSrv.id,this.selCatId,n.trim().toLowerCase().replace(/\s+/g,'-'),this.newChType);this.curSrv=Store.getServerById(this.curSrv.id);this.renderChannels()}},
  chCtx(e,chId){
    if(!this.curSrv)return;
    const isOwner=this.curSrv.ownerId===this.user.id||Store.isAdmin(this.user.id);
    const items=[];if(isOwner)items.push({l:'🗑️ Kanalı Sil',a:`App.delCh('${chId}')`,d:1});
    if(items.length)this.showCtx(e,items);
  },
  memCtx(e,uid){
    if(uid===this.user.id)return;
    this.showCtx(e,[
      {l:'💬 Mesaj Gönder',a:`App.openDM('${uid}')`},
      {l:'👤 Arkadaş Ekle',a:`App.addFriById('${uid}')`},'sep',
      {l:'🚫 Engelle',a:`App.blockUsr('${uid}')`,d:1}
    ]);
  },
  // Friends
  sendFriendReq(){
    const t=document.getElementById('addFriInp')?.value.trim();
    if(!t){this.showFriErr('Lütfen bir kullanıcı adı girin');return}
    if(!t.includes('#')){this.showFriErr('Geçersiz format (Örn: isim#1234)');return}
    const res=Store.sendFriendReq(this.user.id,t);
    if(res.error)this.showFriErr(res.error);
    else{
      document.getElementById('addFriInp').value='';
      const ok=document.getElementById('friOk');
      const err=document.getElementById('friErr');
      if(err)err.style.display='none';
      if(ok){ok.textContent='Arkadaşlık isteği başarıyla gönderildi!';ok.style.display='block';setTimeout(()=>ok.style.display='none',3000)}
      if(this.curView==='home')this.renderFriends();
    }
  },
  showFriErr(msg){
    const el=document.getElementById('friErr');
    if(el){el.textContent=msg;el.style.display='block';}else alert(msg);
  },
  acceptFri(id){Store.acceptFriend(id);this.renderFriends()},
  msgCtx(e,msgId,isOwn){
    const items=[{l:'📋 Metni Kopyala',a:`App.copyMsg('${msgId}')`},{l:'↩ Yanıtla',a:`App.setReply('${msgId}')`}];
    if(isOwn){items.push('sep',{l:'✏ Düzenle',a:`App.editMsg('${msgId}')`},{l:'🗑️ Sil',a:`App.delMsg('${msgId}')`,d:1});}
    this.showCtx(e,items);
  },
  copyMsg(id){const msgs=[...(Store._g('d_msgs')||[]),...(Store._g('d_dms')||[])];const m=msgs.find(x=>x.id===id);if(m)navigator.clipboard.writeText(m.content)},
  addFriById(uid){const t=Store.getUserById(uid);if(t)Store.sendFriendReq(this.user.id,`${t.username}#${t.tag}`)},
  blockUsr(uid){Store.blockUser(this.user.id,uid)},
  delServer(id){Store.deleteServer(id);this.renderServers();this.goHome()},
  leaveSrv(id){Store.leaveServer(id,this.user.id);this.renderServers();this.goHome()},
  delCh(id){Store.deleteChannel(this.curSrv.id,id);this.curSrv=Store.getServerById(this.curSrv.id);this.renderChannels();const f=this.firstTextCh();if(f)this.selectCh(f.id)},
  delCat(id){Store.deleteCategory(this.curSrv.id,id);this.curSrv=Store.getServerById(this.curSrv.id);this.renderChannels()},
  addCat(){const n=prompt('Kategori adı:');if(n?.trim()&&this.curSrv){Store.addCategory(this.curSrv.id,n.trim());this.curSrv=Store.getServerById(this.curSrv.id);this.renderChannels()}},

  // Drag & Drop
  initDrop(){
    let dc=0;
    document.addEventListener('dragenter',e=>{e.preventDefault();dc++;document.getElementById('dropOver').classList.add('show')});
    document.addEventListener('dragleave',()=>{dc--;if(dc<=0){dc=0;document.getElementById('dropOver').classList.remove('show')}});
    document.addEventListener('dragover',e=>e.preventDefault());
    document.addEventListener('drop',e=>{
      e.preventDefault();dc=0;document.getElementById('dropOver').classList.remove('show');
      Array.from(e.dataTransfer.files).forEach(file=>{
        const reader=new FileReader();
        reader.onload=()=>{
          const b64=reader.result.split(',')[1];const ext='.'+file.name.split('.').pop().toLowerCase();
          const att={name:file.name,size:file.size,data:b64,ext};
          if(this.curCh){const t=['.png','.jpg','.jpeg','.gif','.webp'].includes(ext)?'image':'text';Store.sendMessage(this.curCh.id,this.curSrv.id,this.user.id,t==='image'?'':file.name,t,[att]);this.renderMessages()}
          else if(this.curDM){Store.sendDM(this.curDM.id,this.user.id,file.name,'text',[att]);this.renderDMMessages()}
        };reader.readAsDataURL(file);
      });
    });
  },

  // Resource Worker
  initWorker(){
    try{
      const w=new Worker('js/resourceWorker.js');w.postMessage({type:'start'});
      w.onmessage=e=>{
        if(e.data.type==='resource-update'){
          this._cpu=parseFloat(e.data.cpu);this._net=parseFloat(e.data.network);
          const cb=document.getElementById('cpuBar'),nb=document.getElementById('netBar'),cv=document.getElementById('cpuVal'),nv=document.getElementById('netVal');
          if(cb)cb.style.width=e.data.cpu+'%';if(nb)nb.style.width=e.data.network+'%';
          if(cv)cv.textContent=e.data.cpu+'%';if(nv)nv.textContent=e.data.network+'%';
        }
      };
      this._resourceWorker=w;
    }catch(e){console.error('Worker error:',e)}
  },
  setActivity(activity){
    if(this._resourceWorker){
      this._resourceWorker.postMessage({type:'setActivity',activity:activity});
    }
  },

  // Polling
  lastMsgCount:0,
  startPoll(){
    this.pollTimer=setInterval(()=>{
      if(this.curView==='channel'&&this.curCh){
        const count=Store.getMessages(this.curCh.id).length;
        if(count!==this.lastMsgCount){this.lastMsgCount=count;this.renderMessages()}
      }else if(this.curView==='dm'&&this.curDM){
        const count=Store.getDMMessages(this.curDM.id).length;
        if(count!==this.lastMsgCount){this.lastMsgCount=count;this.renderDMMessages()}
      }
    },2000);
  }
};

window.addEventListener('DOMContentLoaded',()=>App.init());

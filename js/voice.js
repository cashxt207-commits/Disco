let localStream=null,screenStream=null,isMuted=false,isDeafened=false,isScreenSharing=false,isCameraOn=false,currentVC=null;
let inputDeviceId='default',outputDeviceId='default';
let audioCtx=null, analyser=null, vadInterval=null, isSpeaking=false;
let peer=null, calls={};

const Voice={
  micTestStream: null,
  micTestInterval: null,
  isMicTesting: false,
  isNoiseSuppressed: true,

  async toggleMicTest(){
    if(this.isMicTesting){this.stopMicTest();return;}
    try{
      const constraints={
        audio: {
          noiseSuppression: this.isNoiseSuppressed,
          echoCancellation: true,
          autoGainControl: true,
          ...(inputDeviceId&&inputDeviceId!=='default'?{deviceId:{exact:inputDeviceId}}:{})
        }
      };
      this.micTestStream=await navigator.mediaDevices.getUserMedia(constraints);
      this.isMicTesting=true;
      
      const btn=document.getElementById('micTestBtn');
      if(btn){btn.textContent='Testi Durdur';btn.classList.replace('btn-p','btn-d');}

      if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();
      const source=audioCtx.createMediaStreamSource(this.micTestStream);
      const testAnalyser=audioCtx.createAnalyser();
      testAnalyser.fftSize=256;
      source.connect(testAnalyser);
      
      const gain=audioCtx.createGain();
      gain.gain.value=0.8;
      testAnalyser.connect(gain);
      gain.connect(audioCtx.destination);
      
      const dataArray=new Uint8Array(testAnalyser.frequencyBinCount);
      const bar=document.getElementById('micTestBar');
      
      this.micTestInterval=setInterval(()=>{
        if(this.isMicTesting&&bar){
          testAnalyser.getByteFrequencyData(dataArray);
          let sum=0;for(let i=0;i<dataArray.length;i++)sum+=dataArray[i];
          let avg=sum/dataArray.length;
          let percent=Math.min(100,Math.max(0,(avg/100)*100));
          bar.style.width=percent+'%';
          if(percent>5)bar.style.background='var(--green)';else bar.style.background='var(--brand)';
        }
      },50);
    }catch(e){console.warn("Mic test hatası",e);alert("Mikrofonuna erişilemedi.");}
  },
  stopMicTest(){
    this.isMicTesting=false;
    if(this.micTestInterval){clearInterval(this.micTestInterval);this.micTestInterval=null;}
    if(this.micTestStream){this.micTestStream.getTracks().forEach(t=>t.stop());this.micTestStream=null;}
    const btn=document.getElementById('micTestBtn');
    if(btn){btn.textContent='Testi Başlat';btn.classList.replace('btn-d','btn-p');}
    const bar=document.getElementById('micTestBar');
    if(bar){bar.style.width='0%';bar.style.background='var(--brand)';}
  },

  initPeer(){
    if(peer)return;
    const uid=Store.getCurrentUser().id;
    peer=new Peer('disco-'+uid, {debug:1});
    peer.on('call', call=>{
      const combined = new MediaStream();
      if(localStream) localStream.getTracks().forEach(t=>combined.addTrack(t));
      if(screenStream) screenStream.getTracks().forEach(t=>combined.addTrack(t));
      call.answer(combined);
      call.on('stream', rs=>this.addRemoteStream(call.peer, rs));
      call.on('close', ()=>this.removeRemoteStream(call.peer));
      calls[call.peer]=call;
    });
    peer.on('error', err=>console.warn('Peer Error:', err));
  },
  addRemoteStream(peerId, stream){
    let c=document.getElementById('remoteAudioContainer');
    if(!c){
      c=document.createElement('div');c.id='remoteAudioContainer';
      c.style.display='flex';c.style.gap='16px';c.style.padding='16px';
      c.style.overflowX='auto';c.style.background='var(--bg-tertiary)';
      c.style.borderBottom='1px solid rgba(0,0,0,0.1)';
      const main = document.getElementById('main');
      if(main) main.prepend(c); else document.body.appendChild(c);
    }
    const hasVideo = stream.getVideoTracks().length > 0;
    let elId = 'media-'+peerId;
    let el = document.getElementById(elId);
    
    if(!el){
      el=document.createElement(hasVideo ? 'video' : 'audio');
      el.id=elId; el.autoplay=true;
      if(hasVideo){ el.style.width='400px'; el.style.borderRadius='12px'; el.style.background='#000'; el.style.boxShadow='0 8px 24px rgba(0,0,0,0.3)'; }
      c.appendChild(el);
    } else {
      if(hasVideo && el.tagName.toLowerCase()==='audio'){
        el.remove(); el=document.createElement('video'); el.id=elId; el.autoplay=true;
        el.style.width='400px'; el.style.borderRadius='12px'; el.style.background='#000'; el.style.boxShadow='0 8px 24px rgba(0,0,0,0.3)';
        c.appendChild(el);
      } else if(!hasVideo && el.tagName.toLowerCase()==='video'){
        el.remove(); el=document.createElement('audio'); el.id=elId; el.autoplay=true;
        c.appendChild(el);
      }
    }
    el.srcObject=stream;
  },
  removeRemoteStream(peerId){
    const el=document.getElementById('media-'+peerId);
    if(el){el.srcObject=null;el.remove();}
    if(calls[peerId]){calls[peerId].close();delete calls[peerId];}
    const c=document.getElementById('remoteAudioContainer');
    if(c && c.childElementCount===0) c.remove();
  },
  async join(srvId,chId){
    try{
      const constraints={
        audio: {
          noiseSuppression: this.isNoiseSuppressed,
          echoCancellation: true,
          autoGainControl: true,
          ...(inputDeviceId&&inputDeviceId!=='default'?{deviceId:{exact:inputDeviceId}}:{})
        },
        video: isCameraOn
      };
      localStream=await navigator.mediaDevices.getUserMedia(constraints);
      currentVC={serverId:srvId,channelId:chId};
      Store.joinVoice(srvId,chId,Store.getCurrentUser().id);
      
      if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();
      const source=audioCtx.createMediaStreamSource(localStream);
      analyser=audioCtx.createAnalyser();
      analyser.fftSize=512;
      source.connect(analyser);
      const dataArray=new Uint8Array(analyser.frequencyBinCount);
      vadInterval=setInterval(()=>{
        if(!isMuted&&localStream){
          analyser.getByteFrequencyData(dataArray);
          let sum=0;for(let i=0;i<dataArray.length;i++)sum+=dataArray[i];
          const avg=sum/dataArray.length;
          const spk=avg>5;
          if(isSpeaking!==spk){
            isSpeaking=spk;
            if(typeof App!=='undefined')App.updateVoiceActivity(Store.getCurrentUser().id,spk);
          }
        }else if(isSpeaking){
          isSpeaking=false;
          if(typeof App!=='undefined')App.updateVoiceActivity(Store.getCurrentUser().id,false);
        }
      },100);

      this.initPeer();
      const doCalls=()=>{
        const srv=Store.getServerById(srvId);
        let ch=null;
        srv.categories.forEach(cat=>{const c=cat.channels.find(x=>x.id===chId);if(c)ch=c;});
        if(ch&&ch.connectedUsers){
          ch.connectedUsers.forEach(uid=>{
            if(uid!==Store.getCurrentUser().id){
              const pid='disco-'+uid;
              if(!calls[pid]){
                const call=peer.call(pid, localStream);
                if(call){
                  call.on('stream', rs=>this.addRemoteStream(pid, rs));
                  call.on('close', ()=>this.removeRemoteStream(pid));
                  calls[pid]=call;
                }
              }
            }
          });
        }
      };
      if(peer.open)doCalls();else peer.on('open', doCalls);

      Sounds.play('join');
      this.updateUI();return true;
    }catch(e){
      currentVC={serverId:srvId,channelId:chId};
      Store.joinVoice(srvId,chId,Store.getCurrentUser().id);
      isMuted=true;isCameraOn=false;Sounds.play('join');this.updateUI();return true;
    }
  },
  leave(){
    if(vadInterval){clearInterval(vadInterval);vadInterval=null;}
    if(isSpeaking){isSpeaking=false;if(typeof App!=='undefined')App.updateVoiceActivity(Store.getCurrentUser().id,false);}
    Object.keys(calls).forEach(pid=>this.removeRemoteStream(pid));
    if(localStream){localStream.getTracks().forEach(t=>t.stop());localStream=null}
    if(screenStream){screenStream.getTracks().forEach(t=>t.stop());screenStream=null}
    Store.leaveVoice(Store.getCurrentUser().id);
    Sounds.play('leave');
    currentVC=null;isMuted=false;isDeafened=false;isScreenSharing=false;isCameraOn=false;
    this.updateUI();
  },
  toggleMute(){
    isMuted=!isMuted;
    if(localStream)localStream.getAudioTracks().forEach(t=>{t.enabled=!isMuted});
    Sounds.play(isMuted?'mute':'unmute');
    this.updateUI();
  },
  toggleDeafen(){
    isDeafened=!isDeafened;
    if(isDeafened){isMuted=true;if(localStream)localStream.getAudioTracks().forEach(t=>{t.enabled=false})}
    else{isMuted=false;if(localStream)localStream.getAudioTracks().forEach(t=>{t.enabled=true})}
    Sounds.play('deafen');this.updateUI();
  },
  async toggleCamera(){
    isCameraOn=!isCameraOn;
    if(!currentVC){this.updateUI();return;}
    if(isCameraOn){
      try{
        const stream=await navigator.mediaDevices.getUserMedia({video:true});
        if(localStream)stream.getVideoTracks().forEach(t=>localStream.addTrack(t));
        else localStream=stream;
      }catch(e){console.warn('Kamera açılamadı',e);isCameraOn=false;}
    }else{
      if(localStream){localStream.getVideoTracks().forEach(t=>{t.stop();localStream.removeTrack(t)});}
    }
    this.updateUI();
  },
  async toggleScreen(){
    if(isScreenSharing){
      if(screenStream){screenStream.getTracks().forEach(t=>t.stop());screenStream=null}
      isScreenSharing=false;
      this.reconnectAll();
      if(typeof App!=='undefined')App.setActivity('voice');
    }else{
      try{
        screenStream=await navigator.mediaDevices.getDisplayMedia({video:true,audio:true});
        isScreenSharing=true;
        screenStream.getVideoTracks()[0].onended=()=>{this.toggleScreen()};
        this.reconnectAll();
        if(typeof App!=='undefined')App.setActivity('screen_share');
      }catch(e){
        console.warn('Ekran paylaşımı simüle ediliyor (hata/izin)',e);
        isScreenSharing=false;
      }
    }
    this.updateUI();
  },
  
  reconnectAll(){
    if(!currentVC)return;
    Object.keys(calls).forEach(pid=>this.removeRemoteStream(pid));
    const srv=Store.getServerById(currentVC.serverId);
    let ch=null;
    srv.categories.forEach(cat=>{const c=cat.channels.find(x=>x.id===currentVC.channelId);if(c)ch=c;});
    if(ch&&ch.connectedUsers){
      const combined = new MediaStream();
      if(localStream) localStream.getTracks().forEach(t=>combined.addTrack(t));
      if(screenStream) screenStream.getTracks().forEach(t=>combined.addTrack(t));
      ch.connectedUsers.forEach(uid=>{
        if(uid!==Store.getCurrentUser().id){
          const pid='disco-'+uid;
          const call=peer.call(pid, combined);
          if(call){
            call.on('stream', rs=>this.addRemoteStream(pid, rs));
            call.on('close', ()=>this.removeRemoteStream(pid));
            calls[pid]=call;
          }
        }
      });
    }
  },
  
  toggleNoiseSuppression(){
    this.isNoiseSuppressed = !this.isNoiseSuppressed;
    const apply = (stream) => {
      if(stream) stream.getAudioTracks().forEach(t=>{
        t.applyConstraints({noiseSuppression: this.isNoiseSuppressed, echoCancellation: true, autoGainControl: true});
      });
    };
    apply(localStream);
    apply(this.micTestStream);
    this.updateUI();
  },
  setInputDevice(id){inputDeviceId=id},
  setOutputDevice(id){outputDeviceId=id},
  updateUI(){if(typeof App!=='undefined'){App.renderVoicePanel();App.renderChannels();App.renderUserPanel()}},
  state(){return{isMuted,isDeafened,isScreenSharing,isCameraOn,currentVC,isNoiseSuppressed:this.isNoiseSuppressed}}
};

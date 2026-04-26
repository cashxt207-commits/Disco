const Sounds = {
  ctx: null,
  getCtx() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); return this.ctx; },

  play(type) {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = 0.15;
    const now = ctx.currentTime;

    switch(type) {
      case 'join':
        osc.type='sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.1);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now); osc.stop(now + 0.25); break;
      case 'leave':
        osc.type='sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now); osc.stop(now + 0.25); break;
      case 'message':
        osc.type='sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now); osc.stop(now + 0.15); break;
      case 'mute':
        osc.type='triangle'; osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(250, now + 0.1);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now); osc.stop(now + 0.15); break;
      case 'unmute':
        osc.type='triangle'; osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.1);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now); osc.stop(now + 0.15); break;
      case 'deafen':
        osc.type='triangle'; osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(250, now + 0.15);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.15, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now); osc.stop(now + 0.2); break;
      case 'notify':
        osc.type='sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
        gain.gain.setValueAtTime(0.2, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now); osc.stop(now + 0.25); break;
      case 'call':
        osc.type='sine';gain.gain.value=0.1;
        osc.frequency.setValueAtTime(440,now);osc.frequency.setValueAtTime(580,now+0.2);
        osc.frequency.setValueAtTime(440,now+0.4);osc.frequency.setValueAtTime(580,now+0.6);
        gain.gain.linearRampToValueAtTime(0,now+0.8);
        osc.start(now);osc.stop(now+0.8);break;
    }
  }
};

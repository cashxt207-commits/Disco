// P2P Resource Worker - Simulates decentralized resource usage
// Activity-based resource consumption:
// - Idle: minimal resources (CPU: 3%, Network: 1%, RAM: 50MB)
// - Messaging: low resources (CPU: 5%, Network: 3%, RAM: 80MB)  
// - Gaming: high resources (CPU: 15%, Network: 8%, RAM: 200MB)
// - Voice chat: medium-high resources (CPU: 10%, Network: 6%, RAM: 150MB)

let currentActivity = 'idle';
let targetCpu = 3;
let targetNet = 1;
let targetRam = 50;
let currentCpu = 3;
let currentNet = 1;
let currentRam = 50;

const activityProfiles = {
  idle: { cpu: 3, net: 1, ram: 50 },
  messaging: { cpu: 5, net: 3, ram: 80 },
  gaming: { cpu: 15, net: 8, ram: 200 },
  voice: { cpu: 10, net: 6, ram: 150 },
  screen_share: { cpu: 25, net: 15, ram: 400 }
};

function setActivity(activity) {
  if (activityProfiles[activity]) {
    currentActivity = activity;
    targetCpu = activityProfiles[activity].cpu;
    targetNet = activityProfiles[activity].net;
    targetRam = activityProfiles[activity].ram;
  }
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}

self.onmessage = function(e) {
  if (e.data.type === 'start') {
    setInterval(() => {
      // Smooth transition to target values
      const t = 0.1; // transition speed
      currentCpu = lerp(currentCpu, targetCpu + (Math.random() * 2 - 1), t);
      currentNet = lerp(currentNet, targetNet + (Math.random() * 1 - 0.5), t);
      currentRam = lerp(currentRam, targetRam + (Math.random() * 20 - 10), t);
      
      self.postMessage({
        type: 'resource-update',
        cpu: currentCpu.toFixed(1),
        network: currentNet.toFixed(1),
        ram: currentRam.toFixed(0),
        activity: currentActivity
      });
    }, 2000);
  } else if (e.data.type === 'setActivity') {
    setActivity(e.data.activity);
  }
};

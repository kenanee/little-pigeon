export class GameAudio{
  constructor(){
    this.context=null;this.master=null;this.ambience=null;
    this.enabled=false;this.nextChord=0;this.chordIndex=0;
    this.chords=[
      [146.83,174.61,220.00,261.63],
      [130.81,164.81,196.00,246.94],
      [110.00,146.83,174.61,220.00],
      [123.47,155.56,185.00,233.08]
    ];
  }

  async toggle(){
    if(!this.context){
      const AudioCtx=window.AudioContext||window.webkitAudioContext;
      if(!AudioCtx)return false;
      this.context=new AudioCtx();
      this.master=this.context.createGain();
      this.master.gain.value=0.28;
      this.master.connect(this.context.destination);
      this.createCityAmbience();
    }
    if(this.context.state==='suspended')await this.context.resume();
    this.enabled=!this.enabled;
    const now=this.context.currentTime;
    if(this.enabled){
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(.28,now,.28);
      this.nextChord=now+.08;
    }else{
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(0,now,.22);
    }
    return this.enabled;
  }

  createCityAmbience(){
    const ctx=this.context;
    const buffer=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate);
    const data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.5;
    const noise=ctx.createBufferSource();noise.buffer=buffer;noise.loop=true;
    const low=ctx.createBiquadFilter();low.type='lowpass';low.frequency.value=240;low.Q.value=.3;
    const gain=ctx.createGain();gain.gain.value=.015;
    noise.connect(low).connect(gain).connect(this.master);noise.start();
    this.ambience={noise,low,gain};
  }

  update(){
    if(!this.enabled||!this.context||this.context.state!=='running')return;
    const now=this.context.currentTime;
    if(now<this.nextChord)return;
    const chord=this.chords[this.chordIndex%this.chords.length];
    this.chordIndex++;
    const start=now+.03,duration=5.8;
    chord.forEach((frequency,index)=>{
      const osc=this.context.createOscillator();
      const gain=this.context.createGain();
      const filter=this.context.createBiquadFilter();
      osc.type=index===0?'sine':'triangle';
      osc.frequency.value=frequency*(index===3?2:1);
      filter.type='lowpass';filter.frequency.value=720;
      const volume=index===0?.021:.013;
      gain.gain.setValueAtTime(.0001,start);
      gain.gain.linearRampToValueAtTime(volume,start+1.1);
      gain.gain.setTargetAtTime(.0001,start+duration-1,.5);
      osc.connect(filter).connect(gain).connect(this.master);
      osc.start(start);osc.stop(start+duration+.2);
    });
    this.nextChord=start+6.1;
  }

  tone(frequency,duration,volume,type='sine'){
    if(!this.enabled||!this.context||this.context.state!=='running')return;
    const now=this.context.currentTime;
    const osc=this.context.createOscillator(),gain=this.context.createGain();
    osc.type=type;osc.frequency.setValueAtTime(frequency,now);
    gain.gain.setValueAtTime(.0001,now);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),now+.025);
    gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(gain).connect(this.master);osc.start(now);osc.stop(now+duration+.03);
  }
  pickup(){this.tone(740,.13,.075,'sine');this.tone(990,.18,.04,'sine');}
  hit(){this.tone(115,.32,.12,'triangle');}
  boost(){this.tone(310,.22,.035,'sine');}
  stop(){
    if(this.context){this.enabled=false;this.context.close();}
    this.context=null;this.master=null;
  }
}

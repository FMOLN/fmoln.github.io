(function(){
  'use strict';
  var canvas,ctx,W,H,mouse={x:-9999,y:-9999},particles=[];

  function ready(fn){ if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',fn);}else{fn();} }

  ready(function(){
    canvas=document.getElementById('particle-canvas');
    if(!canvas){return;}
    ctx=canvas.getContext('2d');
    canvas.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;';
    resize(); spawn(); bind(); tick();
  });

  function resize(){ W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight; }

  function r(a,b){return a+Math.random()*(b-a);}
  function ri(a,b){return Math.floor(r(a,b+1));}
  function cx(){return Math.random()<0.65?r(W*0.2,W*0.8):r(0,W);}
  function cy(){return Math.random()<0.65?r(H*0.15,H*0.85):r(0,H);}

  var G=[[255,215,0],[255,234,158],[255,248,225],[240,180,50],[212,175,55],[255,204,68]];
  function gc(){return G[ri(0,G.length-1)];}
  function rgba(c,a){return'rgba('+c[0]+','+c[1]+','+c[2]+','+a.toFixed(3)+')';}

  function dust(){var c=gc();return{t:0,x:cx(),y:cy(),vx:r(-0.25,0.25),vy:r(-0.1,0.1),rad:r(0.8,2.8),c:c,a:r(0.5,1),tw:r(0.02,0.06),tp:r(0,6.28),life:0,max:ri(280,500)};}
  function orb(){var c=gc(),rad=r(4,9);return{t:1,x:cx(),y:cy(),vx:r(-0.18,0.18),vy:r(-0.1,0.1),rad:rad,gr:rad*r(5,9),c:c,a:r(0.25,0.55),ps:r(0.4,1.1),pp:r(0,6.28),life:0,max:ri(350,600)};}
  function flake(){var c=gc(),s=ri(4,7),rads=[];for(var i=0;i<s;i++)rads.push(r(0.55,1));return{t:2,x:cx(),y:cy(),vx:r(-0.15,0.15),vy:r(-0.08,0.08),rad:r(7,17),s:s,rads:rads,rot:r(0,6.28),rv:r(-0.006,0.006),c:c,a:r(0.45,0.85),sh:r(0,6.28),shv:r(0.008,0.02),life:0,max:ri(400,700)};}

  function spawn(){
    particles=[];
    var dn=W<600?40:70,on=W<600?15:28,fn=W<600?8:16;
    for(var i=0;i<dn;i++){var d=dust();d.life=ri(0,d.max);particles.push(d);}
    for(var j=0;j<on;j++){var o=orb();o.life=ri(0,o.max);particles.push(o);}
    for(var k=0;k<fn;k++){var f=flake();f.life=ri(0,f.max);particles.push(f);}
  }

  function env(p){
    var fi=50,fo=70;
    if(p.life<fi)return p.life/fi;
    if(p.life>p.max-fo)return(p.max-p.life)/fo;
    return 1;
  }

  function upd(p){
    var dx=p.x-mouse.x,dy=p.y-mouse.y,dist=Math.sqrt(dx*dx+dy*dy),rep=110;
    if(dist<rep&&dist>0.1){var f=(rep-dist)/rep*1.8;p.vx+=(dx/dist)*f*0.35;p.vy+=(dy/dist)*f*0.35;}
    p.vx*=0.985;p.vy*=0.985;p.vy+=0.003;
    p.x+=p.vx;p.y+=p.vy;p.life++;
    if(p.life>=p.max){var n;if(p.t===0)n=dust();else if(p.t===1)n=orb();else n=flake();Object.assign(p,n);p.life=0;}
    if(p.x<-20)p.x=W+15;if(p.x>W+20)p.x=-15;
    if(p.y<-20)p.y=H+15;if(p.y>H+20)p.y=-15;
  }

  function ddust(p){
    var e=env(p);p.tp+=p.tw;
    var a=e*p.a*(0.65+Math.sin(p.tp)*0.35);
    if(a<0.01)return;
    ctx.save();ctx.shadowBlur=p.rad*3;ctx.shadowColor=rgba(p.c,a*0.7);
    ctx.beginPath();ctx.arc(p.x,p.y,p.rad,0,6.28);ctx.fillStyle=rgba(p.c,a);ctx.fill();ctx.restore();
  }

  function dorb(p){
    var e=env(p);p.pp+=p.ps*0.02;
    var pulse=0.55+Math.sin(p.pp)*0.45,a=e*p.a*pulse;
    if(a<0.01)return;
    ctx.save();
    var g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.gr);
    g.addColorStop(0,rgba(p.c,a*0.55));g.addColorStop(0.25,rgba(p.c,a*0.3));
    g.addColorStop(0.6,rgba(p.c,a*0.08));g.addColorStop(1,rgba(p.c,0));
    ctx.beginPath();ctx.arc(p.x,p.y,p.gr,0,6.28);ctx.fillStyle=g;ctx.fill();
    var co=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.rad);
    co.addColorStop(0,rgba([255,248,225],a));co.addColorStop(0.5,rgba(p.c,a*0.9));co.addColorStop(1,rgba(p.c,a*0.2));
    ctx.beginPath();ctx.arc(p.x,p.y,p.rad,0,6.28);ctx.fillStyle=co;ctx.fill();ctx.restore();
  }

  function dflake(p){
    var e=env(p),a=e*p.a;
    if(a<0.01)return;
    p.rot+=p.rv;p.sh+=p.shv;
    var shine=0.5+Math.sin(p.sh)*0.5;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);
    ctx.shadowBlur=p.rad*2;ctx.shadowColor=rgba(p.c,a*0.5);
    ctx.beginPath();
    for(var i=0;i<p.s;i++){var ang=(i/p.s)*6.28-1.57,rd=p.rad*p.rads[i];i===0?ctx.moveTo(Math.cos(ang)*rd,Math.sin(ang)*rd):ctx.lineTo(Math.cos(ang)*rd,Math.sin(ang)*rd);}
    ctx.closePath();
    var grd=ctx.createLinearGradient(-p.rad,-p.rad,p.rad,p.rad);
    grd.addColorStop(0,rgba([255,248,225],a*(0.4+shine*0.6)));
    grd.addColorStop(0.3,rgba(p.c,a));
    grd.addColorStop(0.75,rgba([200,150,40],a*0.8));
    grd.addColorStop(1,rgba([140,100,20],a*0.5));
    ctx.fillStyle=grd;ctx.fill();
    var sx=-p.rad*0.25*Math.cos(p.sh),sy=-p.rad*0.25*Math.sin(p.sh);
    var sp=ctx.createRadialGradient(sx,sy,0,sx,sy,p.rad*0.45);
    sp.addColorStop(0,rgba([255,255,255],shine*a*0.9));sp.addColorStop(1,rgba([255,255,255],0));
    ctx.fillStyle=sp;ctx.fill();
    ctx.strokeStyle=rgba([255,220,100],a*0.35);ctx.lineWidth=0.5;ctx.stroke();
    ctx.restore();
  }

  function dconn(){
    if(mouse.x<-100)return;
    var near=[];
    for(var i=0;i<particles.length;i++){var p=particles[i],dx=p.x-mouse.x,dy=p.y-mouse.y;if(dx*dx+dy*dy<14400)near.push(p);}
    for(var a=0;a<near.length;a++){for(var b=a+1;b<near.length;b++){
      var dx2=near[a].x-near[b].x,dy2=near[a].y-near[b].y,d=Math.sqrt(dx2*dx2+dy2*dy2);
      if(d<90){ctx.save();ctx.beginPath();ctx.moveTo(near[a].x,near[a].y);ctx.lineTo(near[b].x,near[b].y);ctx.strokeStyle='rgba(255,215,0,'+((1-d/90)*0.2).toFixed(3)+')';ctx.lineWidth=0.5;ctx.stroke();ctx.restore();}
    }}
  }

  function tick(){
    requestAnimationFrame(tick);
    ctx.clearRect(0,0,W,H);
    for(var i=0;i<particles.length;i++){
      upd(particles[i]);
      var p=particles[i];
      if(p.t===0)ddust(p);else if(p.t===1)dorb(p);else dflake(p);
    }
    dconn();
  }

  function bind(){
    window.addEventListener('mousemove',function(e){mouse.x=e.clientX;mouse.y=e.clientY;});
    window.addEventListener('mouseleave',function(){mouse.x=-9999;mouse.y=-9999;});
    window.addEventListener('resize',function(){resize();spawn();});
    window.addEventListener('touchmove',function(e){mouse.x=e.touches[0].clientX;mouse.y=e.touches[0].clientY;},{passive:true});
    window.addEventListener('touchend',function(){mouse.x=-9999;mouse.y=-9999;});
  }
})();

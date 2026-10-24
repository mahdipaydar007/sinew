'use strict';
// [muscle, equipment, movement pattern, "Name~tilt;Name"] – tilt rotates the figure for incline/decline
const G=[
['Chest','Barbell','bench','Bench Press;Incline Bench Press~-18;Decline Bench Press~18;Close-Grip Bench Press;Floor Press'],
['Chest','Dumbbell','bench','Dumbbell Bench Press;Incline Dumbbell Press~-18;Decline Dumbbell Press~18;Dumbbell Fly;Incline Dumbbell Fly~-18;Dumbbell Pullover'],
['Chest','Machine','bench','Machine Chest Press;Pec Deck;Cable Fly'],
['Chest','Bodyweight','pushup','Push-up;Incline Push-up;Decline Push-up;Diamond Push-up;Wide Push-up;Archer Push-up;Knee Push-up;Clap Push-up;Hindu Push-up'],
['Chest','Bodyweight','dip','Chest Dip;Ring Dip;Bench Dip;Parallel Bar Dip'],
['Back','Bodyweight','pull','Pull-up;Chin-up;Wide-Grip Pull-up;Neutral-Grip Pull-up;Archer Pull-up;Muscle-up;L-Sit Pull-up;Commando Pull-up;Rope Climb'],
['Back','Cable','pull','Lat Pulldown;Close-Grip Lat Pulldown;Straight-Arm Pulldown'],
['Back','Barbell','row','Barbell Row;Pendlay Row;T-Bar Row'],
['Back','Dumbbell','row','Dumbbell Row;Chest-Supported Row;Renegade Row'],
['Back','Cable','row','Seated Cable Row;Machine Row'],
['Back','Bodyweight','row','Inverted Row;Ring Row'],
['Back','Barbell','hinge','Deadlift;Sumo Deadlift;Romanian Deadlift;Stiff-Leg Deadlift;Rack Pull;Good Morning;Trap Bar Deadlift'],
['Back','Bodyweight','hinge','Back Extension;Superman'],
['Legs','Kettlebell','hinge','Kettlebell Swing;Single-Leg Romanian Deadlift;Kettlebell Deadlift'],
['Shoulders','Barbell','press','Overhead Press;Push Press;Behind-the-Neck Press;Landmine Press'],
['Shoulders','Dumbbell','press','Seated Dumbbell Press;Arnold Press;Dumbbell Push Press;Z Press'],
['Shoulders','Bodyweight','press','Handstand Push-up;Pike Push-up;Wall Walk'],
['Shoulders','Dumbbell','raise','Lateral Raise;Front Raise;Rear Delt Fly;Upright Row;Dumbbell Shrug'],
['Shoulders','Cable','raise','Face Pull;Cable Lateral Raise;Reverse Pec Deck'],
['Arms','Barbell','curl','Barbell Curl;EZ-Bar Curl;Preacher Curl;Reverse Curl'],
['Arms','Dumbbell','curl','Dumbbell Curl;Hammer Curl;Incline Dumbbell Curl;Concentration Curl;Zottman Curl;Spider Curl'],
['Arms','Cable','curl','Cable Curl;Rope Hammer Curl'],
['Arms','Barbell','ext','Skull Crusher;JM Press'],
['Arms','Dumbbell','ext','Overhead Triceps Extension;Triceps Kickback'],
['Arms','Cable','ext','Triceps Pushdown;Rope Pushdown;Reverse-Grip Pushdown'],
['Legs','Barbell','squat','Back Squat;Front Squat;Box Squat;Zercher Squat;Overhead Squat;Barbell Lunge;Barbell Step-up;Hack Squat'],
['Legs','Dumbbell','squat','Goblet Squat;Dumbbell Lunge;Walking Lunge;Reverse Lunge;Bulgarian Split Squat;Dumbbell Step-up;Lateral Lunge;Curtsy Lunge;Cossack Squat'],
['Legs','Machine','squat','Leg Press;Smith Machine Squat'],
['Legs','Bodyweight','squat','Bodyweight Squat;Pistol Squat;Wall Sit;Sissy Squat;Split Squat;Shrimp Squat'],
['Legs','Machine','legraise','Leg Extension;Leg Curl;Nordic Curl'],
['Legs','Bodyweight','bridge','Glute Bridge;Hip Thrust;Single-Leg Glute Bridge;Donkey Kick'],
['Legs','Machine','jump','Standing Calf Raise;Seated Calf Raise;Bodyweight Calf Raise'],
['Core','Bodyweight','situp','Crunch;Sit-up;Bicycle Crunch;Russian Twist;V-up;Cable Crunch'],
['Core','Bodyweight','legraise','Lying Leg Raise;Hanging Leg Raise;Hanging Knee Raise;Toes to Bar;Flutter Kicks;Dead Bug;Dragon Flag;L-Sit'],
['Core','Bodyweight','plank','Plank;Side Plank;Hollow Hold;Ab Wheel Rollout;Mountain Climber;Bear Crawl;Handstand Hold'],
['CrossFit','Barbell','hinge','Power Clean;Clean;Snatch;Hang Clean;Clean and Jerk;Sumo Deadlift High Pull'],
['CrossFit','Barbell','squat','Thruster;Wall Ball;Sandbag Squat'],
['CrossFit','Kettlebell','press','Kettlebell Press;Turkish Get-up;Devil Press;Man Maker'],
['CrossFit','Machine','row','Rowing Machine;Sled Pull'],
['CrossFit','Bodyweight','jump','Burpee;Box Jump;Jumping Jack;Jump Squat;Double Under;Skipping;Sprints;Running;Broad Jump;Tuck Jump'],
['CrossFit','Machine','jump','Assault Bike;Ski Erg;Sled Push;Battle Ropes;Farmers Carry']];
const GD={
bench:'Lie back with feet planted and shoulder blades pulled together. Lower the weight under control to your chest, then press up until your arms are straight. Incline targets the upper chest, decline the lower chest.',
pushup:'Hands under shoulders, body in one straight line. Lower your chest to the floor, then press back up without letting your hips sag.',
dip:'Support yourself on straight arms. Lower until elbows reach about 90°, then press up. Lean forward for chest, stay upright for triceps.',
pull:'Hang with a firm grip. Drive your elbows down to pull your chest toward the bar, pause, then lower fully under control.',
row:'Hinge forward with a flat back. Pull the handle to your lower ribs, squeeze your shoulder blades, then lower slowly.',
hinge:'Push your hips back with a flat spine and soft knees. Keep the weight close, then drive your hips forward to stand tall and squeeze your glutes.',
press:'Brace your core and glutes. Press the weight straight overhead until your arms lock out, then lower to shoulder height.',
raise:'Use a light weight with a slight elbow bend. Lift to shoulder height without swinging, pause, and lower slowly.',
curl:'Pin your elbows to your sides. Curl the weight up, squeeze, then lower for two seconds.',
ext:'Keep your upper arms still. Straighten your elbows fully, squeeze the triceps, then return slowly.',
squat:'Feet about shoulder width, chest up. Sit down and back until thighs are parallel or deeper, knees tracking over toes, then drive up through your heels.',
bridge:'Lie on your back with feet planted. Drive through your heels until your body forms a straight line, squeeze your glutes, then lower.',
legraise:'Keep your lower back pressed down. Move the legs through full range under control with no swinging.',
situp:'Keep your lower back supported. Curl up using your abs rather than pulling on your neck, then lower slowly.',
plank:'Body in one straight line, abs and glutes tight. Hold the position and keep breathing. Reps = seconds.',
jump:'Move explosively but land softly with bent knees. Rest as needed and keep form clean as you tire.'};
const OLD={bench:'bench-press',incline:'incline-dumbbell-press',pushup:'push-up',pullup:'pull-up',row:'barbell-row',deadlift:'deadlift',squat:'back-squat',lunge:'walking-lunge',rdl:'romanian-deadlift',ohp:'overhead-press',lateral:'lateral-raise',curl:'dumbbell-curl',pushdown:'triceps-pushdown',plank:'plank'};
const LIB=[];
G.forEach(([m,q,p,s])=>s.split(';').forEach(n=>{const[nm,r]=n.split('~'),id=nm.toLowerCase().replace(/[^a-z0-9]+/g,'-');
  if(!LIB.some(e=>e.id===id))LIB.push({id,name:nm,m,q,p,r:+r||0,w:q!=='Bodyweight',g:GD[p]})}));
// Poses: shoulder, hip, knee, foot, elbow, hand (x,y pairs) – start, then end of the movement
const P={
squat:[[50,30,50,54,52,72,50,90,58,38,60,28],[60,50,40,68,62,72,52,90,68,56,66,46]],
pushup:[[62,64,36,74,24,80,10,86,64,76,64,88],[62,80,36,82,24,84,10,87,74,84,64,88]],
bench:[[58,66,36,66,22,66,8,66,60,52,60,38],[58,66,36,66,22,66,8,66,68,64,60,56]],
pull:[[50,40,50,62,50,76,50,88,44,26,50,12],[50,24,50,46,50,60,50,72,40,22,50,12]],
row:[[60,42,36,54,38,72,36,90,62,56,62,70],[60,42,36,54,38,72,36,90,46,46,58,52]],
hinge:[[50,28,50,54,50,72,50,90,52,40,54,56],[74,50,42,56,46,72,46,90,74,62,74,76]],
press:[[50,32,50,56,50,73,50,90,58,44,56,30],[50,32,50,56,50,73,50,90,54,20,54,6]],
curl:[[50,32,50,56,50,73,50,90,52,46,56,60],[50,32,50,56,50,73,50,90,52,46,60,36]],
raise:[[50,32,50,56,50,73,50,90,52,46,54,60],[50,32,50,56,50,73,50,90,64,34,76,32]],
ext:[[50,32,50,56,50,73,50,90,56,48,66,44],[50,32,50,56,50,73,50,90,54,48,54,64]],
plank:[[62,64,36,70,24,78,10,86,62,80,74,82],[62,67,36,72,24,79,10,86,62,80,74,82]],
situp:[[62,86,40,86,28,70,16,88,56,76,50,68],[50,56,40,86,28,70,16,88,48,66,56,70]],
legraise:[[62,86,40,86,26,86,12,86,54,86,46,86],[62,86,40,86,40,66,40,46,54,86,46,86]],
bridge:[[62,86,40,86,28,68,20,88,56,86,46,86],[62,80,42,66,28,68,20,88,56,86,46,86]],
dip:[[50,34,50,58,46,74,46,88,50,48,50,62],[50,48,50,72,46,80,46,90,40,52,50,62]],
jump:[[52,50,40,68,58,72,50,90,50,62,58,72],[50,18,50,42,50,60,50,76,54,8,56,2]]};
function fig(e){
  const p=P[e.p];if(!p)return '🏋️';const[a,b]=p;
  const d=n=>`M${n[0]},${n[1]}L${n[2]},${n[3]}L${n[4]},${n[5]}L${n[6]},${n[7]}M${n[0]},${n[1]}L${n[8]},${n[9]}L${n[10]},${n[11]}`;
  const hd=n=>{const x=n[0]-n[2],y=n[1]-n[3],l=Math.hypot(x,y)||1;return[n[0]+x/l*9,n[1]+y/l*9]};
  const an=(at,v1,v2)=>`<animate attributeName="${at}" values="${v1};${v2};${v1}" dur="2.2s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.5;1" keySplines=".45 0 .55 1;.45 0 .55 1"/>`;
  const ha=hd(a),hb=hd(b);
  const prop=e.p==='pull'?'<path d="M28,12H72" stroke="var(--mute)"/>':e.p==='bench'?'<path d="M2,72H72" stroke="var(--mute)"/>':'';
  const wt=e.w?`<circle r="4" fill="var(--acc)" stroke="none" cx="${a[10]}" cy="${a[11]}">${an('cx',a[10],b[10])}${an('cy',a[11],b[11])}</circle>`:'';
  return `<svg class="fig" viewBox="0 0 100 100" role="img" aria-label="${e.name} animation"><path d="M0,92H100" stroke="var(--line)" stroke-width="2"/><g fill="none" stroke="var(--text)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" transform="rotate(${e.r||0} 40 66)">${prop}<path d="${d(a)}">${an('d',d(a),d(b))}</path><circle r="6" cx="${ha[0]}" cy="${ha[1]}">${an('cx',ha[0],hb[0])}${an('cy',ha[1],hb[1])}</circle>${wt}</g></svg>`;
}
// Rank badges
const RC=['#8b929c','#c47a3d','#c3ccd8','#f2b705','#6fe0d3','#6cb8ff','#c07bff'];
const EM=['<path d="M40 30l9 5v10l-9 5-9-5V35z"/>','<path d="M30 46l10-8 10 8"/>','<path d="M30 42l10-8 10 8M30 52l10-8 10 8"/>','<path d="M30 38l10-7 10 7M30 47l10-7 10 7M30 56l10-7 10 7"/>','<path d="M40 28l4 9 10 1-8 7 3 10-9-5-9 5 3-10-8-7 10-1z"/>','<path d="M40 28l12 14-12 18-12-18z"/>','<path d="M27 56V36l8 9 5-12 5 12 8-9v20z"/>'];
function badge(i,s=48){const c=RC[i],sh='M40 4l30 9v26c0 19-13 31-30 37C23 70 10 58 10 39V13z';
  return `<svg width="${s}" height="${s}" viewBox="0 0 80 80" role="img" aria-label="${RANKS[i][0]} badge" style="flex:none"><path d="${sh}" fill="${c}"/><path d="${sh}" fill="#000" fill-opacity=".5" transform="translate(8 6) scale(.8)"/><g fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${EM[i]}</g></svg>`}
// Exercise library from github.com/hasaneyldrm/exercises-dataset (1,324 exercises with GIFs and step guides)
const DB_URL='https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/';
let DBX=[];
const cap=s=>String(s).replace(/(^|[\s\-\/(])([a-z])/g,(m,a,c)=>a+c.toUpperCase()).replace(/\bEz\b/g,'EZ');
async function loadDB(){const u=DB_URL+'data/exercises.json';let d;
  try{const c=await caches.open('ironclad-ex');let r=await c.match(u);if(!r){r=await fetch(u);if(!r.ok)throw 0;await c.put(u,r.clone())}d=await r.json()}
  catch(e){try{d=await(await fetch(u)).json()}catch(e2){return false}}
  DBX=d.map(x=>({id:'g'+x.id,name:cap(x.name),m:cap(x.category),q:cap(x.equipment),t:cap(x.target||''),sec:x.secondary_muscles||[],
    steps:(x.instruction_steps&&x.instruction_steps.en)||[(x.instructions||{}).en||''],gif:DB_URL+x.gif_url,th:DB_URL+x.image}));return true}

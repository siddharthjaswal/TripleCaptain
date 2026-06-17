import "dotenv/config";
import { projectAllPlayers } from "../lib/data/xp";
import { narrateScoutPick, narrateAudit } from "../lib/narrate";
async function main(){
  const proj = await projectAllPlayers({ persist: false });
  console.log(`projected ${proj.length} players`);
  console.log("=== Top 12 by xP ===");
  for (const p of proj.slice(0,12)) console.log(`  ${p.xPoints.toFixed(2).padStart(5)}xP  cap ${p.capScore.toFixed(1).padStart(5)}  ${p.position} ${p.name.padEnd(15)} £${p.price}  ${p.archetype.padEnd(13)} start ${(p.startProb*100).toFixed(0)}%`);
  console.log("\n=== Best value (xP/£, min £4.0) ===");
  for (const p of [...proj].filter(p=>p.price>=4).sort((a,b)=>b.value-a.value).slice(0,6)) console.log(`  ${p.value.toFixed(2)}  ${p.name} (${p.position} £${p.price}) ${p.xPoints}xP`);
  console.log("\n=== Narrator scout blurb ===");
  console.log("  "+narrateScoutPick({name:proj[5].name, ownership:8, elitePct:42, eliteEdge:30, form:6.5, epNext:proj[5].xPoints, reasons:proj[5].reasons}));
  console.log("\n=== Narrator audit ===");
  const a = narrateAudit({avgScore:62,healthScore:58,strongest:[{name:"Haaland",score:88},{name:"Salah",score:85}],weakest:[{name:"Mukiele",score:31}],templateAlignmentPct:45,missingTemplate:[{name:"Gabriel",elitePct:92,captainPct:0}],eliteCaptain:{name:"Haaland",captainPct:40},userCaptainEliteCapPct:40});
  console.log("  CRITIQUE:", a.critique.replace(/\n+/g," ").slice(0,320));
  console.log("  RECS:", a.recommendations.slice(0,3).join(" | "));
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});

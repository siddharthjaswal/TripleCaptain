import { auditTeam } from '../lib/fpl/auditor';
import { scoutDifferentials } from '../lib/fpl/scout';

async function main() {
    const entryId = 396829; // Test ID
    
    console.log('--- TEAM AUDIT ---');
    const audit = await auditTeam(entryId);
    console.log(JSON.stringify(audit, null, 2));
    
    console.log('\n--- DIFFERENTIAL SCOUT ---');
    const scout = await scoutDifferentials();
    console.log(JSON.stringify(scout, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });

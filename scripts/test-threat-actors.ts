
import { ThreatActorService } from '../lib/threat-actor-service';

try {
    console.log("Starting ThreatActorService test...");
    const actors = ThreatActorService.getThreatActors();
    console.log("Success!");
    console.log(`Found ${actors.length} actors.`);
    console.log("First actor:", JSON.stringify(actors[0], null, 2));
} catch (error: any) {
    console.error("CRASHED:", error);
    if (error.stack) {
        console.error(error.stack);
    }
}

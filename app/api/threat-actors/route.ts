
import { NextResponse } from 'next/server';
import { ThreatActorService } from '@/lib/threat-actor-service';

export async function GET() {
    try {
        const threatActors = ThreatActorService.getThreatActors();
        return NextResponse.json(threatActors);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

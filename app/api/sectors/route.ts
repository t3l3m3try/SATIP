import { NextResponse } from 'next/server';
import { SectorService } from '@/lib/sector-service';

export async function GET() {
    try {
        const sectors = SectorService.getSectors();
        return NextResponse.json(sectors);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

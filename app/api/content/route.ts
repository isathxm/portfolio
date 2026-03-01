import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const dataFilePath = path.join(process.cwd(), 'data', 'content.json');

export async function GET() {
    try {
        const fileContents = await fs.readFile(dataFilePath, 'utf8');
        const data = JSON.parse(fileContents);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error reading content file:', error);
        return NextResponse.json({ error: 'Failed to read content' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Basic validation: ensure body is an object
        if (!body || typeof body !== 'object') {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
        }

        const jsonString = JSON.stringify(body, null, 2);
        await fs.writeFile(dataFilePath, jsonString, 'utf8');

        return NextResponse.json({ success: true, message: 'Content updated successfully' });
    } catch (error) {
        console.error('Error writing content file:', error);
        return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
    }
}

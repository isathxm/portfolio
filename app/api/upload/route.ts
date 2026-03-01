import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const projectId = formData.get('projectId') as string | null;

        if (!file || !projectId) {
            return NextResponse.json(
                { error: 'File and projectId are required' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' },
                { status: 400 }
            );
        }

        // Create directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), 'public', 'images', projectId);
        await fs.mkdir(uploadDir, { recursive: true });

        // Generate a unique filename to avoid collisions
        const ext = file.name.split('.').pop() || 'jpg';
        const timestamp = Date.now();
        const safeName = file.name
            .replace(/\.[^/.]+$/, '') // remove extension
            .replace(/[^a-zA-Z0-9_-]/g, '_') // sanitize
            .substring(0, 50); // limit length
        const filename = `${safeName}_${timestamp}.${ext}`;

        // Write file with Sharp Compression
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filePath = path.join(uploadDir, filename);

        // Compress and resize image
        await sharp(buffer)
            .resize({ width: 1920, withoutEnlargement: true })
            .jpeg({ quality: 80 }) // force jpeg output for consistency and compression, or let it guess
            .toFile(filePath);

        // Return public URL path
        const publicPath = `/images/${projectId}/${filename}`;
        return NextResponse.json({ success: true, path: publicPath });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}

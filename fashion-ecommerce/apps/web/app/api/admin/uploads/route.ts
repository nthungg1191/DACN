import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, error: 'Thiếu file để upload' }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      return NextResponse.json(
        { success: false, error: 'Thiếu CLOUDINARY_CLOUD_NAME hoặc CLOUDINARY_UPLOAD_PRESET' },
        { status: 500 }
      );
    }

    const uploadForm = new FormData();
    uploadForm.append('file', file);
    uploadForm.append('upload_preset', uploadPreset);

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const uploadResponse = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: uploadForm,
    });

    const data = await uploadResponse.json();

    if (!uploadResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data?.error?.message || 'Upload thất bại',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: data.secure_url,
      publicId: data.public_id,
    });
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Upload thất bại',
      },
      { status: 500 }
    );
  }
}


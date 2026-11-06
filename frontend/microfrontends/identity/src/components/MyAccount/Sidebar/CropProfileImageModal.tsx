// frontend/microfrontends/identity/src/components/MyAccount/Sidebar/CropProfileImageModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../../../../../../shared/design-system/components/Modal';
import { toast } from '../../../../../../shared/toaster';
import { accountApi } from '../../../../../../shared/api/accountApi';
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

export interface CropProfileImageModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onUploaded: (photoUrl: string) => void;
}

export const CropProfileImageModal: React.FC<CropProfileImageModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onUploaded,
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isUploading, setIsUploading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load and cache the image element
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setScale(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      drawCanvas();
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Re-draw canvas whenever zoom, rotation, or pan offset changes
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width; // 300x300 canvas
    ctx.clearRect(0, 0, size, size);

    ctx.save();
    // Center origin
    ctx.translate(size / 2 + offset.x, size / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);

    // Calculate aspect ratio fit
    const imgAspect = img.width / img.height;
    let renderW = size;
    let renderH = size;
    if (imgAspect > 1) {
      renderW = size * imgAspect;
      renderH = size;
    } else {
      renderW = size;
      renderH = size / imgAspect;
    }

    ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);
    ctx.restore();
  };

  useEffect(() => {
    if (imageRef.current) {
      drawCanvas();
    }
  }, [scale, rotation, offset]);

  // Mouse drag handling for panning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleUpload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsUploading(true);
    try {
      // Export cropped canvas to JPEG blob
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9)
      );

      if (!blob) {
        throw new Error('Failed to process image canvas');
      }

      const res = await accountApi.uploadProfilePhoto(blob);
      toast.success('Profile photo updated successfully');
      onUploaded(res.profilePhotoUrl);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload profile photo');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crop Profile Image"
      footer={
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', width: '100%' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={isUploading || !imageSrc}
          >
            {isUploading ? 'Uploading...' : 'Save Profile Photo'}
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
          Drag to position and use the slider or buttons to adjust the square crop.
        </p>

        {/* Circular/Square Preview viewport */}
        <div
          style={{
            position: 'relative',
            width: '300px',
            height: '300px',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 0 0 2px #0284c7, 0 4px 12px rgba(0,0,0,0.1)',
            cursor: isDragging ? 'grabbing' : 'grab',
            backgroundColor: '#0f172a',
          }}
        >
          <canvas
            ref={canvasRef}
            width={300}
            height={300}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ width: '100%', height: '100%' }}
          />
          {/* Subtle grid guidelines */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              border: '1px dashed rgba(255, 255, 255, 0.4)',
            }}
          />
        </div>

        {/* Crop Controls: Zoom and Rotate */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: '340px' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.05"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            style={{ flex: 1 }}
            aria-label="Zoom scale"
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setScale((s) => Math.min(3, s + 0.1))}
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setRotation((r) => (r + 90) % 360)}
            title="Rotate 90 degrees"
            aria-label="Rotate 90 degrees"
          >
            <RotateCw size={16} />
          </button>
        </div>
      </div>
    </Modal>
  );
};

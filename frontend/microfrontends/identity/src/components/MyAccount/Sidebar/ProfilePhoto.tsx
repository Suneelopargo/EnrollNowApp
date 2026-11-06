// frontend/microfrontends/identity/src/components/MyAccount/Sidebar/ProfilePhoto.tsx
import React, { useState, useRef } from 'react';
import { UserPlus } from 'lucide-react';
import { CropProfileImageModal } from './CropProfileImageModal';
import { toast } from '../../../../../../shared/toaster';

export interface ProfilePhotoProps {
  url: string | null;
  onPhotoUpdated: (newUrl: string) => void;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const ProfilePhoto: React.FC<ProfilePhotoProps> = ({ url, onPhotoUpdated }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be reselected if needed
    e.target.value = '';

    // File validation: Size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error('Image size exceeds maximum allowed limit of 5MB');
      return;
    }

    // File validation: Type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file format. Please upload a JPEG, PNG, GIF, or WebP image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImageSrc(event.target?.result as string);
      setModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="account-profile-photo-container">
      <div className="account-avatar-wrapper">
        {url ? (
          <img
            src={url}
            alt="Current User Avatar"
            className="account-avatar-img"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="account-avatar-placeholder" aria-label="Default User Avatar">
            <UserPlus size={52} strokeWidth={1.5} aria-hidden="true" />
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        id="profile-photo-input"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="sr-only"
        aria-label="Upload profile image"
      />

      <button
        type="button"
        className="account-photo-select-btn"
        onClick={handleSelectClick}
      >
        Select Profile Image
      </button>

      <CropProfileImageModal
        isOpen={modalOpen}
        imageSrc={selectedImageSrc}
        onClose={() => setModalOpen(false)}
        onUploaded={(newUrl) => {
          onPhotoUpdated(newUrl);
        }}
      />
    </div>
  );
};

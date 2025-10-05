import { useState } from 'react';
import { X, Upload } from 'lucide-react';

interface EditProfilePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileImage: string;
  onSave: (profileImage: string) => void;
}

const EditProfilePhotoModal = ({ isOpen, onClose, profileImage, onSave }: EditProfilePhotoModalProps) => {
  const [newProfileImage, setNewProfileImage] = useState(profileImage);

  const handleSave = () => {
    onSave(newProfileImage);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Edit Profile Photo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-center">
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
              {newProfileImage ? (
                <img 
                  src={newProfileImage} 
                  alt="Profile preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400 text-center">
                  <Upload size={32} className="mx-auto mb-1" />
                  <p className="text-xs">No image</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profile Image URL
            </label>
            <input
              type="url"
              value={newProfileImage}
              onChange={(e) => setNewProfileImage(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/profile-image.jpg"
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter the URL of your profile image
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfilePhotoModal;
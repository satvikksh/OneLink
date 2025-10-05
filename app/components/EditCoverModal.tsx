import { useState } from 'react';
import { X, Upload } from 'lucide-react';

interface EditCoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  coverImage: string;
  onSave: (coverImage: string) => void;
}

const EditCoverModal = ({ isOpen, onClose, coverImage, onSave }: EditCoverModalProps) => {
  const [newCoverImage, setNewCoverImage] = useState(coverImage);

  const handleSave = () => {
    onSave(newCoverImage);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Edit Cover Photo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
            {newCoverImage ? (
              <img 
                src={newCoverImage} 
                alt="Cover preview" 
                className="h-full w-full object-cover rounded-lg"
              />
            ) : (
              <div className="text-gray-400 text-center">
                <Upload size={48} className="mx-auto mb-2" />
                <p>No cover image selected</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cover Image URL
            </label>
            <input
              type="url"
              value={newCoverImage}
              onChange={(e) => setNewCoverImage(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/cover-image.jpg"
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter the URL of your cover image
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
              Save Cover
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCoverModal;
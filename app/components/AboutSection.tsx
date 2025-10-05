import { useState } from 'react';
import { Edit3 } from 'lucide-react';

interface AboutSectionProps {
  about: string;
  onUpdateAbout: (about: string) => void;
}

const AboutSection = ({ about, onUpdateAbout }: AboutSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editAbout, setEditAbout] = useState(about);

  const handleSave = () => {
    onUpdateAbout(editAbout);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditAbout(about);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">About</h2>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Edit3 size={16} />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <textarea
            value={editAbout}
            onChange={(e) => setEditAbout(e.target.value)}
            className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Tell us about yourself..."
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{about}</p>
      )}
    </div>
  );
};

export default AboutSection;
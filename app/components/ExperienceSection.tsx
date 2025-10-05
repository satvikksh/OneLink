import { useState } from 'react';
import { Briefcase, Plus, Edit3, Trash2 } from 'lucide-react';
import { Experience } from '../api/socket/profile/page';
import ExperienceModal from './ExperienceModal';

interface ExperienceSectionProps {
  experiences: Experience[];
  onAddExperience: (experience: Omit<Experience, 'id'>) => void;
  onUpdateExperience: (id: string, updates: Partial<Experience>) => void;
  onDeleteExperience: (id: string) => void;
}

const ExperienceSection = ({ 
  experiences, 
  onAddExperience, 
  onUpdateExperience,
  onDeleteExperience 
}: ExperienceSectionProps) => {
  const [showModal, setShowModal] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);

  const handleAdd = (experience: Omit<Experience, 'id'>) => {
    onAddExperience(experience);
    setShowModal(false);
  };

  const handleUpdate = (experience: Omit<Experience, 'id'>) => {
    if (editingExperience) {
      onUpdateExperience(editingExperience.id, experience);
      setEditingExperience(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this experience?')) {
      onDeleteExperience(id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Experience</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      <div className="space-y-6">
        {experiences.map((exp) => (
          <div key={exp.id} className="flex gap-4 group">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Briefcase className="text-blue-600" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{exp.title}</h3>
              <p className="text-gray-600">{exp.company} • {exp.location}</p>
              <p className="text-sm text-gray-500">
                {exp.startDate} - {exp.endDate}
                {exp.current && <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Current</span>}
              </p>
              <p className="text-gray-700 mt-2">{exp.description}</p>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setEditingExperience(exp)}
                className="text-gray-400 hover:text-blue-600"
              >
                <Edit3 size={16} />
              </button>
              <button 
                onClick={() => handleDelete(exp.id)}
                className="text-gray-400 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {experiences.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Briefcase size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No experience added yet</p>
            <button 
              onClick={() => setShowModal(true)}
              className="text-blue-600 hover:text-blue-700 mt-2"
            >
              Add your first experience
            </button>
          </div>
        )}
      </div>

      <ExperienceModal 
        isOpen={showModal || !!editingExperience}
        onClose={() => {
          setShowModal(false);
          setEditingExperience(null);
        }}
        experience={editingExperience || undefined}
        onSave={editingExperience ? handleUpdate : handleAdd}
      />
    </div>
  );
};

export default ExperienceSection;
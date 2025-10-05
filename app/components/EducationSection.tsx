import { useState } from 'react';
import { GraduationCap, Plus, Edit3, Trash2 } from 'lucide-react';
import { Education } from '../api/socket/profile/page';
import EducationModal from './EducationModal';

interface EducationSectionProps {
  education: Education[];
  onAddEducation: (education: Omit<Education, 'id'>) => void;
  onUpdateEducation: (id: string, updates: Partial<Education>) => void;
  onDeleteEducation: (id: string) => void;
}

const EducationSection = ({ 
  education, 
  onAddEducation, 
  onUpdateEducation,
  onDeleteEducation 
}: EducationSectionProps) => {
  const [showModal, setShowModal] = useState(false);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);

  const handleAdd = (edu: Omit<Education, 'id'>) => {
    onAddEducation(edu);
    setShowModal(false);
  };

  const handleUpdate = (edu: Omit<Education, 'id'>) => {
    if (editingEducation) {
      onUpdateEducation(editingEducation.id, edu);
      setEditingEducation(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this education?')) {
      onDeleteEducation(id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Education</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      <div className="space-y-6">
        {education.map((edu) => (
          <div key={edu.id} className="flex gap-4 group">
            <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <GraduationCap className="text-green-600" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{edu.school}</h3>
              <p className="text-gray-600">{edu.degree} in {edu.field}</p>
              <p className="text-sm text-gray-500">
                {edu.startDate} - {edu.endDate}
                {edu.current && <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Current</span>}
              </p>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setEditingEducation(edu)}
                className="text-gray-400 hover:text-blue-600"
              >
                <Edit3 size={16} />
              </button>
              <button 
                onClick={() => handleDelete(edu.id)}
                className="text-gray-400 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {education.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <GraduationCap size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No education added yet</p>
            <button 
              onClick={() => setShowModal(true)}
              className="text-blue-600 hover:text-blue-700 mt-2"
            >
              Add your first education
            </button>
          </div>
        )}
      </div>

      <EducationModal 
        isOpen={showModal || !!editingEducation}
        onClose={() => {
          setShowModal(false);
          setEditingEducation(null);
        }}
        education={editingEducation || undefined}
        onSave={editingEducation ? handleUpdate : handleAdd}
      />
    </div>
  );
};

export default EducationSection;
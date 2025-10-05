import { Users, Eye } from 'lucide-react';

interface StatsSectionProps {
  connections: number;
  profileViews: number;
}

const StatsSection = ({ connections, profileViews }: StatsSectionProps) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Stats</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-500" />
            <span className="text-gray-700">Connections</span>
          </div>
          <span className="font-semibold">{connections.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-gray-500" />
            <span className="text-gray-700">Profile Views</span>
          </div>
          <span className="font-semibold">{profileViews.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default StatsSection;
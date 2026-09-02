import { useState } from 'react';
import { AdminProgramsList } from './AdminProgramsList';
import { AdminProgramCategories } from './AdminProgramCategories';

export function AdminPrograms() {
  const [activeTab, setActiveTab] = useState<'programs' | 'categories'>('programs');

  return (
    <div className="space-y-6">
      <div className="flex border-b border-[#E5E7EB]">
        <button
          onClick={() => setActiveTab('programs')}
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'programs' ? 'border-[#0D9488] text-[#0D9488]' : 'border-transparent text-[#6B7280] hover:text-[#374151]'}`}
        >
          Programs
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`py-3 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'categories' ? 'border-[#0D9488] text-[#0D9488]' : 'border-transparent text-[#6B7280] hover:text-[#374151]'}`}
        >
          Categories
        </button>
      </div>

      {activeTab === 'programs' ? <AdminProgramsList /> : <AdminProgramCategories />}
    </div>
  );
}


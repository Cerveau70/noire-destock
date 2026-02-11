import React from 'react';

interface StaticSection {
  title: string;
  body: string;
}

interface StaticPageProps {
  title: string;
  subtitle?: string;
  sections: StaticSection[];
}

const StaticPage: React.FC<StaticPageProps> = ({ title, subtitle, sections }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-8 pb-24 md:pb-12">
      <div className="bg-white border border-gray-200 p-8 shadow-sm rounded-none">
        <h1 className="text-3xl font-black uppercase tracking-tight text-[#0f172a]">{title}</h1>
        {subtitle && <p className="text-gray-500 mt-2">{subtitle}</p>}
      </div>
      <div className="space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white border border-gray-200 p-6 rounded-none shadow-sm">
            <h2 className="text-sm font-black uppercase text-gray-400 mb-2">{section.title}</h2>
            <p className="text-sm text-gray-700 leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaticPage;

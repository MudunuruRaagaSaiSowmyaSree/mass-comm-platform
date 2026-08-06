import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface AudienceMember {
  id: string;
  name: string;
  language: string;
  geography: string;
  occupation: string;
}

interface AudienceManagerProps {
  currentUser?: string;
}

export default function AudienceManager({ currentUser = 'Raaga Sai' }: AudienceManagerProps) {
  const [members, setMembers] = useState<AudienceMember[]>([]);
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('');
  const [geography, setGeography] = useState('');
  const [occupation, setOccupation] = useState('');

  const [filterLang, setFilterLang] = useState('');
  const [filterGeo, setFilterGeo] = useState('');

  const API_URL = 'http://127.0.0.1:8000';

  useEffect(() => {
    fetchAudience();
  }, []);

  const fetchAudience = async () => {
    try {
      const res = await axios.get(`${API_URL}/audience/`);
      setMembers(res.data);
    } catch (err) {
      console.error('Failed to fetch audience', err);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !language) return;

    try {
      await axios.post(`${API_URL}/audience/`, {
        name,
        language,
        geography: geography || 'General',
        occupation: occupation || 'General',
      });
      setName('');
      setLanguage('');
      setGeography('');
      setOccupation('');
      fetchAudience();
    } catch (err) {
      console.error('Failed to add member', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/audience/${id}`);
      fetchAudience();
    } catch (err) {
      console.error('Failed to delete member', err);
    }
  };

  const filteredMembers = members.filter((m) => {
    const matchesLang = filterLang ? m.language.toLowerCase().includes(filterLang.toLowerCase()) : true;
    const matchesGeo = filterGeo ? m.geography.toLowerCase().includes(filterGeo.toLowerCase()) : true;
    return matchesLang && matchesGeo;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Colorful Header Section with User Welcome */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl shadow-xl border-l-8 border-indigo-600">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-950 tracking-tight">Audience Manager</h1>
            <p className="text-slate-600 mt-2 max-w-xl text-base">
              Welcome back, <span className="font-semibold text-indigo-600">{currentUser}</span>! Segment your audience for targeted, multilingual mass communication workflows.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-5 py-2.5 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-full border border-indigo-100 shadow-inner">
              Total Members: {members.length}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Indigo Accent Form Section */}
          <div className="lg:col-span-1 bg-white p-8 rounded-3xl shadow-xl border border-indigo-100 flex flex-col space-y-6">
            <div className="pb-4 border-b border-indigo-50">
              <h2 className="text-2xl font-bold text-slate-950">Add Member</h2>
              <p className="text-sm text-slate-500 mt-1">Populate your audience base.</p>
            </div>
            
            <form onSubmit={handleAddMember} className="space-y-6">
              {[
                { label: 'Full Name', value: name, setter: setName, placeholder: 'e.g. John Doe', req: true },
                { label: 'Language Code', value: language, setter: setLanguage, placeholder: 'e.g. hi, te, en', req: true },
                { label: 'Geography', value: geography, setter: setGeography, placeholder: 'e.g. Bihar, Telangana', req: false },
                { label: 'Occupation', value: occupation, setter: setOccupation, placeholder: 'e.g. Farmer, Teacher', req: false },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1.5">{field.label}</label>
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={(e) => field.setter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    required={field.req}
                  />
                </div>
              ))}

              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base rounded-xl shadow-lg transition-all transform hover:scale-[1.02]"
              >
                + Add Member
              </button>
            </form>
          </div>

          {/* Table View & Blue Filter Section */}
          <div className="lg:col-span-3 bg-white p-8 rounded-3xl shadow-xl border border-blue-100 space-y-6">
            
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pb-6 border-b border-blue-50">
              <h2 className="text-2xl font-bold text-slate-950">Segments</h2>
              <div className="flex gap-3 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Filter Language..."
                  value={filterLang}
                  onChange={(e) => setFilterLang(e.target.value)}
                  className="px-4 py-2.5 bg-blue-50/50 border border-blue-100 rounded-xl text-sm w-full sm:w-44 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Filter Region..."
                  value={filterGeo}
                  onChange={(e) => setFilterGeo(e.target.value)}
                  className="px-4 py-2.5 bg-blue-50/50 border border-blue-100 rounded-xl text-sm w-full sm:w-44 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Audience Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-blue-100 text-xs font-bold text-blue-900 uppercase tracking-widest">
                    <th className="py-4 px-5">Name</th>
                    <th className="py-4 px-5">Language</th>
                    <th className="py-4 px-5">Geography</th>
                    <th className="py-4 px-5">Occupation</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50/50 text-sm">
                  {filteredMembers.length > 0 ? (
                    filteredMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-blue-50/50 transition">
                        <td className="py-4 px-5 font-semibold text-slate-950">{m.name}</td>
                        <td className="py-4 px-5">
                          <span className="px-3.5 py-1.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-lg uppercase border border-blue-200 shadow-sm">
                            {m.language}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-slate-700">{m.geography}</td>
                        <td className="py-4 px-5 text-slate-700">{m.occupation}</td>
                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="text-xs text-amber-900 hover:text-white font-bold px-4 py-2 bg-amber-100 hover:bg-amber-600 rounded-lg border border-amber-200 transition-all shadow-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-blue-900 text-base font-medium">
                        No members found. Try adjusting your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
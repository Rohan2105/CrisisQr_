'use client';

import { Frame } from '@/components/Frame';
import { ShieldAlert, Edit2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { updateFamilyMember } from '@/app/actions/family';

export default function FamilyStatus() {
  const [members, setMembers] = useState<any[]>([]);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function fetchMembers() {
    const res = await fetch('/api/citizen/family');
    const json = await res.json();
    if (json.success) {
      setMembers(json.data.members || []);
    } else {
      // Fallback mock for demo if no real data
      setMembers([
        { id: '1', name: 'Ramesh Kumar', age: 45, bloodGroup: 'O+', medicalConditions: 'None' },
        { id: '2', name: 'Sunita Kumar', age: 42, bloodGroup: 'A+', medicalConditions: 'Asthma' },
        { id: '3', name: 'Aarav Kumar', age: 12, bloodGroup: 'O+', medicalConditions: 'None' },
        { id: '4', name: 'Prem Kumar', age: 72, bloodGroup: 'B-', medicalConditions: 'Diabetes, Hypertension' },
      ]);
    }
  }

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateFamilyMember(formData);
    if (result.success) {
      setEditingMember(null);
      fetchMembers();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 relative">
      <div className="flex justify-between items-end border-b border-border pb-4">
        <div>
          <h2 className="text-3xl font-bold uppercase tracking-wider">Family Status</h2>
          <p className="text-muted-foreground font-mono">Manage members and vital health data.</p>
        </div>
        <button className="brutalist-button px-6">ADD MEMBER</button>
      </div>

      <Frame title="Registered Members Data Grid" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted border-b border-border text-xs uppercase tracking-wider font-bold">
                <th className="p-4 border-r border-border">Name</th>
                <th className="p-4 border-r border-border w-24">Age</th>
                <th className="p-4 border-r border-border w-32">Blood Group</th>
                <th className="p-4 border-r border-border">Conditions</th>
                <th className="p-4 w-20">Action</th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              {members.map((member, idx) => (
                <tr key={member.id} className={`border-b border-border hover:bg-muted/50 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/5'}`}>
                  <td className="p-4 border-r border-border font-bold uppercase">{member.name}</td>
                  <td className="p-4 border-r border-border">{member.age}</td>
                  <td className="p-4 border-r border-border text-status-critical font-bold">{member.bloodGroup || 'N/A'}</td>
                  <td className="p-4 border-r border-border">
                    {member.medicalConditions && member.medicalConditions !== 'None' ? (
                      <span className="flex items-center gap-2 text-status-high font-bold italic">
                        <ShieldAlert size={14} /> {member.medicalConditions}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Stable</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => setEditingMember(member)}
                      className="text-primary hover:text-black transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Frame>

      {/* Edit Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <Frame title={`Edit Member: ${editingMember.name}`}>
              <form onSubmit={handleEditSubmit} className="flex flex-col gap-5 p-4">
                <input type="hidden" name="id" value={editingMember.id} />
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase">Full Name</label>
                  <input 
                    name="name" 
                    defaultValue={editingMember.name} 
                    className="brutalist-border p-2 bg-background font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase">Age</label>
                    <input 
                      name="age" 
                      type="number" 
                      defaultValue={editingMember.age} 
                      className="brutalist-border p-2 bg-background font-mono text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase">Blood Group</label>
                    <select 
                      name="bloodGroup" 
                      defaultValue={editingMember.bloodGroup} 
                      className="brutalist-border p-2 bg-background font-mono text-sm"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase">Medical Conditions</label>
                  <textarea 
                    name="medicalConditions" 
                    defaultValue={editingMember.medicalConditions} 
                    className="brutalist-border p-2 bg-background font-mono text-sm min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <button 
                    type="button" 
                    onClick={() => setEditingMember(null)}
                    className="brutalist-button-outline flex items-center justify-center gap-2"
                  >
                    <X size={16} /> CANCEL
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="brutalist-button bg-primary border-primary flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'SAVING...' : 'UPDATE RECORD'}
                  </button>
                </div>
              </form>
            </Frame>
          </div>
        </div>
      )}
    </div>
  );
}

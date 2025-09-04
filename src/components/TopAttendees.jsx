'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function TopAttendees() {
  const [attendees, setAttendees] = useState([]);

  useEffect(() => {
    let mounted = true;
    const fetchTop = async () => {
      try {
        const snap = await getDocs(collection(db, 'attendance'));
        const studentsSnap = await getDocs(collection(db, 'students'));
        const nameMap = {};
        studentsSnap.forEach(d=> nameMap[d.id]=d.data().name||'Unknown');

        const counts = {};
        snap.forEach(d=>{
          const data = d.data();
          if (data && data.present && data.studentId) {
            counts[data.studentId] = (counts[data.studentId]||0)+1;
          }
        });

        const arr = Object.entries(counts).map(([id,c])=>({id,name:nameMap[id]||'Unknown',count:c}))
          .sort((a,b)=>b.count-a.count).slice(0,8);
        if (mounted) setAttendees(arr);
      } catch(e){ console.error(e) }
    };
    fetchTop();
    return ()=> mounted=false;
  },[]);

  return (
    <div className="bg-white rounded-2xl shadow p-6 h-full">
      <h2 className="text-xl font-semibold mb-4">🏆 Top Attendees (Last 30 days)</h2>
      {attendees.length===0 ? (
        <p className="text-gray-500">No attendance records.</p>
      ) : (
        <ul className="space-y-2">
          {attendees.map(a=>(
            <li key={a.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div className="font-medium text-gray-800">{a.name}</div>
              <div className="text-sm text-gray-700">{a.count}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

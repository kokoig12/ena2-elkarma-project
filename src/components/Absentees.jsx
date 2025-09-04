'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Absentees() {
  const [abs, setAbs] = useState([]);

  useEffect(() => {
    let mounted = true;
    const fetchAbs = async () => {
      try {
        const snap = await getDocs(collection(db, 'attendance'));
        const records = [];
        snap.forEach(d=>{
          const data = d.data();
          if (data && data.date) records.push({id:d.id,...data});
        });
        if (records.length===0) { if(mounted) setAbs([]); return; }
        records.sort((a,b)=>{
          const ad = a.date.toDate ? a.date.toDate() : new Date(a.date);
          const bd = b.date.toDate ? b.date.toDate() : new Date(b.date);
          return bd - ad;
        });
        const lastDate = records[0].date.toDate ? records[0].date.toDate() : new Date(records[0].date);
        const lastDay = lastDate.toDateString();
        const lastRec = records.filter(r=>{
          const rd = r.date.toDate ? r.date.toDate() : new Date(r.date);
          return rd.toDateString()===lastDay;
        });
        const absent = lastRec.filter(r=>!r.present).map(r=>r.studentId);
        if (mounted) setAbs(absent.slice(0,10));
      } catch(e){ console.error(e) }
    };
    fetchAbs();
    return ()=> mounted=false;
  },[]);

  return (
    <div className="bg-white rounded-2xl shadow p-6 h-full">
      <h2 className="text-xl font-semibold mb-4">🚫 Absentees - Last Recorded Day</h2>
      {abs.length===0 ? (
        <p className="text-gray-500">No data</p>
      ) : (
        <ul className="space-y-2">
          {abs.map(id=> <li key={id} className="p-2 bg-red-50 rounded">{id}</li>)}
        </ul>
      )}
    </div>
  );
}

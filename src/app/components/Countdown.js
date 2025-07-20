'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, limit, query } from 'firebase/firestore';
import { db } from '../firebase/clientApp';

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState(null);
  const [startDate, setStartDate] = useState(null);

  useEffect(() => {
    async function fetchStartDate() {
      const q = query(collection(db, 'campaigns'), orderBy('created', 'desc'), limit(1));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        const date = data.startDate.toDate ? data.startDate.toDate() : new Date(data.startDate.seconds * 1000);
        setStartDate(date);
      }
    }

    fetchStartDate();
  }, []);

  useEffect(() => {
    if (!startDate) return;

    const timer = setInterval(() => {
      const now = new Date();
      const diff = startDate - now;

      if (diff <= 0) {
        setTimeLeft(null);
        clearInterval(timer);
        return;
      }

      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const hours = Math.floor((diff / 1000 / 60 / 60) % 24);
      const days = Math.floor((diff / 1000 / 60 / 60 / 24) % 7);
      const weeks = Math.floor(diff / 1000 / 60 / 60 / 24 / 7);

      setTimeLeft({ weeks, days, hours, minutes });
    }, 1000);

    return () => clearInterval(timer);
  }, [startDate]);

  if (!startDate) return <div className="text-white">Loading campaign...</div>;
  if (!timeLeft) return <div className="text-white">Campaign live now!</div>;

  return (
    <div
      className="inter cursor-pointer w-full px-2 py-2 w-full bg-gradient-to-r from-pink-600 to-orange-700 text-white"
      
    >
      <div className="flex sm:flex-nowrap flex-wrap justify-center items-center">
        <div className="w-full sm:w-auto text-center">
          <h3 className="font-semibold text-sm tracking-tight mr-2">Next Campaign Launches</h3>
        </div>
        <div className="w-full sm:w-auto flex space-x-1 flex justify-center">
          {['Weeks', 'Days', 'Hours', 'Min'].map((label, i) => {
            const val = [timeLeft.weeks, timeLeft.days, timeLeft.hours, timeLeft.minutes][i];
            return (
              <div
                key={label}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                className="w-12 p-1 rounded text-center font-pangea"
              >
                <div className="text-lg font-bold">{val}</div>
                <div className="-mt-2 text-[9px] tracking-tight font-semibold">{label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

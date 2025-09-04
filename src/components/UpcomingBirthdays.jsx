"use client";

import React, { useEffect, useState } from "react";
import { getStudents } from "@/lib/db";

const parseDOB = (dob) => {
  if (!dob) return null;
  if (typeof dob === "object" && typeof dob.toDate === "function") {
    return dob.toDate();
  }
  if (typeof dob === "object" && typeof dob.seconds === "number") {
    return new Date(dob.seconds * 1000);
  }
  if (typeof dob === "string") {
    return new Date(dob);
  }
  if (dob instanceof Date) return dob;
  try {
    return new Date(dob);
  } catch (e) {
    return null;
  }
};

const calculateAge = (dob) => {
  const birthDate = parseDOB(dob);
  if (!birthDate) return "Unknown";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear()+1;
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const daysLeft = (dob) => {
  const b = parseDOB(dob);
  if (!b) return Infinity;
  const today = new Date();
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let nextBirthday = new Date(todayMid.getFullYear(), b.getMonth(), b.getDate());
  if (nextBirthday < todayMid) {
    nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
  }
  const diff = nextBirthday - todayMid;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export default function UpcomingBirthdays({ days = 3 }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchStudents = async () => {
      try {
        const data = await getStudents();
        if (!mounted) return;
        setStudents(data || []);
      } catch (err) {
        console.error("Error loading students for birthdays:", err);
        setStudents([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchStudents();
    return () => { mounted = false; };
  }, []);

  const upcoming = students
    .map((s) => ({ ...s, _daysLeft: daysLeft(s.dateOfBirth || s.dob || s.DOB) }))
    .filter((s) => typeof s._daysLeft === "number" && s._daysLeft >= 0 && s._daysLeft <= days)
    .sort((a, b) => a._daysLeft - b._daysLeft);

  return (
    <div className="w-full p-6 bg-white shadow rounded-xl">
      <h2 className="text-2xl font-bold mb-2">🎉 Coming Birthdays</h2>
      <p className="text-sm text-gray-600 mb-4">Next {days} day{days > 1 ? "s" : ""}</p>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : upcoming && upcoming.length > 0 ? (
        <ul className="space-y-4">
          {upcoming.map((person, idx) => (
            <li key={person.id || idx} className="p-4 border rounded-lg shadow-sm flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-semibold">🎈 {person.name || person.fullName || "Unknown"}</p>
                <p className="text-sm text-gray-600">Age: {calculateAge(person.dateOfBirth || person.dob || person.DOB)}</p>
                <p className="text-sm text-gray-600">Phone: {person.phone || person.mobile || "N/A"}</p>
              </div>
              <div className="mt-2 md:mt-0 text-right">
                <p className="text-md font-medium text-blue-600">🎂 {person._daysLeft} day{person._daysLeft === 1 ? "" : "s"} left</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No birthdays in the next {days} days.</p>
      )}
    </div>
  );
}

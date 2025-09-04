'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRightIcon, PencilSquareIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function StudentsPage() {
  const router = useRouter();

  // Data states
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    fatherPhone: '',
    motherPhone: '',
    dateOfBirth: '',
    yearOfStudy: '',
    churchFatherName: '',
    address: '',
    gender: '',
    studentType: '', // new field for type (new/returning or other)
  });
  const [editingId, setEditingId] = useState(null);

  // Validation
  const phoneRegex = /^(010|011|012|015)\d{8}$/;
  const [phoneError, setPhoneError] = useState('');

  // Fetch students on mount
  useEffect(() => {
    fetchStudents();
  }, []);

  // Filtering logic: search + gender + type
  useEffect(() => {
    let res = Array.isArray(students) ? students.slice() : [];

    // text search (name, phone, father/mother phone, churchFatherName, yearOfStudy)
    const q = (searchQuery || '').toString().trim().toLowerCase();
    if (q) {
      res = res.filter((s) => {
        const name = (s.name || '').toString().toLowerCase();
        const phone = (s.phone || s.mobile || '').toString().toLowerCase();
        const fatherPhone = (s.fatherPhone || '').toString().toLowerCase();
        const motherPhone = (s.motherPhone || '').toString().toLowerCase();
        const churchFather = (s.churchFatherName || '').toString().toLowerCase();
        const year = (s.yearOfStudy || '').toString().toLowerCase();
        return (
          name.includes(q) ||
          phone.includes(q) ||
          fatherPhone.includes(q) ||
          motherPhone.includes(q) ||
          churchFather.includes(q) ||
          year.includes(q)
        );
      });
    }

    // gender filter
    if (genderFilter && genderFilter !== 'all') {
      res = res.filter((s) => ((s.gender || '').toString().toLowerCase() === genderFilter.toString().toLowerCase()));
    }

    // type filter (studentType or type)
    if (typeFilter && typeFilter !== 'all') {
      res = res.filter((s) => {
        const t = ((s.studentType || s.type || s.student_type || '')).toString().toLowerCase();
        return t === typeFilter.toString().toLowerCase();
      });
    }

    setFilteredStudents(res);
  }, [students, searchQuery, genderFilter, typeFilter]);

  // Firestore fetch
  const fetchStudents = async () => {
    try {
      const qSnap = await getDocs(collection(db, 'students'));
      const list = qSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setStudents(list);
      setFilteredStudents(list);
    } catch (err) {
      console.error('fetchStudents error', err);
      toast.error('Error fetching students');
    }
  };

  // Submit (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // basic phone validations (main phone and optional parents)
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      setPhoneError("Phone must start with 010, 011, 012, or 015 and be 11 digits.");
      return;
    }
    if (formData.fatherPhone && !phoneRegex.test(formData.fatherPhone)) {
      setPhoneError("Father's phone must start with 010, 011, 012, or 015 and be 11 digits.");
      return;
    }
    if (formData.motherPhone && !phoneRegex.test(formData.motherPhone)) {
      setPhoneError("Mother's phone must start with 010, 011, 012, or 015 and be 11 digits.");
      return;
    }
    setPhoneError('');

    try {
      if (editingId) {
        await updateDoc(doc(db, 'students', editingId), formData);
        toast.success('Student updated successfully');
      } else {
        await addDoc(collection(db, 'students'), formData);
        toast.success('Student added successfully');
      }
      // reset form
      setFormData({
        name: '',
        phone: '',
        fatherPhone: '',
        motherPhone: '',
        dateOfBirth: '',
        yearOfStudy: '',
        churchFatherName: '',
        address: '',
        gender: '',
        studentType: '',
      });
      setEditingId(null);
      fetchStudents();
    } catch (err) {
      console.error('handleSubmit error', err);
      toast.error('Error saving student');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      await deleteDoc(doc(db, 'students', id));
      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (err) {
      console.error('handleDelete error', err);
      toast.error('Error deleting student');
    }
  };

  const handleEdit = (student) => {
    setFormData({
      name: student.name || '',
      phone: student.phone || '',
      fatherPhone: student.fatherPhone || '',
      motherPhone: student.motherPhone || '',
      dateOfBirth: student.dateOfBirth || '',
      yearOfStudy: student.yearOfStudy || '',
      churchFatherName: student.churchFatherName || '',
      address: student.address || '',
      gender: student.gender || '',
      studentType: student.studentType || student.type || '',
    });
    setEditingId(student.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRowClick = (studentId) => {
    router.push(`/students/${studentId}`);
  };

  const handleActionClick = (e, action) => {
    e.stopPropagation();
    action();
  };

  return (
    <ProtectedRoute>
      <div className="space-y-8 p-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800">Student Management</h1>

        {/* Search + Filters row */}
        <div className="flex flex-col md:flex-row md:items-end md:gap-4 gap-3">
          {/* Search Bar */}
          <div className="relative w-full md:w-1/2 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, phone, or other details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>

          {/* Gender Filter */}
          <div className="w-full md:w-1/6 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Gender</label>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white"
            >
              <option value="all">All</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="w-full md:w-1/6 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white"
            >
              <option value="all">All</option>
              <option value="new">New</option>
              <option value="returning">Returning</option>
            </select>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white p-4 md:p-8 rounded-xl shadow-lg border border-gray-100 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="Enter student name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Father's Phone</label>
                <input
                  type="tel"
                  placeholder="Enter father's phone"
                  value={formData.fatherPhone}
                  onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value })}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Phone</label>
                <input
                  type="tel"
                  placeholder="Enter mother's phone"
                  value={formData.motherPhone}
                  onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value })}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year of Study</label>
                <select
                  value={formData.yearOfStudy}
                  onChange={(e) => setFormData({ ...formData, yearOfStudy: e.target.value })}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white"
                >
                  <option value="">Select Year of Study</option>
                  <option value="الصف الأول الابتدائي">الصف الأول الابتدائي</option>
                  <option value="الصف الثاني الابتدائي">الصف الثاني الابتدائي</option>
                  <option value="الصف الثالث الابتدائي">الصف الثالث الابتدائي</option>
                  <option value="الصف الرابع الابتدائي">الصف الرابع الابتدائي</option>
                  <option value="الصف الخامس الابتدائي">الصف الخامس الابتدائي</option>
                  <option value="الصف السادس الابتدائي">الصف السادس الابتدائي</option>
                  <option value="الصف الأول الإعدادي">الصف الأول الإعدادي</option>
                  <option value="الصف الثاني الإعدادي">الصف الثاني الإعدادي</option>
                  <option value="الصف الثالث الإعدادي">الصف الثالث الإعدادي</option>
                  <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                  <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
                  <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
                  <option value="المرحلة الجامعية">المرحلة الجامعية</option>
                  <option value="خريج">خريج</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Type</label>
                <select
                  value={formData.studentType}
                  onChange={(e) => setFormData({ ...formData, studentType: e.target.value })}
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white"
                >
                  <option value="">Select Type</option>
                  <option value="new">New</option>
                  <option value="returning">Returning</option>
                </select>
              </div>
            </div>
          </div>

          {phoneError && <p className="text-red-600 text-sm mt-1">{phoneError}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              className="w-full md:w-auto bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-3 rounded-lg shadow hover:from-blue-600 hover:to-blue-800 transition font-semibold"
            >
              {editingId ? 'Update Student' : 'Add Student'}
            </button>
          </div>
        </form>

        {/* Students List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year of Study</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-blue-50 transition cursor-pointer group"
                    onClick={() => handleRowClick(student.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-blue-900">
                      <div className="flex items-center gap-2 group-hover:underline">
                        {student.name}
                        <ArrowRightIcon className="w-4 h-4 text-blue-400 group-hover:text-blue-600" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{student.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{student.yearOfStudy}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{student.studentType || student.type || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                      <button
                        onClick={(e) => handleActionClick(e, () => handleEdit(student))}
                        className="p-2 rounded-full bg-yellow-100 hover:bg-yellow-200 text-yellow-700 transition"
                        title="Edit"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => handleActionClick(e, () => handleDelete(student.id))}
                        className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-700 transition"
                        title="Delete"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

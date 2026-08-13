'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Assignment {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  createdByName: string;
}

export default function DashboardPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!token) {
      router.push('/login');
      return;
    }

    if (storedUser) setUser(JSON.parse(storedUser));

    fetchAssignments();
  }, [router]);

  const fetchAssignments = async () => {
    try {
      const res = await api.get('/Assignments');
      setAssignments(res.data);
    } catch (err) {
      console.error('Failed to fetch assignments', err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Assignments Dashboard</h1>
            {user && <p className="text-sm text-gray-600">Welcome, {user.username} ({user.role})</p>}
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">All Assignments</h2>
          {assignments.length === 0 ? (
            <p className="text-gray-500 bg-white p-4 rounded shadow">No assignments found.</p>
          ) : (
            assignments.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-lg shadow border border-gray-100">
                <h3 className="text-md font-bold text-gray-800">{item.title}</h3>
                <p className="text-gray-600 my-2">{item.description}</p>
                <div className="flex justify-between text-xs text-gray-400 mt-4">
                  <span>Created By: {item.createdByName}</span>
                  <span>Due Date: {new Date(item.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
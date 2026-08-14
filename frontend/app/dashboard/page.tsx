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

  // New Assignment Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

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

  // Create Assignment Handler
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Frontend Check: Due Date Validation
    const selectedDate = new Date(dueDate);
    const now = new Date();
    if (selectedDate < now) {
      setFormError('Due date cannot be in the past.');
      return;
    }

    try {
      await api.post('/Assignments', {
        title,
        description,
        dueDate: selectedDate.toISOString(),
      });

      setFormSuccess('Assignment created successfully!');
      setTitle('');
      setDescription('');
      setDueDate('');
      fetchAssignments(); // Refresh assignment list
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create assignment.');
    }
  };

  // Delete Assignment Handler
  const handleDeleteAssignment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      await api.delete(`/Assignments/${id}`);
      fetchAssignments(); // Refresh list after deletion
    } catch (err) {
      alert('Failed to delete assignment.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header Bar */}
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
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

        {/* Create Assignment Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Create New Assignment</h2>

          {formError && <p className="mb-4 text-sm text-red-600 bg-red-100 p-2 rounded">{formError}</p>}
          {formSuccess && <p className="mb-4 text-sm text-green-600 bg-green-100 p-2 rounded">{formSuccess}</p>}

          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full p-2 border rounded-md text-black"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full p-2 border rounded-md text-black"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="datetime-local"
                value={dueDate}
                min={new Date().toISOString().slice(0, 16)} // অতীতের তারিখ লক করার জন্য
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 w-full p-2 border rounded-md text-black"
                required
              />
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Add Assignment
            </button>
          </form>
        </div>

        {/* Assignment List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700">All Assignments</h2>
          {assignments.length === 0 ? (
            <p className="text-gray-500 bg-white p-4 rounded shadow">No assignments found.</p>
          ) : (
            assignments.map((item) => {
              const isExpired = new Date(item.dueDate) < new Date();

              return (
                <div key={item.id} className="bg-white p-4 rounded-lg shadow border border-gray-100 relative">
                  <div className="flex justify-between items-start">
                    <h3 className="text-md font-bold text-gray-800">{item.title}</h3>
                    <button
                      onClick={() => handleDeleteAssignment(item.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="text-gray-600 my-2">{item.description}</p>
                  
                  <div className="flex justify-between items-center text-xs text-gray-400 mt-4">
                    <span>Created By: {item.createdByName}</span>
                    
                    <div className="flex items-center gap-2">
                      <span>Due Date: {new Date(item.dueDate).toLocaleDateString()}</span>
                      
                      {/* Active/Expired Badge */}
                      {isExpired ? (
                        <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-xs font-semibold">
                          Expired
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded text-xs font-semibold">
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
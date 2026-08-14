'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api'; // আপনার Axios Instance path

interface Assignment {
  id: number;
  title: string;
  description: string;
  courseName?: string;
  dueDate: string;
  createdAt: string;
  createdByName: string;
}

interface Submission {
  id: number;
  assignmentId: number;
  studentId?: number;
  studentName?: string;
  content: string;
  submittedAt: string;
  status: string;
  marks?: number;
  feedback?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  
  // Form States (Create Assignment)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseName, setCourseName] = useState('');
  const [dueDate, setDueDate] = useState('');

  // Submission & Grading States
  const [activeTab, setActiveTab] = useState<'assignments' | 'mySubmissions'>('assignments');
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState<number | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  
  const [viewingSubmissionsId, setViewingSubmissionsId] = useState<number | null>(null);
  const [teacherSubmissionsList, setTeacherSubmissionsList] = useState<Submission[]>([]);
  const [mySubmissionsList, setMySubmissionsList] = useState<Submission[]>([]);

  // Grading Modal States
  const [gradingSubmissionId, setGradingSubmissionId] = useState<number | null>(null);
  const [marks, setMarks] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

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

  const fetchMySubmissions = async () => {
    try {
      const res = await api.get('/Submissions/my-submissions');
      setMySubmissionsList(res.data);
    } catch (err) {
      console.error('Failed to fetch my submissions', err);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/Assignments', { title, description, courseName, dueDate });
      setTitle('');
      setDescription('');
      setCourseName('');
      setDueDate('');
      fetchAssignments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create assignment');
    }
  };

  const handleDeleteAssignment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await api.delete(`/Assignments/${id}`);
      fetchAssignments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete assignment');
    }
  };

  // Student: Submit Assignment Handler
  const handleSubmitAssignment = async (assignmentId: number) => {
    if (!submissionContent.trim()) {
      alert('Please enter your response or link before submitting.');
      return;
    }
    try {
      const res = await api.post(`/Submissions/assignment/${assignmentId}`, { content: submissionContent });
      alert(res.data.message);
      setSubmittingAssignmentId(null);
      setSubmissionContent('');
      if (user?.role === 'Student') fetchMySubmissions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit assignment.');
    }
  };

  // Teacher: View Submissions for an Assignment
  const handleViewSubmissions = async (assignmentId: number) => {
    try {
      const res = await api.get(`/Submissions/assignment/${assignmentId}`);
      setTeacherSubmissionsList(res.data);
      setViewingSubmissionsId(assignmentId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to fetch submissions.');
    }
  };

  // Teacher: Grade Submission Handler
  const handleGradeSubmission = async (submissionId: number) => {
    try {
      await api.put(`/Submissions/${submissionId}/grade`, {
        marks: parseFloat(marks),
        feedback: feedback
      });
      alert('Graded successfully!');
      setGradingSubmissionId(null);
      setMarks('');
      setFeedback('');
      if (viewingSubmissionsId) handleViewSubmissions(viewingSubmissionsId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to grade submission.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto bg-white p-4 rounded shadow mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Assignments Dashboard</h1>
          <p className="text-sm text-gray-600">
            Welcome, <span className="font-semibold text-blue-600">{user?.username}</span> ({user?.role})
          </p>
        </div>
        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-semibold">
          Logout
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => { setActiveTab('assignments'); setViewingSubmissionsId(null); }}
            className={`px-4 py-2 rounded font-semibold text-sm ${activeTab === 'assignments' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
          >
            All Assignments
          </button>
          {user?.role === 'Student' && (
            <button
              onClick={() => { setActiveTab('mySubmissions'); fetchMySubmissions(); }}
              className={`px-4 py-2 rounded font-semibold text-sm ${activeTab === 'mySubmissions' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            >
              My Submissions
            </button>
          )}
        </div>

        {/* TAB 1: ALL ASSIGNMENTS */}
        {activeTab === 'assignments' && (
          <>
            {/* Create Assignment Form (Only for Teacher/Admin) */}
            {(user?.role === 'Teacher' || user?.role === 'Admin') && (
              <div className="bg-white p-6 rounded shadow mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Create New Assignment</h2>
                <form onSubmit={handleCreateAssignment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Course / Class Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CSE101 or Class 10 - Math"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      className="w-full border rounded p-2 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full border rounded p-2 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full border rounded p-2 text-sm mt-1"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Due Date</label>
                    <input
                      type="datetime-local"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full border rounded p-2 text-sm mt-1"
                    />
                  </div>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold">
                    Add Assignment
                  </button>
                </form>
              </div>
            )}

            {/* Submissions Modal/Section for Teacher */}
            {viewingSubmissionsId && (user?.role === 'Teacher' || user?.role === 'Admin') && (
              <div className="bg-white p-6 rounded shadow mb-6 border-2 border-blue-500">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Submissions for Assignment #{viewingSubmissionsId}</h3>
                  <button onClick={() => setViewingSubmissionsId(null)} className="text-sm text-red-500 font-semibold">Close</button>
                </div>

                {teacherSubmissionsList.length === 0 ? (
                  <p className="text-sm text-gray-500">No submissions yet for this assignment.</p>
                ) : (
                  <div className="space-y-4">
                    {teacherSubmissionsList.map((sub) => (
                      <div key={sub.id} className="border p-4 rounded bg-gray-50">
                        <div className="flex justify-between">
                          <span className="font-bold text-sm">Student: {sub.studentName}</span>
                          <span className={`text-xs px-2 py-1 rounded font-semibold ${sub.status === 'On-Time' ? 'bg-green-100 text-green-700' : sub.status === 'Graded' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                            {sub.status}
                          </span>
                        </div>
                        <p className="text-sm mt-2 bg-white p-2 border rounded"><strong>Submitted Content:</strong> {sub.content}</p>
                        <p className="text-xs text-gray-500 mt-1">Submitted at: {new Date(sub.submittedAt).toLocaleString()}</p>

                        {/* Grading Info */}
                        {sub.marks !== null && sub.marks !== undefined ? (
                          <div className="mt-3 bg-green-50 p-2 border border-green-200 rounded text-sm">
                            <p><strong>Marks:</strong> {sub.marks}</p>
                            <p><strong>Feedback:</strong> {sub.feedback || 'N/A'}</p>
                          </div>
                        ) : (
                          <div className="mt-3">
                            {gradingSubmissionId === sub.id ? (
                              <div className="space-y-2 border-t pt-2">
                                <input
                                  type="number"
                                  placeholder="Marks (e.g. 85)"
                                  value={marks}
                                  onChange={(e) => setMarks(e.target.value)}
                                  className="border p-1 text-sm rounded w-full"
                                />
                                <textarea
                                  placeholder="Feedback"
                                  value={feedback}
                                  onChange={(e) => setFeedback(e.target.value)}
                                  className="border p-1 text-sm rounded w-full"
                                />
                                <div className="flex gap-2">
                                  <button onClick={() => handleGradeSubmission(sub.id)} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold">
                                    Save Grade
                                  </button>
                                  <button onClick={() => setGradingSubmissionId(null)} className="bg-gray-400 text-white px-3 py-1 rounded text-xs font-semibold">
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => setGradingSubmissionId(sub.id)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold">
                                Grade Submission
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Assignments List */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800">All Assignments</h2>
              {assignments.map((item) => {
                const now = new Date();
                const due = new Date(item.dueDate);
                const graceEnd = new Date(due.getTime() + 3 * 60 * 60 * 1000); // 3 Hours Grace Period
                
                const isExpired = now > graceEnd;
                const isLateWindow = now > due && now <= graceEnd;

                return (
                  <div key={item.id} className="bg-white p-5 rounded shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        {item.courseName && (
                          <span className="inline-block bg-purple-100 text-purple-700 font-bold text-xs px-2 py-0.5 rounded mb-2">
                            {item.courseName}
                          </span>
                        )}
                        <h3 className="font-bold text-gray-800 text-base">{item.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      </div>
                      {(user?.role === 'Teacher' || user?.role === 'Admin') && (
                        <button onClick={() => handleDeleteAssignment(item.id)} className="text-red-500 hover:text-red-700 text-sm font-semibold">
                          Delete
                        </button>
                      )}
                    </div>

                    <div className="mt-4 flex justify-between items-center text-xs text-gray-500 border-t pt-3">
                      <span>Created By: <strong>{item.createdByName}</strong></span>
                      <div className="flex items-center gap-2">
                        <span>Due Date: {new Date(item.dueDate).toLocaleString()}</span>
                        <span className={`px-2 py-0.5 rounded font-semibold ${isExpired ? 'bg-red-100 text-red-700' : isLateWindow ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                          {isExpired ? 'Closed' : isLateWindow ? 'Late Window (3h Grace)' : 'Active'}
                        </span>
                      </div>
                    </div>

                    {/* Actions for Teacher & Student */}
                    <div className="mt-4">
                      {/* TEACHER ACTION */}
                      {(user?.role === 'Teacher' || user?.role === 'Admin') && (
                        <button
                          onClick={() => handleViewSubmissions(item.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-semibold"
                        >
                          View Submissions
                        </button>
                      )}

                      {/* STUDENT ACTION */}
                      {user?.role === 'Student' && (
                        <div>
                          {isExpired ? (
                            <span className="text-xs text-red-500 font-semibold">Deadline passed. Submission closed.</span>
                          ) : (
                            <div>
                              {submittingAssignmentId === item.id ? (
                                <div className="mt-2 space-y-2">
                                  <textarea
                                    placeholder="Type your submission response or drive link here..."
                                    value={submissionContent}
                                    onChange={(e) => setSubmissionContent(e.target.value)}
                                    className="w-full border rounded p-2 text-sm"
                                    rows={2}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleSubmitAssignment(item.id)}
                                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-semibold"
                                    >
                                      Confirm Submit
                                    </button>
                                    <button
                                      onClick={() => setSubmittingAssignmentId(null)}
                                      className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1.5 rounded text-xs font-semibold"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setSubmittingAssignmentId(item.id)}
                                  className={`px-3 py-1.5 rounded text-xs font-semibold text-white ${isLateWindow ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                                >
                                  {isLateWindow ? 'Submit (Late)' : 'Submit Assignment'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* TAB 2: MY SUBMISSIONS (Student View Only) */}
        {activeTab === 'mySubmissions' && user?.role === 'Student' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800">My Submissions</h2>
            {mySubmissionsList.length === 0 ? (
              <p className="text-sm text-gray-500 bg-white p-4 rounded shadow">You have not submitted any assignments yet.</p>
            ) : (
              mySubmissionsList.map((sub) => (
                <div key={sub.id} className="bg-white p-5 rounded shadow">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-gray-800 text-sm">Assignment ID: #{sub.assignmentId}</span>
                    <span className={`text-xs px-2 py-1 rounded font-semibold ${sub.status === 'On-Time' ? 'bg-green-100 text-green-700' : sub.status === 'Graded' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {sub.status}
                    </span>
                  </div>
                  <p className="text-sm mt-2 text-gray-700"><strong>My Response:</strong> {sub.content}</p>
                  <p className="text-xs text-gray-400 mt-1">Submitted at: {new Date(sub.submittedAt).toLocaleString()}</p>

                  {/* Feedback and Marks */}
                  <div className="mt-3 p-3 bg-gray-50 border rounded text-xs">
                    <p className="font-semibold text-gray-700">Grading Status:</p>
                    {sub.marks !== null && sub.marks !== undefined ? (
                      <div className="mt-1 text-green-700 font-medium">
                        <p>Marks Received: <span className="font-bold text-base">{sub.marks}</span></p>
                        <p>Teacher's Feedback: {sub.feedback || 'None'}</p>
                      </div>
                    ) : (
                      <p className="text-amber-600 mt-1">Pending review from Teacher.</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
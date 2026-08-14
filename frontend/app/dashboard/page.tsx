"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api"; // আপনার Axios Instance path

interface Assignment {
  id: number;
  title: string;
  description: string;
  courseName?: string;
  dueDate: string;
  maxMarks?: number;
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
  marks?: number | null;
  feedback?: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<{
    id: number;
    username: string;
    email: string;
    role: string;
    courseName?: string; // <--- এটি যোগ করুন
  } | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // Form States (Create Assignment)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseName, setCourseName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxMarks, setMaxMarks] = useState<number | string>(100);

  // Edit Assignment Modal States
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(
    null,
  );
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCourseName, setEditCourseName] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editMaxMarks, setEditMaxMarks] = useState<number | string>(100);

  // Filter State
  const [selectedCourseFilter, setSelectedCourseFilter] =
    useState<string>("ALL");

  // Submission & Grading States
  const [activeTab, setActiveTab] = useState<"assignments" | "mySubmissions">(
    "assignments",
  );
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState<
    number | null
  >(null);
  const [submissionContent, setSubmissionContent] = useState("");

  const [viewingSubmissionsId, setViewingSubmissionsId] = useState<
    number | null
  >(null);
  const [teacherSubmissionsList, setTeacherSubmissionsList] = useState<
    Submission[]
  >([]);
  const [mySubmissionsList, setMySubmissionsList] = useState<Submission[]>([]);

  // Grading Modal States
  const [gradingSubmissionId, setGradingSubmissionId] = useState<number | null>(
    null,
  );
  const [marks, setMarks] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token) {
      router.push("/login");
      return;
    }

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.role === "Student") {
          fetchMySubmissions();
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }

    fetchAssignments();
  }, [router]);

  const fetchAssignments = async () => {
    try {
      const res = await api.get("/Assignments");
      setAssignments(res.data);
    } catch (err) {
      console.error("Failed to fetch assignments", err);
    }
  };

  const fetchMySubmissions = async () => {
    try {
      const res = await api.get("/Submissions/my-submissions");
      setMySubmissionsList(res.data);
    } catch (err) {
      console.error("Failed to fetch my submissions", err);
    }
  };

  // Unique Course List for Filtering
  const availableCourses = useMemo(() => {
    const courses = assignments
      .map((a) => a.courseName)
      .filter((c): c is string => Boolean(c && c.trim() !== ""));
    return Array.from(new Set(courses));
  }, [assignments]);

  // Filtered Assignments List
  const filteredAssignments = useMemo(() => {
    if (selectedCourseFilter === "ALL") return assignments;
    return assignments.filter((a) => a.courseName === selectedCourseFilter);
  }, [assignments, selectedCourseFilter]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const numMaxMarks = Number(maxMarks);
    if (numMaxMarks > 100) {
      alert("Max Marks cannot exceed 100!");
      return;
    }
    try {
      await api.post("/Assignments", {
        title,
        description,
        courseName,
        dueDate,
        maxMarks: numMaxMarks || 100,
      });
      setTitle("");
      setDescription("");
      setCourseName("");
      setDueDate("");
      setMaxMarks(100);
      fetchAssignments();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create assignment");
    }
  };

  // Edit Assignment Handlers
  const handleOpenEditModal = (item: Assignment) => {
    setEditingAssignment(item);
    setEditTitle(item.title);
    setEditDescription(item.description);
    setEditCourseName(item.courseName || "");
    setEditDueDate(
      item.dueDate ? new Date(item.dueDate).toISOString().slice(0, 16) : "",
    );
    setEditMaxMarks(item.maxMarks || 100);
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment) return;
    const numMaxMarks = Number(editMaxMarks);
    if (numMaxMarks > 100) {
      alert("Max Marks cannot exceed 100!");
      return;
    }
    try {
      await api.put(`/Assignments/${editingAssignment.id}`, {
        title: editTitle,
        description: editDescription,
        courseName: editCourseName,
        dueDate: editDueDate,
        maxMarks: numMaxMarks || 100,
      });
      alert("Assignment updated successfully!");
      setEditingAssignment(null);
      fetchAssignments();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update assignment");
    }
  };

  const handleDeleteAssignment = async (id: number) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;
    try {
      await api.delete(`/Assignments/${id}`);
      fetchAssignments();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete assignment");
    }
  };

  // Student: Submit/Resubmit Assignment Handler
  const handleSubmitAssignment = async (
    assignmentId: number,
    isResubmit = false,
  ) => {
    if (!submissionContent.trim()) {
      alert("Please enter your response or link before submitting.");
      return;
    }

    try {
      let res;
      if (isResubmit) {
        // ১. আগে জমা দেওয়া Submission টি খুঁজে বের করা
        const existingSub = mySubmissionsList.find(
          (s) => s.assignmentId === assignmentId,
        );

        if (!existingSub) {
          alert("Submission record not found. Please refresh and try again.");
          return;
        }

        // ২. Backend এর [HttpPut("{id}")] অনুযায়ী Submission ID দিয়ে রিকোয়েস্ট পাঠানো
        res = await api.put(`/Submissions/${existingSub.id}`, {
          content: submissionContent,
        });
      } else {
        // ৩. প্রথমবার জমা দেওয়ার জন্য [HttpPost("assignment/{assignmentId}")]
        res = await api.post(`/Submissions/assignment/${assignmentId}`, {
          content: submissionContent,
        });
      }

      alert(
        res.data?.message ||
          (isResubmit
            ? "Assignment resubmitted successfully!"
            : "Assignment submitted successfully!"),
      );
      setSubmittingAssignmentId(null);
      setSubmissionContent("");

      // Data refresh
      fetchAssignments();
      if (user?.role === "Student") fetchMySubmissions();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit assignment.");
    }
  };

  // Teacher: View Submissions for an Assignment
  const handleViewSubmissions = async (assignmentId: number) => {
    try {
      const res = await api.get(`/Submissions/assignment/${assignmentId}`);
      setTeacherSubmissionsList(res.data);
      setViewingSubmissionsId(assignmentId);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to fetch submissions.");
    }
  };

  // Teacher: Grade Submission Handler
  const handleGradeSubmission = async (submissionId: number) => {
    if (!marks) {
      alert("Please enter valid marks.");
      return;
    }
    try {
      await api.put(`/Submissions/${submissionId}/grade`, {
        marks: parseFloat(marks),
        feedback: feedback,
      });
      alert("Graded successfully!");
      setGradingSubmissionId(null);
      setMarks("");
      setFeedback("");
      if (viewingSubmissionsId) handleViewSubmissions(viewingSubmissionsId);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to grade submission.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto bg-white p-4 rounded shadow mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Assignments Dashboard
          </h1>
          <p className="text-sm text-gray-600">
            Welcome,{" "}
            <span className="font-semibold text-blue-600">
              {user?.username || "User"}
            </span>{" "}
            ({user?.role || "Guest"})
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-semibold transition"
        >
          Logout
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Navigation & Course Filter */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => {
                setActiveTab("assignments");
                setViewingSubmissionsId(null);
              }}
              className={`px-4 py-2 rounded font-semibold text-sm transition ${
                activeTab === "assignments"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              All Assignments
            </button>
            {user?.role === "Student" && (
              <button
                onClick={() => {
                  setActiveTab("mySubmissions");
                  fetchMySubmissions();
                }}
                className={`px-4 py-2 rounded font-semibold text-sm transition ${
                  activeTab === "mySubmissions"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                My Submissions
              </button>
            )}
          </div>

          {/* Course Filter Dropdown */}
          {activeTab === "assignments" && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded shadow text-sm">
              <label
                htmlFor="courseFilter"
                className="font-semibold text-gray-600"
              >
                Filter Course:
              </label>
              <select
                id="courseFilter"
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="outline-none bg-transparent font-medium text-gray-800 cursor-pointer"
              >
                <option value="ALL">All Courses ({assignments.length})</option>
                {availableCourses.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: ALL ASSIGNMENTS */}
        {activeTab === "assignments" && (
          <>
            {/* Create Assignment Form (Teacher/Admin Only) */}
            {(user?.role === "Teacher" || user?.role === "Admin") && (
              <div className="bg-white p-6 rounded shadow mb-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  Create New Assignment
                </h2>
                <form onSubmit={handleCreateAssignment} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Course / Class Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. CSE101 or Class 10 - Math"
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        className="w-full border rounded p-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Max Marks (Max 100)
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="100"
                        placeholder="e.g. 100"
                        value={maxMarks}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val > 100) {
                            setMaxMarks(100);
                          } else {
                            setMaxMarks(e.target.value);
                          }
                        }}
                        className="w-full border rounded p-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Assignment Title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full border rounded p-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      required
                      placeholder="Detailed instructions..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full border rounded p-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Due Date
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full border rounded p-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold transition"
                  >
                    Add Assignment
                  </button>
                </form>
              </div>
            )}

            {/* EDIT ASSIGNMENT MODAL */}
            {editingAssignment && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full space-y-4">
                  <h3 className="font-bold text-lg text-gray-800">
                    Edit Assignment
                  </h3>
                  <form onSubmit={handleUpdateAssignment} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">
                        Course Name
                      </label>
                      <input
                        type="text"
                        value={editCourseName}
                        onChange={(e) => setEditCourseName(e.target.value)}
                        className="w-full border p-2 text-sm rounded mt-1 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full border p-2 text-sm rounded mt-1 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600">
                        Description
                      </label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full border p-2 text-sm rounded mt-1 outline-none"
                        rows={3}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600">
                          Max Marks (Max 100)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={editMaxMarks}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (val > 100) {
                              setEditMaxMarks(100);
                            } else {
                              setEditMaxMarks(e.target.value);
                            }
                          }}
                          className="w-full border p-2 text-sm rounded mt-1 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600">
                          Due Date
                        </label>
                        <input
                          type="datetime-local"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                          className="w-full border p-2 text-sm rounded mt-1 outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingAssignment(null)}
                        className="bg-gray-400 text-white px-3 py-1.5 rounded text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-semibold"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* View Submissions Panel for Teacher */}
            {viewingSubmissionsId &&
              (user?.role === "Teacher" || user?.role === "Admin") && (
                <div className="bg-white p-6 rounded shadow mb-6 border-2 border-blue-500">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-gray-800">
                      Submissions for Assignment #{viewingSubmissionsId}
                    </h3>
                    <button
                      onClick={() => setViewingSubmissionsId(null)}
                      className="text-sm text-red-500 font-semibold hover:underline"
                    >
                      Close
                    </button>
                  </div>

                  {teacherSubmissionsList.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No submissions yet for this assignment.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {teacherSubmissionsList.map((sub) => {
                        const currentAssocAssignment = assignments.find(
                          (a) => a.id === sub.assignmentId,
                        );
                        const currentMaxMarks =
                          currentAssocAssignment?.maxMarks || 100;

                        return (
                          <div
                            key={sub.id}
                            className="border p-4 rounded bg-gray-50"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-sm text-gray-800">
                                Student:{" "}
                                {sub.studentName || `ID: ${sub.studentId}`}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded font-semibold ${
                                  sub.status === "On-Time"
                                    ? "bg-green-100 text-green-700"
                                    : sub.status === "Graded"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {sub.status}
                              </span>
                            </div>
                            <p className="text-sm mt-2 bg-white p-2 border rounded text-gray-800">
                              <strong>Submitted Content:</strong> {sub.content}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Submitted at: {formatDate(sub.submittedAt)}
                            </p>

                            {/* Grading Info */}
                            {sub.marks !== null && sub.marks !== undefined ? (
                              <div className="mt-3 bg-green-50 p-2 border border-green-200 rounded text-sm">
                                <p className="text-green-800">
                                  <strong>Marks:</strong> {sub.marks} /{" "}
                                  {currentMaxMarks}
                                </p>
                                <p className="text-green-800">
                                  <strong>Feedback:</strong>{" "}
                                  {sub.feedback || "N/A"}
                                </p>
                              </div>
                            ) : (
                              <div className="mt-3">
                                {gradingSubmissionId === sub.id ? (
                                  <div className="space-y-2 border-t pt-2">
                                    <input
                                      type="number"
                                      max={currentMaxMarks}
                                      placeholder={`Marks (Max ${currentMaxMarks})`}
                                      value={marks}
                                      onChange={(e) => setMarks(e.target.value)}
                                      className="border p-1.5 text-sm rounded w-full outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <textarea
                                      placeholder="Feedback"
                                      value={feedback}
                                      onChange={(e) =>
                                        setFeedback(e.target.value)
                                      }
                                      className="border p-1.5 text-sm rounded w-full outline-none focus:ring-1 focus:ring-blue-500"
                                      rows={2}
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() =>
                                          handleGradeSubmission(sub.id)
                                        }
                                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-semibold transition"
                                      >
                                        Save Grade
                                      </button>
                                      <button
                                        onClick={() => {
                                          setGradingSubmissionId(null);
                                          setMarks("");
                                          setFeedback("");
                                        }}
                                        className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded text-xs font-semibold transition"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setGradingSubmissionId(sub.id);
                                      setMarks("");
                                      setFeedback("");
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold transition"
                                  >
                                    Grade Submission
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            {/* Assignments List */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800">
                All Assignments{" "}
                {selectedCourseFilter !== "ALL" && `(${selectedCourseFilter})`}
              </h2>
              {filteredAssignments.length === 0 ? (
                <p className="text-sm text-gray-500 bg-white p-4 rounded shadow">
                  No assignments found.
                </p>
              ) : (
                filteredAssignments.map((item) => {
                  const now = new Date();
                  const due = new Date(item.dueDate);
                  const graceEnd = new Date(due.getTime() + 3 * 60 * 60 * 1000); // 3 Hours Grace Period

                  const isExpired = now > graceEnd;
                  const isLateWindow = now > due && now <= graceEnd;

                  // Student submission status check for this assignment
                  const existingSubmission = mySubmissionsList.find(
                    (s) => s.assignmentId === item.id,
                  );

                  return (
                    <div key={item.id} className="bg-white p-5 rounded shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            {item.courseName && (
                              <span className="bg-purple-100 text-purple-700 font-bold text-xs px-2 py-0.5 rounded">
                                {item.courseName}
                              </span>
                            )}
                            <span className="bg-gray-100 text-gray-700 font-semibold text-xs px-2 py-0.5 rounded">
                              Max Marks: {item.maxMarks || 100}
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-800 text-base">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">
                            {item.description}
                          </p>
                        </div>
                        {(user?.role === "Teacher" ||
                          user?.role === "Admin") && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-semibold transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAssignment(item.id)}
                              className="text-red-500 hover:text-red-700 text-sm font-semibold transition"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap justify-between items-center gap-2 text-xs text-gray-500 border-t pt-3">
                        <span>
                          Created By: <strong>{item.createdByName}</strong>
                        </span>
                        <div className="flex items-center gap-2">
                          <span>Due Date: {formatDate(item.dueDate)}</span>
                          <span
                            className={`px-2 py-0.5 rounded font-semibold ${
                              isExpired
                                ? "bg-red-100 text-red-700"
                                : isLateWindow
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-green-100 text-green-700"
                            }`}
                          >
                            {isExpired
                              ? "Closed"
                              : isLateWindow
                                ? "Late Window (3h Grace)"
                                : "Active"}
                          </span>
                        </div>
                      </div>

                      {/* Actions for Teacher & Student */}
                      <div className="mt-4">
                        {/* TEACHER ACTION */}
                        {(user?.role === "Teacher" ||
                          user?.role === "Admin") && (
                          <button
                            onClick={() => handleViewSubmissions(item.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-semibold transition"
                          >
                            View Submissions
                          </button>
                        )}

                        {/* STUDENT ACTION */}
                        {user?.role === "Student" && (
                          <div>
                            {isExpired ? (
                              <span className="text-xs text-red-500 font-semibold">
                                Deadline passed. Submission closed.
                              </span>
                            ) : (
                              <div>
                                {submittingAssignmentId === item.id ? (
                                  <div className="mt-2 space-y-2">
                                    <textarea
                                      placeholder="Type your submission response or drive link here..."
                                      value={submissionContent}
                                      onChange={(e) =>
                                        setSubmissionContent(e.target.value)
                                      }
                                      className="w-full border rounded p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                      rows={2}
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() =>
                                          handleSubmitAssignment(
                                            item.id,
                                            Boolean(existingSubmission),
                                          )
                                        }
                                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-semibold transition"
                                      >
                                        {existingSubmission
                                          ? "Confirm Resubmit"
                                          : "Confirm Submit"}
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSubmittingAssignmentId(null);
                                          setSubmissionContent("");
                                        }}
                                        className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1.5 rounded text-xs font-semibold transition"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() => {
                                        setSubmittingAssignmentId(item.id);
                                        setSubmissionContent(
                                          existingSubmission?.content || "",
                                        );
                                      }}
                                      className={`px-3 py-1.5 rounded text-xs font-semibold text-white transition ${
                                        existingSubmission
                                          ? "bg-amber-600 hover:bg-amber-700"
                                          : isLateWindow
                                            ? "bg-amber-600 hover:bg-amber-700"
                                            : "bg-blue-600 hover:bg-blue-700"
                                      }`}
                                    >
                                      {existingSubmission
                                        ? "Resubmit Answer"
                                        : isLateWindow
                                          ? "Submit (Late)"
                                          : "Submit Assignment"}
                                    </button>
                                    {existingSubmission && (
                                      <span className="text-xs text-green-600 font-semibold">
                                        ✓ Already Submitted
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* TAB 2: MY SUBMISSIONS (Student View Only) */}
        {activeTab === "mySubmissions" && user?.role === "Student" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-800">My Submissions</h2>
            {mySubmissionsList.length === 0 ? (
              <p className="text-sm text-gray-500 bg-white p-4 rounded shadow">
                You have not submitted any assignments yet.
              </p>
            ) : (
              mySubmissionsList.map((sub) => {
                const assocAssignment = assignments.find(
                  (a) => a.id === sub.assignmentId,
                );
                const maxMarksVal = assocAssignment?.maxMarks || 100;

                return (
                  <div key={sub.id} className="bg-white p-5 rounded shadow">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-gray-800 text-sm">
                        Assignment:{" "}
                        {assocAssignment?.title || `#${sub.assignmentId}`}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded font-semibold ${
                          sub.status === "On-Time"
                            ? "bg-green-100 text-green-700"
                            : sub.status === "Graded"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>
                    <p className="text-sm mt-2 text-gray-700">
                      <strong>My Response:</strong> {sub.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Submitted at: {formatDate(sub.submittedAt)}
                    </p>

                    {/* Feedback and Marks */}
                    <div className="mt-3 p-3 bg-gray-50 border rounded text-xs">
                      <p className="font-semibold text-gray-700">
                        Grading Status:
                      </p>
                      {sub.marks !== null && sub.marks !== undefined ? (
                        <div className="mt-1 text-green-700 font-medium space-y-1">
                          <p>
                            Marks Received:{" "}
                            <span className="font-bold text-sm">
                              {sub.marks} / {maxMarksVal}
                            </span>
                          </p>
                          <p>Teacher's Feedback: {sub.feedback || "None"}</p>
                        </div>
                      ) : (
                        <p className="text-amber-600 mt-1">
                          Pending review from Teacher.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

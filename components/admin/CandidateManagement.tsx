"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useApi, useApiMutation } from "@/hooks/useApi";
import toast from 'react-hot-toast';
import Image from 'next/image';

interface Candidate {
  id: number;
  name: string;
  nickname?: string;
  image?: string;
  department?: string;
  level?: string;
  position: string;
}

interface Position {
  position: string;
  allowMultiple: boolean;
  candidates: Candidate[];
}

interface NewCandidateForm {
  name: string;
  nickname: string;
  image: string;
  department: string;
  level: string;
}

export default function CandidateManagement() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [newCandidate, setNewCandidate] = useState<NewCandidateForm>({
    name: "",
    nickname: "",
    image: "",
    department: "",
    level: "",
  });
  const [newPosition, setNewPosition] = useState({
    position: "",
    allowMultiple: false,
  });
  const [editingCandidate, setEditingCandidate] = useState<{
    id: number;
    name: string;
    nickname: string;
    image: string;
    department: string;
    level: string;
  } | null>(null);

  // API hooks
  const { data: candidatesData, loading: loadingCandidates, refetch: refetchCandidates } = useApi<{
    success: boolean;
    positions: Position[];
  }>('/candidates');

  const { mutate: createPosition, loading: creatingPosition } = useApiMutation('/positions');
  const { mutate: deletePosition, loading: deletingPosition } = useApiMutation('/positions');
  const { mutate: createCandidate, loading: creatingCandidate } = useApiMutation('/candidates');
  const { mutate: updateCandidate, loading: updatingCandidate } = useApiMutation('/candidates');
  const { mutate: deleteCandidate, loading: deletingCandidate } = useApiMutation('/candidates');

  useEffect(() => {
    if (candidatesData?.positions) {
      setPositions(candidatesData.positions);
    }
  }, [candidatesData]);

  const addPosition = async () => {
    if (!newPosition.position.trim()) {
      toast.error("Please enter a position name");
      return;
    }

    try {
      await createPosition(newPosition);
      setNewPosition({ position: "", allowMultiple: false });
      refetchCandidates();
      toast.success("Position created successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create position");
    }
  };

  const handleDeletePosition = async (positionName: string) => {
    if (!confirm("Are you sure you want to delete this position and all its candidates?")) {
      return;
    }

    try {
      await deletePosition({
        method: 'DELETE',
      }, null, {
        url: `/positions?position=${encodeURIComponent(positionName)}`
      });
      refetchCandidates();
      toast.success("Position deleted successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete position");
    }
  };

  const addCandidate = async () => {
    if (!selectedPosition || !newCandidate.name.trim()) {
      toast.error("Please select a position and enter candidate name");
      return;
    }

    try {
      await createCandidate({
        ...newCandidate,
        position: selectedPosition,
      });
      setNewCandidate({
        name: "",
        nickname: "",
        image: "",
        department: "",
        level: "",
      });
      refetchCandidates();
      toast.success("Candidate added successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to add candidate");
    }
  };

  const handleDeleteCandidate = async (candidateId: number) => {
    if (!confirm("Are you sure you want to delete this candidate?")) {
      return;
    }

    try {
      await deleteCandidate({
        method: 'DELETE',
      }, null, {
        url: `/candidates?id=${candidateId}`
      });
      refetchCandidates();
      toast.success("Candidate deleted successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to delete candidate");
    }
  };

  const startEditCandidate = (candidate: Candidate) => {
    setEditingCandidate({
      id: candidate.id,
      name: candidate.name,
      nickname: candidate.nickname || "",
      image: candidate.image || "",
      department: candidate.department || "",
      level: candidate.level || "",
    });
  };

  const saveEditCandidate = async () => {
    if (!editingCandidate) return;

    try {
      await updateCandidate({
        method: 'PUT',
      }, editingCandidate);
      setEditingCandidate(null);
      refetchCandidates();
      toast.success("Candidate updated successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update candidate");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        if (isEdit && editingCandidate) {
          setEditingCandidate({
            ...editingCandidate,
            image: imageUrl,
          });
        } else {
          setNewCandidate({
            ...newCandidate,
            image: imageUrl,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (loadingCandidates) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          👥 Candidate Management
        </h2>

        {/* Add New Position */}
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Add New Position
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Position name"
              value={newPosition.position}
              onChange={(e) =>
                setNewPosition({ ...newPosition, position: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={creatingPosition}
            />
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowMultiple"
                checked={newPosition.allowMultiple}
                onChange={(e) =>
                  setNewPosition({
                    ...newPosition,
                    allowMultiple: e.target.checked,
                  })
                }
                className="h-4 w-4 text-blue-600"
                disabled={creatingPosition}
              />
              <label htmlFor="allowMultiple" className="text-sm text-gray-700">
                Allow multiple selections
              </label>
            </div>
            <button
              onClick={addPosition}
              disabled={creatingPosition}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingPosition ? "Adding..." : "Add Position"}
            </button>
          </div>
        </div>

        {/* Add New Candidate */}
        <div className="bg-green-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Add New Candidate
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              disabled={creatingCandidate}
            >
              <option value="">Select Position</option>
              {positions.map((position) => (
                <option key={position.position} value={position.position}>
                  {position.position}
                </option>
              ))}
            </select>
            
            <input
              type="text"
              placeholder="Full Name *"
              value={newCandidate.name}
              onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              disabled={creatingCandidate}
            />
            
            <input
              type="text"
              placeholder="Nickname"
              value={newCandidate.nickname}
              onChange={(e) => setNewCandidate({ ...newCandidate, nickname: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              disabled={creatingCandidate}
            />
            
            <input
              type="text"
              placeholder="Department"
              value={newCandidate.department}
              onChange={(e) => setNewCandidate({ ...newCandidate, department: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              disabled={creatingCandidate}
            />
            
            <input
              type="text"
              placeholder="Level (e.g., 100L, 200L)"
              value={newCandidate.level}
              onChange={(e) => setNewCandidate({ ...newCandidate, level: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              disabled={creatingCandidate}
            />

            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e)}
                className="hidden"
                id="candidate-image"
                disabled={creatingCandidate}
              />
              <label
                htmlFor="candidate-image"
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 focus:ring-2 focus:ring-green-500"
              >
                {newCandidate.image ? (
                  <span className="text-green-600">Image Selected ✓</span>
                ) : (
                  <span className="text-gray-600">Upload Image</span>
                )}
              </label>
            </div>
          </div>
          
          <div className="mt-4">
            <button
              onClick={addCandidate}
              disabled={creatingCandidate}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingCandidate ? "Adding..." : "Add Candidate"}
            </button>
          </div>
        </div>

        {/* Positions and Candidates List */}
        <div className="space-y-6">
          {positions.map((position, positionIndex) => (
            <motion.div
              key={position.position}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 rounded-lg p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {position.position}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {position.allowMultiple
                      ? "Multiple selections allowed"
                      : "Single selection only"}
                  </p>
                </div>
                <button
                  onClick={() => handleDeletePosition(position.position)}
                  disabled={deletingPosition}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingPosition ? "Deleting..." : "Delete Position"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {position.candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="bg-white p-4 rounded-lg shadow-sm border"
                  >
                    {editingCandidate?.id === candidate.id ? (
                      <div className="space-y-3">
                        {editingCandidate.image && (
                          <div className="flex justify-center">
                            <Image
                              src={editingCandidate.image}
                              alt="Candidate"
                              width={80}
                              height={80}
                              className="rounded-full object-cover"
                            />
                          </div>
                        )}
                        
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={editingCandidate.name}
                          onChange={(e) =>
                            setEditingCandidate({
                              ...editingCandidate,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          disabled={updatingCandidate}
                        />
                        
                        <input
                          type="text"
                          placeholder="Nickname"
                          value={editingCandidate.nickname}
                          onChange={(e) =>
                            setEditingCandidate({
                              ...editingCandidate,
                              nickname: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          disabled={updatingCandidate}
                        />
                        
                        <input
                          type="text"
                          placeholder="Department"
                          value={editingCandidate.department}
                          onChange={(e) =>
                            setEditingCandidate({
                              ...editingCandidate,
                              department: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          disabled={updatingCandidate}
                        />
                        
                        <input
                          type="text"
                          placeholder="Level"
                          value={editingCandidate.level}
                          onChange={(e) =>
                            setEditingCandidate({
                              ...editingCandidate,
                              level: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          disabled={updatingCandidate}
                        />

                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, true)}
                            className="hidden"
                            id={`edit-image-${candidate.id}`}
                            disabled={updatingCandidate}
                          />
                          <label
                            htmlFor={`edit-image-${candidate.id}`}
                            className="block w-full text-center px-3 py-2 border border-gray-300 rounded cursor-pointer hover:bg-gray-50"
                          >
                            Change Image
                          </label>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={saveEditCandidate}
                            disabled={updatingCandidate}
                            className="flex-1 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50"
                          >
                            {updatingCandidate ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={() => setEditingCandidate(null)}
                            disabled={updatingCandidate}
                            className="flex-1 bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {candidate.image && (
                          <div className="flex justify-center mb-3">
                            <Image
                              src={candidate.image}
                              alt={candidate.name}
                              width={80}
                              height={80}
                              className="rounded-full object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="text-center mb-3">
                          <h4 className="font-semibold text-gray-800">
                            {candidate.name}
                          </h4>
                          {candidate.nickname && (
                            <p className="text-sm text-blue-600 italic">
                              "{candidate.nickname}"
                            </p>
                          )}
                          {candidate.department && (
                            <p className="text-xs text-gray-600">
                              {candidate.department}
                            </p>
                          )}
                          {candidate.level && (
                            <p className="text-xs text-gray-500">
                              {candidate.level}
                            </p>
                          )}
                          <span className="inline-block mt-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            ID: {candidate.id}
                          </span>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEditCandidate(candidate)}
                            className="flex-1 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCandidate(candidate.id)}
                            disabled={deletingCandidate}
                            className="flex-1 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 disabled:opacity-50"
                          >
                            {deletingCandidate ? "..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {position.candidates.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  No candidates added for this position yet
                </p>
              )}
            </motion.div>
          ))}
        </div>

        {positions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No positions created yet</p>
            <p className="text-gray-400">Add your first position above</p>
          </div>
        )}
      </div>
    </div>
  );
}
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

  // API hooks with optimized settings
  const { data: candidatesData, loading: loadingCandidates, refetch: refetchCandidates } = useApi<{
    success: boolean;
    positions: Position[];
  }>('/candidates', { immediate: true });

  const { mutate: createPosition, loading: creatingPosition } = useApiMutation('/positions');
  const { mutate: deletePosition, loading: deletingPosition } = useApiMutation('/positions');
  const { mutate: createCandidate, loading: creatingCandidate } = useApiMutation('/candidates');
  const { mutate: updateCandidate, loading: updatingCandidate } = useApiMutation('/candidates');
  const { mutate: deleteCandidate, loading: deletingCandidate } = useApiMutation('/candidates');

  // Update positions immediately when data changes
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

    const loadingToast = toast.loading("Creating position...");
    
    try {
      const result = await createPosition(newPosition);
      
      if (result.success) {
        setNewPosition({ position: "", allowMultiple: false });
        // Immediately update local state for better UX
        const newPos: Position = {
          position: result.position.position,
          allowMultiple: result.position.allowMultiple,
          candidates: []
        };
        setPositions(prev => [...prev, newPos]);
        
        toast.success("Position created successfully!", { id: loadingToast });
        
        // Refetch in background to ensure consistency
        setTimeout(() => refetchCandidates(), 500);
      }
    } catch (error: any) {
      console.error("Position creation error:", error);
      toast.error(error.response?.data?.error || "Failed to create position", { id: loadingToast });
    }
  };

  const handleDeletePosition = async (positionName: string) => {
    if (!confirm("Are you sure you want to delete this position and all its candidates?")) {
      return;
    }

    const loadingToast = toast.loading("Deleting position...");

    try {
      const result = await deletePosition({
        method: 'DELETE',
      }, null, {
        url: `/positions?position=${encodeURIComponent(positionName)}`
      });

      if (result.success) {
        // Immediately update local state
        setPositions(prev => prev.filter(p => p.position !== positionName));
        toast.success("Position deleted successfully!", { id: loadingToast });
        
        // Refetch in background
        setTimeout(() => refetchCandidates(), 500);
      }
    } catch (error: any) {
      console.error("Position deletion error:", error);
      toast.error(error.response?.data?.error || "Failed to delete position", { id: loadingToast });
    }
  };

  const addCandidate = async () => {
    if (!selectedPosition || !newCandidate.name.trim()) {
      toast.error("Please select a position and enter candidate name");
      return;
    }

    const loadingToast = toast.loading("Adding candidate...");

    try {
      const result = await createCandidate({
        ...newCandidate,
        position: selectedPosition,
      });

      if (result.success) {
        setNewCandidate({
          name: "",
          nickname: "",
          image: "",
          department: "",
          level: "",
        });

        // Immediately update local state
        setPositions(prev => prev.map(pos => {
          if (pos.position === selectedPosition) {
            return {
              ...pos,
              candidates: [...pos.candidates, result.candidate]
            };
          }
          return pos;
        }));

        toast.success("Candidate added successfully!", { id: loadingToast });
        
        // Refetch in background
        setTimeout(() => refetchCandidates(), 500);
      }
    } catch (error: any) {
      console.error("Candidate creation error:", error);
      toast.error(error.response?.data?.error || "Failed to add candidate", { id: loadingToast });
    }
  };

  const handleDeleteCandidate = async (candidateId: number) => {
    if (!confirm("Are you sure you want to delete this candidate?")) {
      return;
    }

    const loadingToast = toast.loading("Deleting candidate...");

    try {
      const result = await deleteCandidate({
        method: 'DELETE',
      }, null, {
        url: `/candidates?id=${candidateId}`
      });

      if (result.success) {
        // Immediately update local state
        setPositions(prev => prev.map(pos => ({
          ...pos,
          candidates: pos.candidates.filter(c => c.id !== candidateId)
        })));

        toast.success("Candidate deleted successfully!", { id: loadingToast });
        
        // Refetch in background
        setTimeout(() => refetchCandidates(), 500);
      }
    } catch (error: any) {
      console.error("Candidate deletion error:", error);
      toast.error(error.response?.data?.error || "Failed to delete candidate", { id: loadingToast });
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

    const loadingToast = toast.loading("Updating candidate...");

    try {
      const result = await updateCandidate({
        method: 'PUT',
      }, editingCandidate);

      if (result.success) {
        // Immediately update local state
        setPositions(prev => prev.map(pos => ({
          ...pos,
          candidates: pos.candidates.map(c => 
            c.id === editingCandidate.id ? result.candidate : c
          )
        })));

        setEditingCandidate(null);
        toast.success("Candidate updated successfully!", { id: loadingToast });
        
        // Refetch in background
        setTimeout(() => refetchCandidates(), 500);
      }
    } catch (error: any) {
      console.error("Candidate update error:", error);
      toast.error(error.response?.data?.error || "Failed to update candidate", { id: loadingToast });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            👥 Candidate Management
          </h2>
          <button
            onClick={() => {
              toast.loading("Refreshing data...");
              refetchCandidates().then(() => {
                toast.dismiss();
                toast.success("Data refreshed!");
              });
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
          >
            Refresh
          </button>
        </div>

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
            
            <select
              value={newCandidate.level}
              onChange={(e) => setNewCandidate({ ...newCandidate, level: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              disabled={creatingCandidate}
            >
              <option value="">Select Level</option>
              <option value="100L">100L</option>
              <option value="200L">200L</option>
              <option value="300L">300L</option>
              <option value="400L">400L</option>
              <option value="500L">500L</option>
              <option value="600L">600L</option>
              <option value="Graduate">Graduate</option>
            </select>

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
                      : "Single selection only"} • {position.candidates.length} candidates
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {position.candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="bg-white rounded-xl shadow-sm border hover:shadow-md transition duration-200 overflow-hidden"
                  >
                    {editingCandidate?.id === candidate.id ? (
                      <div className="p-4 space-y-3">
                        {editingCandidate.image && (
                          <div className="flex justify-center">
                            <div className="relative w-20 h-20 rounded-full overflow-hidden">
                              <Image
                                src={editingCandidate.image}
                                alt="Candidate"
                                fill
                                className="object-cover"
                              />
                            </div>
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
                        
                        <select
                          value={editingCandidate.level}
                          onChange={(e) =>
                            setEditingCandidate({
                              ...editingCandidate,
                              level: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          disabled={updatingCandidate}
                        >
                          <option value="">Select Level</option>
                          <option value="100L">100L</option>
                          <option value="200L">200L</option>
                          <option value="300L">300L</option>
                          <option value="400L">400L</option>
                          <option value="500L">500L</option>
                          <option value="600L">600L</option>
                          <option value="Graduate">Graduate</option>
                        </select>

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
                      <div className="p-4">
                        {/* Candidate Image */}
                        <div className="flex justify-center mb-4">
                          {candidate.image ? (
                            <div className="relative w-20 h-20 rounded-full overflow-hidden shadow-md">
                              <Image
                                src={candidate.image}
                                alt={candidate.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center shadow-md">
                              <span className="text-white font-bold text-lg">
                                {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Candidate Information */}
                        <div className="text-center space-y-2">
                          <h4 className="font-bold text-gray-800 text-lg leading-tight">
                            {candidate.name}
                          </h4>
                          
                          {candidate.nickname && (
                            <p className="text-blue-600 font-medium italic text-sm">
                              "{candidate.nickname}"
                            </p>
                          )}
                          
                          {candidate.department && (
                            <p className="text-gray-600 text-sm font-medium">
                              {candidate.department}
                            </p>
                          )}
                          
                          {candidate.level && (
                            <div className="flex justify-center">
                              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">
                                {candidate.level}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-2 mt-4">
                          <button
                            onClick={() => startEditCandidate(candidate)}
                            className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 transition duration-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCandidate(candidate.id)}
                            disabled={deletingCandidate}
                            className="flex-1 bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 disabled:opacity-50 transition duration-200"
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
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">👤</div>
                  <p className="text-gray-500 text-lg">No candidates added yet</p>
                  <p className="text-gray-400 text-sm">Add candidates for this position above</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {positions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-500 text-lg">No positions created yet</p>
            <p className="text-gray-400">Add your first position above to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
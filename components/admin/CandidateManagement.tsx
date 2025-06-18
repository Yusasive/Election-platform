"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useApi, useApiMutation } from "@/hooks/useApi";

interface Candidate {
  id: number;
  name: string;
  position: string;
}

interface Position {
  position: string;
  allowMultiple: boolean;
  candidates: Candidate[];
}

export default function CandidateManagement() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [newCandidate, setNewCandidate] = useState("");
  const [newPosition, setNewPosition] = useState({
    position: "",
    allowMultiple: false,
  });
  const [editingCandidate, setEditingCandidate] = useState<{
    id: number;
    name: string;
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
      alert("Please enter a position name");
      return;
    }

    try {
      await createPosition(newPosition);
      setNewPosition({ position: "", allowMultiple: false });
      refetchCandidates();
      alert("Position created successfully!");
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to create position");
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
        params: { position: positionName }
      });
      refetchCandidates();
      alert("Position deleted successfully!");
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to delete position");
    }
  };

  const addCandidate = async () => {
    if (!selectedPosition || !newCandidate.trim()) {
      alert("Please select a position and enter candidate name");
      return;
    }

    try {
      await createCandidate({
        name: newCandidate,
        position: selectedPosition,
      });
      setNewCandidate("");
      refetchCandidates();
      alert("Candidate added successfully!");
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to add candidate");
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
        params: { id: candidateId }
      });
      refetchCandidates();
      alert("Candidate deleted successfully!");
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to delete candidate");
    }
  };

  const startEditCandidate = (candidate: Candidate) => {
    setEditingCandidate({
      id: candidate.id,
      name: candidate.name,
    });
  };

  const saveEditCandidate = async () => {
    if (!editingCandidate) return;

    try {
      await updateCandidate({
        method: 'PUT',
      }, {
        id: editingCandidate.id,
        name: editingCandidate.name,
      });
      setEditingCandidate(null);
      refetchCandidates();
      alert("Candidate updated successfully!");
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to update candidate");
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              placeholder="Candidate name"
              value={newCandidate}
              onChange={(e) => setNewCandidate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              disabled={creatingCandidate}
            />
            <button
              onClick={addCandidate}
              disabled={creatingCandidate}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <div className="space-y-2">
                        <input
                          type="text"
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
                        <div className="flex space-x-2">
                          <button
                            onClick={saveEditCandidate}
                            disabled={updatingCandidate}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50"
                          >
                            {updatingCandidate ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={() => setEditingCandidate(null)}
                            disabled={updatingCandidate}
                            className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-800">
                            {candidate.name}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            ID: {candidate.id}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEditCandidate(candidate)}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCandidate(candidate.id)}
                            disabled={deletingCandidate}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 disabled:opacity-50"
                          >
                            {deletingCandidate ? "Deleting..." : "Delete"}
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
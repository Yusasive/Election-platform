"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface Candidate {
  id: number;
  name: string;
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
    positionIndex: number;
    candidateIndex: number;
    name: string;
  } | null>(null);

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      const response = await fetch("/data/candidates.json");
      const data = await response.json();
      setPositions(data);
    } catch (error) {
      console.error("Error loading candidates:", error);
    }
  };

  const saveCandidates = async () => {
    try {
      // In a real application, this would save to a backend
      // For now, we'll update localStorage and show success
      localStorage.setItem("candidates", JSON.stringify(positions));
      alert("Candidates updated successfully!");
    } catch (error) {
      console.error("Error saving candidates:", error);
      alert("Error saving candidates");
    }
  };

  const addPosition = () => {
    if (!newPosition.position.trim()) {
      alert("Please enter a position name");
      return;
    }

    const position: Position = {
      position: newPosition.position,
      allowMultiple: newPosition.allowMultiple,
      candidates: [],
    };

    setPositions([...positions, position]);
    setNewPosition({ position: "", allowMultiple: false });
    saveCandidates();
  };

  const deletePosition = (index: number) => {
    if (confirm("Are you sure you want to delete this position?")) {
      const updatedPositions = positions.filter((_, i) => i !== index);
      setPositions(updatedPositions);
      saveCandidates();
    }
  };

  const addCandidate = () => {
    if (!selectedPosition || !newCandidate.trim()) {
      alert("Please select a position and enter candidate name");
      return;
    }

    const positionIndex = positions.findIndex(
      (p) => p.position === selectedPosition
    );
    if (positionIndex === -1) return;

    const newId = Math.max(
      ...positions.flatMap((p) => p.candidates.map((c) => c.id)),
      0
    ) + 1;

    const updatedPositions = [...positions];
    updatedPositions[positionIndex].candidates.push({
      id: newId,
      name: newCandidate,
    });

    setPositions(updatedPositions);
    setNewCandidate("");
    saveCandidates();
  };

  const deleteCandidate = (positionIndex: number, candidateIndex: number) => {
    if (confirm("Are you sure you want to delete this candidate?")) {
      const updatedPositions = [...positions];
      updatedPositions[positionIndex].candidates.splice(candidateIndex, 1);
      setPositions(updatedPositions);
      saveCandidates();
    }
  };

  const startEditCandidate = (
    positionIndex: number,
    candidateIndex: number,
    name: string
  ) => {
    setEditingCandidate({ positionIndex, candidateIndex, name });
  };

  const saveEditCandidate = () => {
    if (!editingCandidate) return;

    const updatedPositions = [...positions];
    updatedPositions[editingCandidate.positionIndex].candidates[
      editingCandidate.candidateIndex
    ].name = editingCandidate.name;

    setPositions(updatedPositions);
    setEditingCandidate(null);
    saveCandidates();
  };

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
              />
              <label htmlFor="allowMultiple" className="text-sm text-gray-700">
                Allow multiple selections
              </label>
            </div>
            <button
              onClick={addPosition}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
            >
              Add Position
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
            />
            <button
              onClick={addCandidate}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200"
            >
              Add Candidate
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
                  onClick={() => deletePosition(positionIndex)}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition duration-200"
                >
                  Delete Position
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {position.candidates.map((candidate, candidateIndex) => (
                  <div
                    key={candidate.id}
                    className="bg-white p-4 rounded-lg shadow-sm border"
                  >
                    {editingCandidate?.positionIndex === positionIndex &&
                    editingCandidate?.candidateIndex === candidateIndex ? (
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
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={saveEditCandidate}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingCandidate(null)}
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
                            onClick={() =>
                              startEditCandidate(
                                positionIndex,
                                candidateIndex,
                                candidate.name
                              )
                            }
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              deleteCandidate(positionIndex, candidateIndex)
                            }
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                          >
                            Delete
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
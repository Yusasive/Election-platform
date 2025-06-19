"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useApi } from "@/hooks/useApi";

interface StudentVote {
  _id: string;
  matricNumber: string;
  userId: {
    fullName: string;
    department: string;
  };
  votes: {
    position: string;
    candidateIds: string[];
  }[];
  createdAt: string;
}

interface Candidate {
  id: number;
  name: string;
  nickname?: string;
  position: string;
}

interface Position {
  position: string;
  allowMultiple: boolean;
  candidates: Candidate[];
}

export default function StudentVotes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "department" | "time">("time");
  const [candidateMap, setCandidateMap] = useState<{ [key: string]: Candidate }>({});

  // Fetch votes from database
  const { data: votesData, loading: loadingVotes, refetch: refetchVotes } = useApi<{
    success: boolean;
    votes: StudentVote[];
  }>('/votes');

  // Fetch candidates to map IDs to names
  const { data: candidatesData, loading: loadingCandidates } = useApi<{
    success: boolean;
    positions: Position[];
  }>('/candidates');

  const studentVotes = votesData?.votes || [];
  const loading = loadingVotes || loadingCandidates;

  // Build candidate map for quick lookup
  useEffect(() => {
    if (candidatesData?.success && candidatesData?.positions) {
      const map: { [key: string]: Candidate } = {};
      candidatesData.positions.forEach((position) => {
        position.candidates.forEach((candidate) => {
          map[candidate.id.toString()] = candidate;
        });
      });
      setCandidateMap(map);
    }
  }, [candidatesData]);

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refetchVotes();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetchVotes]);

  const getCandidateName = (candidateId: string): string => {
    const candidate = candidateMap[candidateId];
    if (candidate) {
      return candidate.nickname 
        ? `${candidate.name} "${candidate.nickname}"`
        : candidate.name;
    }
    return `Candidate ${candidateId}`;
  };

  const getUniquePositions = () => {
    const positions = new Set<string>();
    studentVotes.forEach((vote) => {
      vote.votes.forEach((voteItem) => positions.add(voteItem.position));
    });
    return Array.from(positions);
  };

  const getUniqueCandidates = () => {
    const candidates = new Set<string>();
    studentVotes.forEach((vote) => {
      vote.votes.forEach((voteItem) => {
        voteItem.candidateIds.forEach((id) => candidates.add(id));
      });
    });
    return Array.from(candidates);
  };

  const filteredAndSortedVotes = () => {
    let filtered = studentVotes.filter((vote) => {
      const matchesSearch = 
        vote.userId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vote.matricNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vote.userId?.department?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPosition = !selectedPosition || 
        vote.votes.some(v => v.position === selectedPosition);

      const matchesCandidate = !selectedCandidate ||
        vote.votes.some(v => v.candidateIds.includes(selectedCandidate));

      return matchesSearch && matchesPosition && matchesCandidate;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.userId?.fullName || "").localeCompare(b.userId?.fullName || "");
        case "department":
          return (a.userId?.department || "").localeCompare(b.userId?.department || "");
        case "time":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  };

  const exportToCSV = () => {
    const headers = ["Matric Number", "Full Name", "Department", "Timestamp"];
    const positions = getUniquePositions();
    headers.push(...positions);

    const csvData = [
      headers.join(","),
      ...filteredAndSortedVotes().map((vote) => {
        const row = [
          vote.matricNumber,
          vote.userId?.fullName || "",
          vote.userId?.department || "",
          new Date(vote.createdAt).toLocaleString(),
        ];
        
        positions.forEach((position) => {
          const voteItem = vote.votes.find(v => v.position === position);
          if (voteItem) {
            const candidateNames = voteItem.candidateIds.map(id => getCandidateName(id));
            row.push(candidateNames.join(";"));
          } else {
            row.push("");
          }
        });

        return row.map(field => `"${field}"`).join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `student-votes-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
        <p className="ml-4 text-gray-600">Loading student votes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            🗳️ Student Votes
          </h2>
          <div className="flex space-x-3">
            <button
              onClick={refetchVotes}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
            >
              Refresh
            </button>
            <button
              onClick={exportToCSV}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Search by name, matric, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Positions</option>
              {getUniquePositions().map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>

            <select
              value={selectedCandidate}
              onChange={(e) => setSelectedCandidate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Candidates</option>
              {getUniqueCandidates().map((candidateId) => (
                <option key={candidateId} value={candidateId}>
                  {getCandidateName(candidateId)}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "name" | "department" | "time")}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="time">Sort by Time</option>
              <option value="name">Sort by Name</option>
              <option value="department">Sort by Department</option>
            </select>

            <div className="text-sm text-gray-600 flex items-center">
              <span className="font-medium">
                {filteredAndSortedVotes().length} of {studentVotes.length} votes
              </span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {filteredAndSortedVotes().map((vote, index) => (
            <motion.div
              key={vote._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {vote.userId?.fullName || "Unknown"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {vote.matricNumber} • {vote.userId?.department || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Voted: {new Date(vote.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {vote.votes.length} positions
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vote.votes.map((voteItem, voteIndex) => (
                  <div key={voteIndex} className="bg-white rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">{voteItem.position}</h4>
                    <div className="space-y-2">
                      {voteItem.candidateIds.map((candidateId) => {
                        const candidate = candidateMap[candidateId];
                        return (
                          <div
                            key={candidateId}
                            className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg border border-green-200"
                          >
                            {candidate?.name ? (
                              <div className="flex-1">
                                <p className="font-medium text-green-800">
                                  {candidate.name}
                                </p>
                                {candidate.nickname && (
                                  <p className="text-sm text-green-600 italic">
                                    "{candidate.nickname}"
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="flex-1">
                                <p className="font-medium text-green-800">
                                  Candidate {candidateId}
                                </p>
                                <p className="text-xs text-gray-500">
                                  (Candidate details not found)
                                </p>
                              </div>
                            )}
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                              ✓ Selected
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {filteredAndSortedVotes().length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🗳️</div>
            <p className="text-gray-500 text-lg">No votes found matching your criteria</p>
            <p className="text-gray-400">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
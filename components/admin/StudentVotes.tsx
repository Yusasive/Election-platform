"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface StudentVote {
  id: string;
  matricNumber: string;
  votes: { [position: string]: string | string[] };
  timestamp: string;
}

interface StudentData {
  matricNumber: string;
  fullName: string;
  department: string;
}

interface CombinedStudentData extends StudentVote {
  fullName?: string;
  department?: string;
}

export default function StudentVotes() {
  const [studentVotes, setStudentVotes] = useState<CombinedStudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "department" | "time">("time");

  useEffect(() => {
    fetchStudentVotes();
  }, []);

  const fetchStudentVotes = async () => {
    setLoading(true);
    try {
      // Fetch votes
      const votesResponse = await fetch("https://65130c258e505cebc2e981a1.mockapi.io/votes");
      const votes: StudentVote[] = await votesResponse.json();

      // Fetch student data
      const studentsResponse = await fetch("https://65130c258e505cebc2e981a1.mockapi.io/login");
      const students: StudentData[] = await studentsResponse.json();

      // Combine data
      const combinedData: CombinedStudentData[] = votes.map((vote) => {
        const studentInfo = students.find(
          (student) => student.matricNumber.toLowerCase() === vote.matricNumber.toLowerCase()
        );
        return {
          ...vote,
          fullName: studentInfo?.fullName || "Unknown",
          department: studentInfo?.department || "Unknown",
        };
      });

      setStudentVotes(combinedData);
    } catch (error) {
      console.error("Error fetching student votes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUniquePositions = () => {
    const positions = new Set<string>();
    studentVotes.forEach((vote) => {
      Object.keys(vote.votes).forEach((position) => positions.add(position));
    });
    return Array.from(positions);
  };

  const getUniqueCandidates = () => {
    const candidates = new Set<string>();
    studentVotes.forEach((vote) => {
      Object.values(vote.votes).forEach((candidateIds) => {
        if (Array.isArray(candidateIds)) {
          candidateIds.forEach((id) => candidates.add(id));
        } else {
          candidates.add(candidateIds);
        }
      });
    });
    return Array.from(candidates);
  };

  const filteredAndSortedVotes = () => {
    let filtered = studentVotes.filter((vote) => {
      const matchesSearch = 
        vote.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vote.matricNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vote.department?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPosition = !selectedPosition || 
        Object.keys(vote.votes).includes(selectedPosition);

      const matchesCandidate = !selectedCandidate ||
        Object.values(vote.votes).some((candidateIds) => {
          if (Array.isArray(candidateIds)) {
            return candidateIds.includes(selectedCandidate);
          }
          return candidateIds === selectedCandidate;
        });

      return matchesSearch && matchesPosition && matchesCandidate;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.fullName || "").localeCompare(b.fullName || "");
        case "department":
          return (a.department || "").localeCompare(b.department || "");
        case "time":
          return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime();
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
          vote.fullName || "",
          vote.department || "",
          vote.timestamp ? new Date(vote.timestamp).toLocaleString() : "",
        ];
        
        positions.forEach((position) => {
          const candidateIds = vote.votes[position];
          if (candidateIds) {
            if (Array.isArray(candidateIds)) {
              row.push(candidateIds.join(";"));
            } else {
              row.push(candidateIds);
            }
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
              onClick={fetchStudentVotes}
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
              {getUniqueCandidates().map((candidate) => (
                <option key={candidate} value={candidate}>
                  Candidate {candidate}
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
              key={vote.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {vote.fullName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {vote.matricNumber} • {vote.department}
                  </p>
                  {vote.timestamp && (
                    <p className="text-xs text-gray-500">
                      Voted: {new Date(vote.timestamp).toLocaleString()}
                    </p>
                  )}
                </div>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {Object.keys(vote.votes).length} positions
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(vote.votes).map(([position, candidateIds]) => (
                  <div key={position} className="bg-white rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">{position}</h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(candidateIds) ? (
                        candidateIds.map((candidateId) => (
                          <span
                            key={candidateId}
                            className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm"
                          >
                            Candidate {candidateId}
                          </span>
                        ))
                      ) : (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                          Candidate {candidateIds}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {filteredAndSortedVotes().length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No votes found matching your criteria</p>
            <p className="text-gray-400">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
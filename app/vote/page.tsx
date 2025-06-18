"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useApi, useApiMutation } from "@/hooks/useApi";
import { formatTime } from "@/lib/utils";

interface Candidate {
  id: number; 
  name: string;
}

interface Position {
  position: string;
  allowMultiple: boolean;
  candidates: Candidate[];
}

interface VoterData {
  id: string;
  matricNumber: string;
  fullName: string;
  department: string;
  hasVoted: boolean;
}

interface ElectionSettings {
  votingStartTime: string;
  votingEndTime: string;
  isVotingActive: boolean;
  loginDuration: number;
}

interface Selections {
  [position: string]: string | string[];
}

const useCountdown = (endTime: number): number => {
  const [timeLeft, setTimeLeft] = useState(Math.max(endTime - Date.now(), 0));

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(endTime - Date.now(), 0);
      setTimeLeft(remaining);
    };

    const intervalId = setInterval(tick, 1000);
    tick(); 

    return () => clearInterval(intervalId);
  }, [endTime]);

  return timeLeft;
};

export default function VotingPage() {
  const [selections, setSelections] = useState<Selections>({});
  const [voterData, setVoterData] = useState<VoterData | null>(null);
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const [electionSettings, setElectionSettings] = useState<ElectionSettings | null>(null);

  // Fetch candidates from database
  const { data: candidatesData, loading: loadingCandidates } = useApi<{
    success: boolean;
    positions: Position[];
  }>('/candidates');

  // Fetch current settings
  const { data: settingsData, refetch: refetchSettings } = useApi<{
    success: boolean;
    settings: ElectionSettings;
  }>('/settings');

  // Submit vote mutation
  const { mutate: submitVote, loading: submittingVote } = useApiMutation('/votes');

  // Calculate login and voting end times
  const loginEndTime = useMemo(() => {
    const loginTime = localStorage.getItem("loginTime");
    const duration = electionSettings?.loginDuration || 35;
    if (loginTime) {
      return parseInt(loginTime) + (duration * 60 * 1000);
    }
    return Date.now() + (duration * 60 * 1000);
  }, [electionSettings?.loginDuration]);

  const votingEndTime = useMemo(() => {
    if (electionSettings?.votingEndTime) {
      return new Date(electionSettings.votingEndTime).getTime();
    }
    return Date.now() + (2 * 60 * 60 * 1000); // Default 2 hours
  }, [electionSettings?.votingEndTime]);

  const loginTimeLeft = useCountdown(loginEndTime);
  const votingTimeLeft = useCountdown(votingEndTime);

  useEffect(() => {
    // Load voter data
    const storedVoterData = localStorage.getItem("voterData");
    const storedSettings = localStorage.getItem("electionSettings");
    const hasVoted = localStorage.getItem("voteRecord");

    if (!storedVoterData) {
      alert("You must log in first!");
      window.location.href = "/";
      return;
    }

    if (hasVoted) {
      alert("You have already voted!");
      window.location.href = "/";
      return;
    }

    const parsedVoterData = JSON.parse(storedVoterData) as VoterData;
    setVoterData(parsedVoterData);

    if (storedSettings) {
      setElectionSettings(JSON.parse(storedSettings));
    }

    // Set login time if not already set
    if (!localStorage.getItem("loginTime")) {
      localStorage.setItem("loginTime", Date.now().toString());
    }

    // Refetch settings every 10 seconds for real-time updates
    const settingsInterval = setInterval(() => {
      refetchSettings();
    }, 10000);

    return () => clearInterval(settingsInterval);
  }, [refetchSettings]);

  // Update settings when new data arrives
  useEffect(() => {
    if (settingsData?.settings) {
      setElectionSettings(settingsData.settings);
      localStorage.setItem("electionSettings", JSON.stringify(settingsData.settings));
    }
  }, [settingsData]);

  // Check voting status
  useEffect(() => {
    if (!electionSettings) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const votingStart = new Date(electionSettings.votingStartTime).getTime();
      const votingEnd = new Date(electionSettings.votingEndTime).getTime();
      
      const adminActive = electionSettings.isVotingActive;
      const withinTimeLimit = now >= votingStart && now <= votingEnd;
      const loginValid = now <= loginEndTime;
      
      setIsVotingOpen(adminActive && withinTimeLimit && loginValid);
    }, 1000);

    return () => clearInterval(interval);
  }, [electionSettings, loginEndTime]);

  const handleSelection = (
    position: string,
    candidateId: string,
    allowMultiple: boolean
  ) => {
    if (allowMultiple) {
      const currentSelections = selections[position] || [];
      const updatedSelections = (currentSelections as string[]).includes(
        candidateId
      )
        ? (currentSelections as string[]).filter((id) => id !== candidateId)
        : [...(currentSelections as string[]), candidateId];
      setSelections({ ...selections, [position]: updatedSelections });
    } else {
      setSelections({ ...selections, [position]: candidateId });
    }
  };

  const handleVote = async () => {
    if (!isVotingOpen) {
      alert("Voting is closed.");
      return;
    }

    if (!candidatesData?.positions) {
      alert("Candidates data not loaded. Please refresh the page.");
      return;
    }

    const allPositions = candidatesData.positions.map(
      (position: Position) => position.position
    );
    const missingVotes = allPositions.filter(
      (pos) => !selections[pos] || (Array.isArray(selections[pos]) && (selections[pos] as string[]).length === 0)
    );

    if (missingVotes.length > 0) {
      alert(`You must vote for all positions: ${missingVotes.join(", ")}`);
      return;
    }

    try {
      await submitVote({
        matricNumber: voterData?.matricNumber,
        votes: selections,
      });

      localStorage.setItem("voteRecord", JSON.stringify(selections));
      localStorage.removeItem("loginTime");
      localStorage.removeItem("voterData");
      localStorage.removeItem("electionSettings");
      
      alert("Thank you for voting!");
      window.location.href = "/congratulations";
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to submit vote. Please try again.");
    }
  };

  if (loadingCandidates) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="p-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
      <motion.header
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
          🗳️ Cast Your Vote
        </h1>
        <p className="text-lg text-gray-600">
          Your voice matters! Make your vote count.
        </p>
      </motion.header>

      <motion.section
        className="max-w-4xl mx-auto mb-8 bg-white shadow-lg rounded-2xl p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6l4 2"
                />
              </svg>
            </div>
            <div>
              <p className="text-gray-700 font-medium">Login Session</p>
              <p className="text-blue-600 font-bold text-lg">
                {formatTime(loginTimeLeft)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6l4 2"
                />
              </svg>
            </div>
            <div>
              <p className="text-gray-700 font-medium">Voting Ends</p>
              <p className="text-green-600 font-bold text-lg">
                {formatTime(votingTimeLeft)}
              </p>
            </div>
          </div>
        </div>

        {!isVotingOpen && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-center text-red-700 font-semibold">
              🚫 Voting is currently closed!
            </p>
          </div>
        )}
      </motion.section>

      {voterData && (
        <motion.div
          className="max-w-4xl mx-auto mb-8 bg-white shadow-lg rounded-2xl p-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {voterData.fullName[0].toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">
                Welcome, {voterData.fullName}
              </h3>
              <p className="text-gray-600">
                Matric: {voterData.matricNumber} • {voterData.department}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.section
        className="max-w-4xl mx-auto space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
      >
        {candidatesData?.positions?.map((position: Position, index) => (
          <motion.div
            key={position.position}
            className="bg-white shadow-lg rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {position.position}
              </h2>
              <p className="text-gray-600">
                {position.allowMultiple 
                  ? "You can select multiple candidates" 
                  : "Select one candidate"}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {position.candidates.map((candidate: Candidate) => (
                <motion.div
                  key={candidate.id}
                  className="group cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    handleSelection(
                      position.position,
                      candidate.id.toString(),
                      position.allowMultiple
                    )
                  }
                >
                  <div className={`p-4 rounded-xl border-2 transition duration-200 ${
                    (position.allowMultiple 
                      ? selections[position.position]?.includes(candidate.id.toString())
                      : selections[position.position] === candidate.id.toString())
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                  }`}>
                    <div className="flex items-center space-x-3">
                      {position.allowMultiple ? (
                        <input
                          type="checkbox"
                          checked={
                            !!selections[position.position]?.includes(
                              candidate.id.toString()
                            )
                          }
                          onChange={() => {}}
                          className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                      ) : (
                        <input
                          type="radio"
                          name={position.position}
                          checked={
                            selections[position.position] ===
                            candidate.id.toString()
                          }
                          onChange={() => {}}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">
                          {candidate.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Candidate ID: {candidate.id}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.section>

      <motion.div
        className="max-w-4xl mx-auto text-center mt-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <button
          onClick={handleVote}
          disabled={!isVotingOpen || submittingVote}
          className={`px-12 py-4 rounded-xl font-bold text-lg transition duration-300 transform hover:scale-105 ${
            isVotingOpen && !submittingVote
              ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {submittingVote ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Submitting Vote...</span>
            </div>
          ) : isVotingOpen ? (
            "🗳️ Cast Your Vote"
          ) : (
            "Voting Closed"
          )}
        </button>
      </motion.div>
    </main>
  );
}
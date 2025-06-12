"use client";

import { useEffect, useState, useMemo } from "react";
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

interface VoterData {
  matricNumber: string;
  fullName: string;
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
  const [candidates, setCandidates] = useState<Position[]>([]);
  const [votingTimes, setVotingTimes] = useState({
    votingEndTime: "",
    loginDuration: 35,
    isVotingActive: false,
  });

  // Calculate login and voting end times
  const loginEndTime = useMemo(() => {
    const loginTime = localStorage.getItem("loginTime");
    if (loginTime) {
      return parseInt(loginTime) + (votingTimes.loginDuration * 60 * 1000);
    }
    return Date.now() + (votingTimes.loginDuration * 60 * 1000);
  }, [votingTimes.loginDuration]);

  const votingEndTime = useMemo(() => {
    if (votingTimes.votingEndTime) {
      return new Date(votingTimes.votingEndTime).getTime();
    }
    return Date.now() + (2 * 60 * 60 * 1000); // Default 2 hours
  }, [votingTimes.votingEndTime]);

  const loginTimeLeft = useCountdown(loginEndTime);
  const votingTimeLeft = useCountdown(votingEndTime);

  const formatTime = (ms: number): string => {
    if (ms <= 0) return "Time Expired";

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    // Load admin settings
    const savedSettings = localStorage.getItem("timeSettings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setVotingTimes({
        votingEndTime: settings.votingEndTime || "",
        loginDuration: settings.loginDuration || 35,
        isVotingActive: settings.isVotingActive || false,
      });
    }

    // Load candidates (check localStorage first, then fallback to JSON)
    const savedCandidates = localStorage.getItem("candidates");
    if (savedCandidates) {
      setCandidates(JSON.parse(savedCandidates));
    } else {
      // Load from JSON file
      fetch("/data/candidates.json")
        .then(response => response.json())
        .then(data => setCandidates(data))
        .catch(error => console.error("Error loading candidates:", error));
    }

    const storedVoterData = JSON.parse(
      localStorage.getItem("voterData") || "{}"
    ) as VoterData;
    const hasVoted = localStorage.getItem("voteRecord");

    if (!storedVoterData?.matricNumber) {
      alert("You must log in first!");
      window.location.href = "/";
      return;
    }

    if (hasVoted) {
      alert("You have already voted!");
      window.location.href = "/";
      return;
    }

    // Set login time if not already set
    if (!localStorage.getItem("loginTime")) {
      localStorage.setItem("loginTime", Date.now().toString());
    }

    setVoterData(storedVoterData);

    const interval = setInterval(() => {
      const now = Date.now();
      const adminActive = JSON.parse(localStorage.getItem("timeSettings") || "{}")?.isVotingActive;
      const withinTimeLimit = now <= votingEndTime;
      const loginValid = now <= loginEndTime;
      
      setIsVotingOpen(adminActive && withinTimeLimit && loginValid);
    }, 1000);

    return () => clearInterval(interval);
  }, [votingEndTime, loginEndTime]);

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

    const allPositions = candidates.map(
      (position: Position) => position.position
    );
    const missingVotes = allPositions.filter(
      (pos) => !selections[pos] || (selections[pos] as string[]).length === 0
    );

    if (missingVotes.length > 0) {
      alert(`You must vote for all positions: ${missingVotes.join(", ")}`);
      return;
    }

    try {
      const response = await fetch(
        "https://65130c258e505cebc2e981a1.mockapi.io/votes",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matricNumber: voterData?.matricNumber,
            votes: selections,
            timestamp: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit your vote. Please try again later.");
      }

      localStorage.setItem("voteRecord", JSON.stringify(selections));
      localStorage.removeItem("loginTime");
      alert("Thank you for voting!");
      window.location.href = "/congratulations";
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("An unknown error occurred.");
      }
    }
  };

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
                Matric: {voterData.matricNumber}
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
        {candidates.map((position: Position, index) => (
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
          className={`px-12 py-4 rounded-xl font-bold text-lg transition duration-300 transform hover:scale-105 ${
            isVotingOpen
              ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
          disabled={!isVotingOpen}
        >
          {isVotingOpen ? "🗳️ Cast Your Vote" : "Voting Closed"}
        </button>
      </motion.div>
    </main>
  );
}
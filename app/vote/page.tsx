"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useApi, useApiMutation } from "@/hooks/useApi";
import { formatTime } from "@/lib/utils";
import toast from 'react-hot-toast';
import Image from 'next/image';

interface Candidate {
  id: number; 
  name: string;
  nickname?: string;
  image?: string;
  department?: string;
  level?: string;
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
  const [hasRedirected, setHasRedirected] = useState(false);
  const [lastToastTime, setLastToastTime] = useState(0);
  const [candidatesLoaded, setCandidatesLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch candidates from database with better error handling
  const { data: candidatesData, loading: loadingCandidates, error: candidatesError, refetch: refetchCandidates } = useApi<{
    success: boolean;
    positions: Position[];
  }>('/candidates', { 
    immediate: true,
    retries: 3,
    retryDelay: 2000,
    onSuccess: (data) => {
      if (data?.success && Array.isArray(data?.positions)) {
        setCandidatesLoaded(true);
        setRetryCount(0);
        toast.success("Candidates loaded successfully!", { duration: 2000 });
      } else {
        setCandidatesLoaded(false);
        toast.error("Invalid candidates data received");
      }
    },
    onError: (error) => {
      setCandidatesLoaded(false);
      console.error("Candidates fetch error:", error);
      const errorMsg = error.response?.data?.error || "Failed to load candidates";
      toast.error(`${errorMsg}. Retrying automatically...`, { duration: 4000 });
    }
  });

  // Fetch current settings with real-time updates
  const { data: settingsData, refetch: refetchSettings, error: settingsError } = useApi<{
    success: boolean;
    settings: ElectionSettings;
  }>('/settings', {
    retries: 2,
    onError: (error) => {
      console.error("Settings fetch error:", error);
      toast.error("Failed to load election settings");
    }
  });

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

  const votingStartTime = useMemo(() => {
    if (electionSettings?.votingStartTime) {
      return new Date(electionSettings.votingStartTime).getTime();
    }
    return Date.now() - (1 * 60 * 60 * 1000); // Default started 1 hour ago
  }, [electionSettings?.votingStartTime]);

  const loginTimeLeft = useCountdown(loginEndTime);
  const votingTimeLeft = useCountdown(votingEndTime);

  // Redirect function with toast notification
  const redirectToHome = useCallback((reason: string) => {
    if (hasRedirected) return;
    
    setHasRedirected(true);
    toast.error(reason, { duration: 3000 });
    
    // Clear all stored data
    localStorage.removeItem("voterData");
    localStorage.removeItem("loginTime");
    localStorage.removeItem("electionSettings");
    
    setTimeout(() => {
      window.location.href = "/";
    }, 2000);
  }, [hasRedirected]);

  // Show toast notifications with throttling
  const showTimingToast = useCallback((message: string, type: 'warning' | 'info' = 'warning') => {
    const now = Date.now();
    if (now - lastToastTime > 30000) { // Only show every 30 seconds
      if (type === 'warning') {
        toast.warning(message, { duration: 5000 });
      } else {
        toast(message, { duration: 4000, icon: 'ℹ️' });
      }
      setLastToastTime(now);
    }
  }, [lastToastTime]);

  // Initial setup and validation
  useEffect(() => {
    const storedVoterData = localStorage.getItem("voterData");
    const storedSettings = localStorage.getItem("electionSettings");
    const hasVoted = localStorage.getItem("voteRecord");
    const loginTime = localStorage.getItem("loginTime");

    // Validation checks
    if (!storedVoterData) {
      redirectToHome("You must log in first!");
      return;
    }

    if (hasVoted) {
      redirectToHome("You have already voted!");
      return;
    }

    if (!loginTime) {
      redirectToHome("Invalid login session!");
      return;
    }

    try {
      const parsedVoterData = JSON.parse(storedVoterData) as VoterData;
      setVoterData(parsedVoterData);

      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        setElectionSettings(parsedSettings);
      }

      toast.success(`Welcome ${parsedVoterData.fullName}! Loading your ballot...`, { duration: 3000 });
    } catch (error) {
      console.error("Error parsing stored data:", error);
      redirectToHome("Invalid session data!");
    }
  }, [redirectToHome]);

  // Real-time settings updates
  useEffect(() => {
    if (!hasRedirected) {
      // Refetch settings every 10 seconds for real-time updates
      const settingsInterval = setInterval(() => {
        refetchSettings();
      }, 10000);

      return () => clearInterval(settingsInterval);
    }
  }, [refetchSettings, hasRedirected]);

  // Update settings when new data arrives
  useEffect(() => {
    if (settingsData?.settings && !hasRedirected) {
      setElectionSettings(settingsData.settings);
      localStorage.setItem("electionSettings", JSON.stringify(settingsData.settings));
    }
  }, [settingsData, hasRedirected]);

  // Real-time voting status monitoring
  useEffect(() => {
    if (!electionSettings || hasRedirected) return;

    const checkVotingStatus = () => {
      const now = Date.now();
      const votingStart = new Date(electionSettings.votingStartTime).getTime();
      const votingEnd = new Date(electionSettings.votingEndTime).getTime();
      
      const adminActive = electionSettings.isVotingActive;
      const withinTimeWindow = now >= votingStart && now <= votingEnd;
      const loginValid = now <= loginEndTime;
      
      const newVotingStatus = adminActive && withinTimeWindow && loginValid;
      
      // Check for session expiry
      if (!loginValid) {
        redirectToHome("Your login session has expired!");
        return;
      }
      
      // Check for voting period end
      if (now > votingEnd) {
        redirectToHome("Voting period has ended!");
        return;
      }
      
      // Check for admin disable
      if (!adminActive) {
        redirectToHome("Voting has been disabled by admin!");
        return;
      }
      
      // Check for voting not started
      if (now < votingStart) {
        redirectToHome("Voting has not started yet!");
        return;
      }

      setIsVotingOpen(newVotingStatus);

      // Show timing warnings
      if (loginTimeLeft <= 5 * 60 * 1000 && loginTimeLeft > 0) { // 5 minutes left
        showTimingToast(`⚠️ Login session expires in ${formatTime(loginTimeLeft)}!`, 'warning');
      }
      
      if (votingTimeLeft <= 10 * 60 * 1000 && votingTimeLeft > 0) { // 10 minutes left
        showTimingToast(`⏰ Voting ends in ${formatTime(votingTimeLeft)}!`, 'warning');
      }
    };

    // Check immediately
    checkVotingStatus();

    // Then check every second
    const interval = setInterval(checkVotingStatus, 1000);

    return () => clearInterval(interval);
  }, [electionSettings, loginEndTime, loginTimeLeft, votingTimeLeft, hasRedirected, redirectToHome, showTimingToast]);

  // Handle candidate selection
  const handleSelection = (
    position: string,
    candidateId: string,
    allowMultiple: boolean
  ) => {
    if (!isVotingOpen) {
      toast.error("Voting is currently closed!");
      return;
    }

    if (!candidatesLoaded) {
      toast.error("Candidates data not loaded. Please wait...");
      return;
    }

    if (allowMultiple) {
      const currentSelections = selections[position] || [];
      const updatedSelections = (currentSelections as string[]).includes(candidateId)
        ? (currentSelections as string[]).filter((id) => id !== candidateId)
        : [...(currentSelections as string[]), candidateId];
      
      setSelections({ ...selections, [position]: updatedSelections });
      
      if (updatedSelections.includes(candidateId)) {
        toast.success(`Selected candidate for ${position}`, { duration: 2000 });
      } else {
        toast(`Deselected candidate for ${position}`, { duration: 2000, icon: '↩️' });
      }
    } else {
      setSelections({ ...selections, [position]: candidateId });
      toast.success(`Selected candidate for ${position}`, { duration: 2000 });
    }
  };

  // Handle vote submission
  const handleVote = async () => {
    if (!isVotingOpen) {
      toast.error("Voting is currently closed!");
      return;
    }

    if (!candidatesLoaded || !candidatesData?.success || !candidatesData?.positions) {
      toast.error("Candidates data not loaded. Please refresh the page.");
      return;
    }

    // Validate all positions have votes
    const allPositions = candidatesData.positions.map((position: Position) => position.position);
    const missingVotes = allPositions.filter((pos) => {
      const selection = selections[pos];
      return !selection || (Array.isArray(selection) && selection.length === 0);
    });

    if (missingVotes.length > 0) {
      toast.error(`Please vote for all positions: ${missingVotes.join(", ")}`, { duration: 5000 });
      return;
    }

    const loadingToast = toast.loading("Submitting your vote...");

    try {
      await submitVote({
        matricNumber: voterData?.matricNumber,
        votes: selections,
      });

      // Mark as voted and clear session data
      localStorage.setItem("voteRecord", JSON.stringify(selections));
      localStorage.removeItem("loginTime");
      localStorage.removeItem("voterData");
      localStorage.removeItem("electionSettings");
      
      toast.success("Vote submitted successfully! Redirecting...", { id: loadingToast });
      
      setTimeout(() => {
        window.location.href = "/congratulations";
      }, 2000);
    } catch (error: any) {
      console.error("Vote submission error:", error);
      const errorMessage = error.response?.data?.error || "Failed to submit vote. Please try again.";
      toast.error(errorMessage, { id: loadingToast });
    }
  };

  // Handle errors and retry logic
  useEffect(() => {
    if (candidatesError && retryCount >= 3) {
      toast.error("Failed to load candidates after multiple attempts. Please refresh the page.", { duration: 8000 });
    }
    if (settingsError) {
      toast.error("Failed to load election settings. Please refresh the page.", { duration: 6000 });
    }
  }, [candidatesError, settingsError, retryCount]);

  // Loading state with better error handling
  if (loadingCandidates || !voterData || !electionSettings) {
    return (
      <main className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md mx-4"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading voting interface...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we prepare your ballot</p>
          
          {candidatesError && retryCount > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-700 text-sm">Retrying... ({retryCount}/3)</p>
            </div>
          )}
          
          {candidatesError && retryCount >= 3 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">Failed to load candidates</p>
              <button
                onClick={() => {
                  setRetryCount(0);
                  toast.loading("Retrying...");
                  refetchCandidates();
                }}
                className="mt-2 bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600"
              >
                Try Again
              </button>
            </div>
          )}
        </motion.div>
      </main>
    );
  }

  // Show error state if candidates failed to load after all retries
  if (candidatesError && !candidatesLoaded && retryCount >= 3) {
    return (
      <main className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md mx-4"
        >
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Failed to Load Candidates</h2>
          <p className="text-gray-600 mb-4">We couldn't load the candidate data after multiple attempts.</p>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                setRetryCount(0);
                setCandidatesLoaded(false);
                toast.loading("Retrying...");
                refetchCandidates();
              }}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200"
            >
              Retry Loading Candidates
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200"
            >
              Refresh Page
            </button>
            
            <button
              onClick={() => window.location.href = "/"}
              className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200"
            >
              Return to Home
            </button>
          </div>
        </motion.div>
      </main>
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

      {/* Real-time Status Panel */}
      <motion.section
        className="max-w-4xl mx-auto mb-8 bg-white shadow-lg rounded-2xl p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <p className={`font-bold text-lg ${
                loginTimeLeft <= 5 * 60 * 1000 ? 'text-red-600' : 'text-blue-600'
              }`}>
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
              <p className={`font-bold text-lg ${
                votingTimeLeft <= 10 * 60 * 1000 ? 'text-red-600' : 'text-green-600'
              }`}>
                {formatTime(votingTimeLeft)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${
              isVotingOpen && candidatesLoaded ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <div className={`w-3 h-3 rounded-full ${
                isVotingOpen && candidatesLoaded ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}></div>
            </div>
            <div>
              <p className="text-gray-700 font-medium">Status</p>
              <p className={`font-bold text-lg ${
                isVotingOpen && candidatesLoaded ? 'text-green-600' : 'text-red-600'
              }`}>
                {isVotingOpen && candidatesLoaded ? 'Ready' : 'Not Ready'}
              </p>
            </div>
          </div>
        </div>

        {(!isVotingOpen || !candidatesLoaded) && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-center text-red-700 font-semibold">
              {!candidatesLoaded ? "🔄 Loading candidates..." : "🚫 Voting is currently closed!"}
            </p>
            <p className="text-center text-red-600 text-sm mt-1">
              {!candidatesLoaded ? "Please wait while we load the ballot" : "You will be redirected to the home page shortly."}
            </p>
          </div>
        )}
      </motion.section>

      {/* Voter Information */}
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

      {/* Voting Positions */}
      <motion.section
        className="max-w-4xl mx-auto space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
      >
        {candidatesData?.success && candidatesData?.positions?.map((position: Position, index) => (
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <div className={`relative p-6 rounded-2xl border-2 transition duration-300 ${
                    (position.allowMultiple 
                      ? selections[position.position]?.includes(candidate.id.toString())
                      : selections[position.position] === candidate.id.toString())
                      ? "border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200"
                      : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md"
                  }`}>
                    {/* Selection Indicator */}
                    <div className="absolute top-4 right-4">
                      {position.allowMultiple ? (
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition duration-200 ${
                          selections[position.position]?.includes(candidate.id.toString())
                            ? "bg-blue-500 border-blue-500"
                            : "border-gray-300 bg-white"
                        }`}>
                          {selections[position.position]?.includes(candidate.id.toString()) && (
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      ) : (
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition duration-200 ${
                          selections[position.position] === candidate.id.toString()
                            ? "bg-blue-500 border-blue-500"
                            : "border-gray-300 bg-white"
                        }`}>
                          {selections[position.position] === candidate.id.toString() && (
                            <div className="w-3 h-3 bg-white rounded-full"></div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Candidate Image */}
                    <div className="flex justify-center mb-4">
                      {candidate.image ? (
                        <div className="relative w-20 h-20 rounded-full overflow-hidden shadow-lg">
                          <Image
                            src={candidate.image}
                            alt={candidate.name}
                            fill
                            className="object-cover"
                            onError={() => {
                              // Fallback to initials if image fails to load
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-xl">
                            {candidate.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Candidate Information */}
                    <div className="text-center space-y-2">
                      <h3 className="font-bold text-lg text-gray-800 leading-tight">
                        {candidate.name}
                      </h3>
                      
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
                        <div className="inline-block">
                          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">
                            {candidate.level}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Selection Overlay */}
                    {(position.allowMultiple 
                      ? selections[position.position]?.includes(candidate.id.toString())
                      : selections[position.position] === candidate.id.toString()) && (
                      <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-2xl pointer-events-none">
                        <div className="absolute top-2 left-2">
                          <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                            SELECTED
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.section>

      {/* Submit Vote Button */}
      <motion.div
        className="max-w-4xl mx-auto text-center mt-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <button
          onClick={handleVote}
          disabled={!isVotingOpen || !candidatesLoaded || submittingVote}
          className={`px-12 py-4 rounded-xl font-bold text-lg transition duration-300 transform hover:scale-105 ${
            isVotingOpen && candidatesLoaded && !submittingVote
              ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {submittingVote ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Submitting Vote...</span>
            </div>
          ) : isVotingOpen && candidatesLoaded ? (
            "🗳️ Cast Your Vote"
          ) : !candidatesLoaded ? (
            "Loading Candidates..."
          ) : (
            "Voting Closed"
          )}
        </button>

        {/* Quick Actions */}
        <div className="mt-6 flex justify-center space-x-4 text-sm text-gray-500">
          <button
            onClick={() => {
              toast.loading("Refreshing data...");
              Promise.all([refetchSettings(), refetchCandidates()]).then(() => {
                toast.dismiss();
                toast.success("Data refreshed!");
              }).catch(() => {
                toast.dismiss();
                toast.error("Failed to refresh data");
              });
            }}
            className="hover:text-blue-500 transition duration-200"
          >
            Refresh Data
          </button>
          <span>•</span>
          <button
            onClick={() => {
              const selectionCount = Object.values(selections).filter(s => 
                Array.isArray(s) ? s.length > 0 : s
              ).length;
              const totalPositions = candidatesData?.positions?.length || 0;
              toast(`Progress: ${selectionCount}/${totalPositions} positions voted`, { duration: 3000, icon: '📊' });
            }}
            className="hover:text-blue-500 transition duration-200"
          >
            Check Progress
          </button>
        </div>
      </motion.div>
    </main>
  );
}
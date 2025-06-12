"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useApi, useApiMutation } from "@/hooks/useApi";
import { formatTime } from "@/lib/utils";

interface FormData {
  matricNumber: string;
  fullName: string;
  department: string;
  image: string;
}

interface ElectionSettings {
  votingStartTime: string;
  votingEndTime: string;
  isVotingActive: boolean;
}

export default function HomePage() {
  const [formData, setFormData] = useState<FormData>({
    matricNumber: "",
    fullName: "",
    department: "",
    image: "",
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeRemaining, setTimeRemaining] = useState("");
  const [isVotingPeriod, setIsVotingPeriod] = useState(false);

  // Fetch election settings
  const { data: settingsData, refetch: refetchSettings } = useApi<{
    success: boolean;
    settings: ElectionSettings;
  }>('/settings');

  // User registration mutation
  const { mutate: registerUser, loading: registering } = useApiMutation('/users');

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Update countdown and voting status
  useEffect(() => {
    if (!settingsData?.settings) return;

    const settings = settingsData.settings;
    const votingStartTime = new Date(settings.votingStartTime);
    const votingEndTime = new Date(settings.votingEndTime);

    // Check admin override first
    if (!settings.isVotingActive) {
      setTimeRemaining("Voting is currently disabled by admin.");
      setIsVotingPeriod(false);
      return;
    }

    if (currentTime.getTime() < votingStartTime.getTime()) {
      const timeDiff = votingStartTime.getTime() - currentTime.getTime();
      setTimeRemaining(formatTime(timeDiff));
      setIsVotingPeriod(false);
    } else if (
      currentTime.getTime() >= votingStartTime.getTime() &&
      currentTime.getTime() <= votingEndTime.getTime()
    ) {
      const timeDiff = votingEndTime.getTime() - currentTime.getTime();
      setTimeRemaining(formatTime(timeDiff));
      setIsVotingPeriod(true);
    } else {
      setTimeRemaining("Voting has ended.");
      setIsVotingPeriod(false);
    }
  }, [currentTime, settingsData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleLogin = async () => {
    if (!isVotingPeriod) {
      alert("You can only log in during the voting period.");
      return;
    }

    // Validate input fields
    if (!formData.matricNumber || !formData.fullName || !formData.department) {
      alert("All fields are required.");
      return;
    }

    // Check if user has already voted
    const existingVote = localStorage.getItem("voteRecord");
    if (existingVote) {
      alert("You have already voted. Login is restricted.");
      return;
    }

    try {
      const result = await registerUser(formData);
      
      if (result.success) {
        // Save user data and login time
        localStorage.setItem("voterData", JSON.stringify(result.user));
        localStorage.setItem("loginTime", Date.now().toString());
        
        // Redirect to voting page
        window.location.href = "/vote";
      }
    } catch (error: any) {
      alert(error.response?.data?.error || "Registration failed. Please try again.");
    }
  };

  return (
    <main className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl text-blue-600 font-bold mb-4">
            Faculty of Physical Sciences
          </h1>
          <div className="flex justify-center mb-4">
            <Image 
              src="/physical.png" 
              alt="Physical Sciences" 
              width={80} 
              height={60}
              className="rounded-lg shadow-sm"
            />
          </div>
          <p className="text-gray-600 font-medium">Election Voting Portal</p>
        </div>

        <div className="mb-6">
          {isVotingPeriod ? (
            <div className="text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700 font-semibold">Voting is Active</span>
                </div>
                <p className="text-green-600 text-sm mt-2">
                  Time Remaining: <strong>{timeRemaining}</strong>
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-red-700 font-semibold">Voting Closed</span>
                </div>
                <p className="text-red-600 text-sm mt-2">
                  <strong>{timeRemaining}</strong>
                </p>
              </div>
            </div>
          )}
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <div>
            <input
              type="text"
              name="matricNumber"
              placeholder="Matric Number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              onChange={handleInputChange}
              value={formData.matricNumber}
              disabled={registering}
            />
          </div>
          
          <div>
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              onChange={handleInputChange}
              value={formData.fullName}
              disabled={registering}
            />
          </div>
          
          <div>
            <input
              type="text"
              name="department"
              placeholder="Department"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              onChange={handleInputChange}
              value={formData.department}
              disabled={registering}
            />
          </div>

          <div className="relative">
            <label
              htmlFor="image"
              className="flex flex-col items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 transition duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-blue-500 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 16v6m0 0l-4-4m4 4l4-4m-4-2a9 9 0 110-18 9 9 0 010 18z"
                />
              </svg>
              {formData.image ? (
                <div className="text-center">
                  <Image
                    src={formData.image}
                    alt="Selected file preview"
                    width={96}
                    height={96}
                    className="mx-auto mb-2 h-24 w-24 object-cover rounded-lg"
                  />
                  <span className="text-green-600 text-sm font-medium">
                    Image uploaded successfully
                  </span>
                </div>
              ) : (
                <span className="text-gray-600 font-medium">
                  Upload ID Card or Course Form
                </span>
              )}
            </label>
            <input
              id="image"
              type="file"
              name="image"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setFormData({
                    ...formData,
                    image: URL.createObjectURL(file),
                  });
                }
              }}
              disabled={registering}
            />
          </div>

          <button
            type="submit"
            className={`w-full py-3 px-4 rounded-lg font-semibold transition duration-200 ${
              isVotingPeriod && !registering
                ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!isVotingPeriod || registering}
          >
            {registering ? "Registering..." : isVotingPeriod ? "Login & Vote" : "Voting Closed"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/admin"
            className="text-blue-500 hover:text-blue-600 text-sm font-medium transition duration-200"
          >
            Admin Dashboard
          </a>
        </div>
      </div>
    </main>
  );
}
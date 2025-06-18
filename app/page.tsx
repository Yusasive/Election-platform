"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useApi, useApiMutation } from "@/hooks/useApi";
import { formatTime } from "@/lib/utils";
import toast from 'react-hot-toast';

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
  loginDuration: number;
}

interface ExistingUser {
  id: string;
  matricNumber: string;
  fullName: string;
  department: string;
  hasVoted: boolean;
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
  const [checkingUser, setCheckingUser] = useState(false);

  // Fetch election settings from database
  const { data: settingsData, loading: settingsLoading, refetch: refetchSettings } = useApi<{
    success: boolean;
    settings: ElectionSettings;
  }>('/settings');

  // User registration mutation
  const { mutate: registerUser, loading: registering } = useApiMutation('/users');

  // User lookup mutation
  const { mutate: lookupUser, loading: lookingUpUser } = useApiMutation('/users');

  // Update current time every second and refetch settings periodically
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Refetch settings every 10 seconds to get real-time updates from admin
    const settingsInterval = setInterval(() => {
      refetchSettings();
    }, 10000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(settingsInterval);
    };
  }, [refetchSettings]);

  // Update countdown and voting status based on database settings
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
      setTimeRemaining(`Voting starts in: ${formatTime(timeDiff)}`);
      setIsVotingPeriod(false);
    } else if (
      currentTime.getTime() >= votingStartTime.getTime() &&
      currentTime.getTime() <= votingEndTime.getTime()
    ) {
      const timeDiff = votingEndTime.getTime() - currentTime.getTime();
      setTimeRemaining(`Voting ends in: ${formatTime(timeDiff)}`);
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setFormData({ ...formData, image: imageUrl });
        toast.success("Image uploaded successfully!");
      };
      reader.onerror = () => {
        toast.error("Failed to upload image. Please try again.");
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.matricNumber.trim()) {
      toast.error("Please enter your matric number");
      return false;
    }

    // Validate matric number format (basic validation)
    const matricRegex = /^[a-zA-Z0-9]{6,15}$/;
    if (!matricRegex.test(formData.matricNumber)) {
      toast.error("Please enter a valid matric number (6-15 characters, letters and numbers only)");
      return false;
    }

    return true;
  };

  const checkUserInDatabase = async (matricNumber: string): Promise<ExistingUser | null> => {
    try {
      const result = await lookupUser({
        method: 'GET',
      }, null, {
        url: `/users?matricNumber=${encodeURIComponent(matricNumber.toLowerCase())}`
      });

      if (result.success && result.user) {
        return result.user;
      }
      return null;
    } catch (error: any) {
      // User not found is expected for new users
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  };

  const handleLogin = async () => {
    // Check voting period first
    if (!isVotingPeriod) {
      toast.error("You can only log in during the voting period");
      return;
    }

    // Validate matric number first
    if (!validateForm()) {
      return;
    }

    // Check if user has already voted (localStorage check)
    const existingVote = localStorage.getItem("voteRecord");
    if (existingVote) {
      toast.error("You have already voted. Login is restricted.");
      return;
    }

    setCheckingUser(true);
    const loadingToast = toast.loading("Checking your registration status...");

    try {
      // Step 1: Check if user exists in database
      const existingUser = await checkUserInDatabase(formData.matricNumber);

      if (existingUser) {
        // User exists - check voting status
        if (existingUser.hasVoted) {
          toast.error("This matric number has already voted!", { id: loadingToast });
          setCheckingUser(false);
          return;
        }

        // User exists and hasn't voted - proceed to voting
        toast.success("Welcome back! Redirecting to voting page...", { id: loadingToast });
        
        // Save user data and login time
        localStorage.setItem("voterData", JSON.stringify(existingUser));
        localStorage.setItem("loginTime", Date.now().toString());
        localStorage.setItem("electionSettings", JSON.stringify(settingsData.settings));
        
        // Small delay to show success message before redirect
        setTimeout(() => {
          window.location.href = "/vote";
        }, 1000);
        
      } else {
        // User doesn't exist - need full registration
        if (!formData.fullName.trim()) {
          toast.error("Please enter your full name for registration", { id: loadingToast });
          setCheckingUser(false);
          return;
        }

        if (!formData.department.trim()) {
          toast.error("Please enter your department for registration", { id: loadingToast });
          setCheckingUser(false);
          return;
        }

        toast.loading("Registering new user...", { id: loadingToast });

        // Register new user
        const result = await registerUser(formData);
        
        if (result.success) {
          // Save user data, login time, and settings
          localStorage.setItem("voterData", JSON.stringify(result.user));
          localStorage.setItem("loginTime", Date.now().toString());
          localStorage.setItem("electionSettings", JSON.stringify(settingsData.settings));
          
          toast.success("Registration successful! Redirecting to voting page...", { id: loadingToast });
          
          // Small delay to show success message before redirect
          setTimeout(() => {
            window.location.href = "/vote";
          }, 1000);
        }
      }
    } catch (error: any) {
      console.error("Login/Registration error:", error);
      const errorMessage = error.response?.data?.error || "An error occurred. Please try again.";
      toast.error(errorMessage, { id: loadingToast });
    } finally {
      setCheckingUser(false);
    }
  };

  // Show loading state while fetching settings
  if (settingsLoading) {
    return (
      <main className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading election status...</p>
          </div>
        </div>
      </main>
    );
  }

  const isProcessing = registering || lookingUpUser || checkingUser;

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
              onError={() => {
                toast.error("Failed to load faculty logo");
              }}
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
                  <strong>{timeRemaining}</strong>
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
              placeholder="Matric Number (e.g., 20/0001)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              onChange={handleInputChange}
              value={formData.matricNumber}
              disabled={isProcessing}
              maxLength={15}
              required
            />
          </div>
          
          <div>
            <input
              type="text"
              name="fullName"
              placeholder="Full Name (required for new users)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              onChange={handleInputChange}
              value={formData.fullName}
              disabled={isProcessing}
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              Only required if you're registering for the first time
            </p>
          </div>
          
          <div>
            <input
              type="text"
              name="department"
              placeholder="Department (required for new users)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              onChange={handleInputChange}
              value={formData.department}
              disabled={isProcessing}
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              Only required if you're registering for the first time
            </p>
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
                    ✓ Image uploaded successfully
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Click to change image
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-gray-600 font-medium">
                    Upload ID Card or Course Form
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Optional - Max 5MB, JPG/PNG
                  </p>
                </div>
              )}
            </label>
            <input
              id="image"
              type="file"
              name="image"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={isProcessing}
            />
          </div>

          <button
            type="submit"
            className={`w-full py-3 px-4 rounded-lg font-semibold transition duration-200 ${
              isVotingPeriod && !isProcessing
                ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!isVotingPeriod || isProcessing}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>
                  {checkingUser ? "Checking registration..." : 
                   lookingUpUser ? "Looking up user..." : 
                   registering ? "Registering..." : "Processing..."}
                </span>
              </div>
            ) : isVotingPeriod ? (
              "Login & Vote"
            ) : (
              "Voting Closed"
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <a
            href="/admin"
            className="block text-blue-500 hover:text-blue-600 text-sm font-medium transition duration-200"
            onClick={() => {
              toast.loading("Redirecting to admin dashboard...");
            }}
          >
            Admin Dashboard
          </a>
          
          {/* Quick Actions */}
          <div className="flex justify-center space-x-4 text-xs text-gray-500">
            <button
              onClick={() => {
                if (settingsData?.settings) {
                  toast.success("Settings refreshed!");
                  refetchSettings();
                } else {
                  toast.error("No settings available");
                }
              }}
              className="hover:text-blue-500 transition duration-200"
            >
              Refresh Status
            </button>
            <span>•</span>
            <button
              onClick={() => {
                const info = `
Current Time: ${currentTime.toLocaleString()}
Voting Status: ${isVotingPeriod ? 'Active' : 'Closed'}
Time Remaining: ${timeRemaining}
                `.trim();
                
                navigator.clipboard.writeText(info).then(() => {
                  toast.success("Election info copied to clipboard!");
                }).catch(() => {
                  toast.error("Failed to copy info");
                });
              }}
              className="hover:text-blue-500 transition duration-200"
            >
              Copy Info
            </button>
          </div>
        </div>

        {/* Enhanced Help Section */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">How it works:</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• <strong>Returning voters:</strong> Just enter your matric number</p>
            <p>• <strong>First-time voters:</strong> Fill all fields for registration</p>
            <p>• <strong>Security:</strong> Each matric number can only vote once</p>
            <p>• <strong>Verification:</strong> We check your registration status automatically</p>
          </div>
          <button
            onClick={() => {
              toast.info("Your matric number is checked against our database first. If you're already registered and haven't voted, you'll proceed directly. If you're new, you'll need to complete registration.", { duration: 6000 });
            }}
            className="mt-2 text-xs text-blue-500 hover:text-blue-600 transition duration-200"
          >
            Show security details
          </button>
        </div>
      </div>
    </main>
  );
}
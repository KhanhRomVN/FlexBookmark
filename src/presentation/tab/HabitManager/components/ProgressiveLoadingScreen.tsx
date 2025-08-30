import React from "react";

interface ProgressiveLoadingScreenProps {
  stage: "auth" | "cache" | "permissions" | "sync" | "complete";
  showDetails?: boolean;
  progress?: number;
}

const ProgressiveLoadingScreen: React.FC<ProgressiveLoadingScreenProps> = ({
  stage,
  showDetails = true,
  progress = 0,
}) => {
  const getStageInfo = () => {
    switch (stage) {
      case "auth":
        return {
          title: "Authenticating...",
          description: "Verifying Google account access",
          icon: "🔐",
        };
      case "cache":
        return {
          title: "Loading cached data...",
          description: "Restoring your habits from local storage",
          icon: "💾",
        };
      case "permissions":
        return {
          title: "Checking permissions...",
          description: "Verifying Google Drive and Sheets access",
          icon: "🛡️",
        };
      case "sync":
        return {
          title: "Syncing with cloud...",
          description: "Getting latest changes from Google Sheets",
          icon: "☁️",
        };
      case "complete":
        return {
          title: "Ready!",
          description: "Habit manager is ready to use",
          icon: "✅",
        };
      default:
        return {
          title: "Loading...",
          description: "Please wait",
          icon: "⏳",
        };
    }
  };

  const stageInfo = getStageInfo();

  const stages = [
    { key: "auth", label: "Auth", completed: stage !== "auth" },
    {
      key: "cache",
      label: "Cache",
      completed: !["auth", "cache"].includes(stage),
    },
    {
      key: "permissions",
      label: "Permissions",
      completed: !["auth", "cache", "permissions"].includes(stage),
    },
    { key: "sync", label: "Sync", completed: stage === "complete" },
  ];

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100">
      <div className="text-center p-8 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 max-w-md mx-4">
        {/* Main Icon */}
        <div className="text-6xl mb-4 animate-pulse">{stageInfo.icon}</div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          {stageInfo.title}
        </h3>

        {/* Description */}
        {showDetails && (
          <p className="text-slate-600 mb-6">{stageInfo.description}</p>
        )}

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(progress, 25)}%` }}
          ></div>
        </div>

        {/* Stage Indicators */}
        {showDetails && (
          <div className="flex justify-center space-x-2 mb-4">
            {stages.map((stageItem) => (
              <div
                key={stageItem.key}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  stageItem.completed
                    ? "bg-green-500"
                    : stageItem.key === stage
                    ? "bg-blue-500 animate-pulse"
                    : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        )}

        {/* Tips */}
        <div className="text-xs text-slate-500 space-y-1">
          <p>💡 First load takes longer, subsequent loads are instant</p>
          {stage === "cache" && (
            <p>📱 Using offline cache for faster experience</p>
          )}
          {stage === "sync" && <p>🔄 Syncing changes in background</p>}
        </div>
      </div>
    </div>
  );
};

export default ProgressiveLoadingScreen;

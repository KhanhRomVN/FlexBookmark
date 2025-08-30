import React from "react";

const ContributionStreak: React.FC = () => {
  // This would typically come from props or a hook
  const streakData = {
    currentStreak: 5,
    longestStreak: 10,
    monthlyCompletion: 75, // percentage
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        Contribution Streak
      </h3>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-slate-600">Current Streak:</span>
          <span className="font-bold text-green-600">
            {streakData.currentStreak} days
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-600">Longest Streak:</span>
          <span className="font-bold text-blue-600">
            {streakData.longestStreak} days
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-600">Monthly Completion:</span>
          <span className="font-bold text-purple-600">
            {streakData.monthlyCompletion}%
          </span>
        </div>

        <div className="bg-slate-100 rounded-full h-2 mt-2">
          <div
            className="bg-green-500 h-2 rounded-full"
            style={{ width: `${streakData.monthlyCompletion}%` }}
          ></div>
        </div>

        <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg mt-4">
          View Detailed Stats
        </button>
      </div>
    </div>
  );
};

export default ContributionStreak;

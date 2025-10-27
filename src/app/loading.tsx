import React from "react";

const loading = () => {
  return (
    <div className="flex-center w-full h-dvh bg-linear-to-br from-primary-800 via-secondary-800 to-tertiary-700">
      <div className="flex flex-col w-full max-w-2xl p-10 gap-10 bg-linear-to-b from-pink-700 via-primary-900 to-secondary-800 bg-cover bg-no-repeat rounded-xl shadow-lg">
        <p className="text-2xl font-bold text-slate-100">Loading...</p>
      </div>
    </div>
  );
};

export default loading;

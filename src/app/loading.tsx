import React from "react";
import Image from "next/image";

const loading = () => {
  return (
    <div className="relative w-full h-dvh overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/Assets/loading.png"
          alt="Loading Background"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="relative z-10 flex items-start justify-center w-full h-full pt-32">
        <p className="text-6xl font-bold text-blue-900">Loading...</p>
      </div>
    </div>
  );
};

export default loading;

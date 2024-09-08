"use client";

import { useRouter } from "next/navigation";
import React from "react";

const page = () => {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center">
      Home
      <button
        className="w-[220px] h-[40px] border-[1px]"
        onClick={() => {
          router.push("/list-books");
        }}
      >
        Go to list books
      </button>
    </div>
  );
};

export default page;

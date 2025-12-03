"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <div className="text-white text-2xl font-bold">Keycard MCP Registry</div>
        </div>
        <h1 className="text-4xl font-bold mb-4 text-white">Page Not Found</h1>
        <p className="text-gray-400 mb-8">
          The page you're looking for doesn't exist.
        </p>
        <a
          href="/"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
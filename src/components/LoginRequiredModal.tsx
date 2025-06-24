'use client'; // if using Next.js app router

import React from 'react';
import { useRouter } from 'next/navigation'; // use `useNavigate` for React Router

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginRequiredModal({ isOpen, onClose }: LoginRequiredModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 shadow-lg w-[90%] max-w-sm">
        <h2 className="text-xl font-bold mb-4 text-center text-black">Sign in Required</h2>
        <p className="text-gray-600 mb-6 text-center">Please sign in to access this feature.</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/auth/login')}
            className="bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition"
          >
            Sign In
          </button>
          <button
            onClick={() => router.push('/auth/register')}
            className="bg-gray-200 text-gray-800 py-2 rounded-xl hover:bg-gray-300 transition"
          >
            Register
          </button>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 mt-2 hover:underline text-center"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

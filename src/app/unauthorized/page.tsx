// app/unauthorized/page.tsx
export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-3xl font-bold text-red-500">Access Denied</h1>
      <p className="mt-4 text-gray-300">
        You're not allowed to access this page directly.
      </p>
    </div>
  );
}

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-6 py-12">
      <div>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">
            AI StudyMate
          </h1>

          <p className="text-gray-400 mt-3">
            Welcome back to your learning journey
          </p>
        </div>

        <SignIn />
      </div>
    </main>
  );
}
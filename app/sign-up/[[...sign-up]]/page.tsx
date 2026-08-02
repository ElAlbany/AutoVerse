import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-28">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 mt-2">Join CarHub and start renting</p>
        </div>
        <SignUp
          appearance={{
            elements: {
              card: "shadow-xl border-0 rounded-3xl",
              formButtonPrimary:
                "bg-primary-blue hover:bg-blue-700 rounded-full text-white",
              socialButtonsBlockButton:
                "border-gray-200 hover:bg-gray-50 rounded-xl",
              formFieldInput:
                "rounded-xl border-gray-200 focus:ring-2 focus:ring-primary-blue/20 focus:border-primary-blue",
            },
            variables: {
              colorPrimary: "#2563eb",
              borderRadius: "12px",
            },
          }}
        />
      </div>
    </main>
  );
}

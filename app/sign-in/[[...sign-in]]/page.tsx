import { SignIn } from "@clerk/nextjs";
import { safeReturnTo } from "@/lib/sign-in";
export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const redirect = safeReturnTo(params.redirect_url);
  return (
    <main className="av-shell av-page flex flex-col items-center">
      <p className="av-eyebrow">AutoVerse / Your account</p>
      <h1 className="text-center">Welcome back.</h1>
      <p className="av-muted mb-8 text-center">
        Your selection is saved in the return link. Continue where you left off.
      </p>
      <SignIn
        signUpUrl={`/sign-up?redirect_url=${encodeURIComponent(redirect)}`}
        forceRedirectUrl={redirect}
        fallbackRedirectUrl="/profile/orders"
        appearance={{
          variables: { colorPrimary: "#234b3a", borderRadius: "4px" },
          elements: { card: "shadow-none border border-stone-200" },
        }}
      />
    </main>
  );
}

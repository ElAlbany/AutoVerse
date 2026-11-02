import Comparison from "@/components/Comparison";
export const metadata = { title: "Compare cars · AutoVerse" };
export default function ComparePage() {
  return (
    <main className="av-shell av-page">
      <p className="av-eyebrow">A considered choice</p>
      <h1>Find your fit.</h1>
      <p className="av-intro">
        The details that make a difference, side by side.
      </p>
      <Comparison />
    </main>
  );
}

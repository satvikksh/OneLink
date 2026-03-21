import { Suspense } from "react";
import AuthForm from "../../components/education/AuthForm";

export default function InstituteLoginPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-slate-600">Loading...</p>}>
      <AuthForm mode="login" role="institute" />
    </Suspense>
  );
}

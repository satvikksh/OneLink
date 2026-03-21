import { redirect } from "next/navigation";

export default function LegacyInstitutionRoute() {
  redirect("/institutes/dashboard");
}

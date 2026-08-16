import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import BudgetApp from "@/components/BudgetApp";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return <BudgetApp />;
}

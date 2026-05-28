import { cookies } from "next/headers";
import { redirect } from 'next/navigation';
import { SidebarWrapper } from "@/components/layout/SidebarWrapper";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const lang: string = 'ru';

  return (
    <SidebarWrapper lang={lang} userRole={user.role}>
      {children}
    </SidebarWrapper>
  );
}

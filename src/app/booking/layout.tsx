import { Header } from "@/components/layout/header";

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
    </>
  );
}

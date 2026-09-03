import TrainerSidebar from '@/components/TrainerSidebar';

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col lg:flex-row">
      <TrainerSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}

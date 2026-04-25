export default function App({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  return (
    <span className="flex flex-col select-none cursor-pointer transition-shadow duration-300">
      <div className="w-16 h-16 bg-gray-200/50 rounded-2xl overflow-hidden flex items-center justify-center text-white hover:shadow-xl">
        {children}
      </div>
      <div className="flex flex-col items-center pt-1.5">
        <h2 className="text-[0.8rem] font-medium mt-4 text-white">{name}</h2>
      </div>
    </span>
  );
}

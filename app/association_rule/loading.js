export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-sky-50">
      
      
      <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin"></div>
      
    
      <p className="mt-4 text-sky-600 font-bold animate-pulse">
        กำลังโหลดข้อมูล...
      </p>
      
    </div>
  );
}
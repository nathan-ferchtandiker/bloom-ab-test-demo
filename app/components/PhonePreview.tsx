// @ts-nocheck

export default function PhonePreview({ image }) {
  return (
    <div className="relative w-[320px] h-[650px] bg-white rounded-[40px] shadow-xl border-4 border-gray-200 flex flex-col overflow-hidden">
      
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center text-gray-500 text-base">
        {image ? (
          <img src={image} alt="Phone content" className="max-h-full max-w-full object-contain" />
        ) : (
          'Create an app by typing'
        )}
      </div>
    </div>
  );
} 
"use client";

export default function CameraStatus({ isActive, isConnecting, error, fps }) {
  let color = "bg-gray-400";
  let label = "Inactive";

  if (isConnecting) {
    color = "bg-yellow-400 animate-pulse";
    label = "Connecting...";
  } else if (error) {
    color = "bg-red-500";
    label = error;
  } else if (isActive) {
    color = "bg-green-500 animate-pulse";
    label = fps ? `${fps} fps` : "Active";
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

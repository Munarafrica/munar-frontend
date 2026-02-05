import React from "react";

export const Divider = ({ text }: { text: string }) => (
  <div className="flex items-center gap-4 w-full my-6">
    <div className="h-px bg-slate-200 flex-1" />
    <span className="text-[13px] text-slate-500 whitespace-nowrap">{text}</span>
    <div className="h-px bg-slate-200 flex-1" />
  </div>
);

'use client';

import React from 'react';
import { AlertTriangle, Trash2, Loader2, X } from 'lucide-react';
import { IncidentRecord } from '@/types';

interface DeleteModalProps {
  record: IncidentRecord | null;
  onConfirm: () => void;
  onCancel: () => void;
  deleting?: boolean;
}

export default function DeleteModal({
  record,
  onConfirm,
  onCancel,
  deleting = false,
}: DeleteModalProps) {
  if (!record) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#D8E2E8] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Alert Banner */}
        <div className="bg-rose-50 border-b border-rose-100 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-[#DC2626] shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#DC2626]">
              रेकर्ड मेटाउने निश्चित गर्नुहुन्छ?
            </h3>
            <p className="text-xs text-[#DC2626]/80 mt-1">
              यो कार्य पूर्ववत (Undo) गर्न सकिने छैन। यो तथ्याङ्क डेटाबेसबाट स्थायी रूपमा हटाइनेछ र अडिट लगमा दर्ता हुनेछ।
            </p>
          </div>
          <button
            onClick={onCancel}
            disabled={deleting}
            className="text-[#64748B] hover:text-[#1E293B] p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Record Details Snippet */}
        <div className="p-5 space-y-3 text-sm">
          <div className="bg-[#F4F8FA] p-3.5 rounded-xl border border-[#D8E2E8] space-y-1.5 font-sans">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#64748B]">दर्ता कोड:</span>
              <span className="font-mono font-bold text-[#176B87]">{record.record_code}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#64748B]">प्रभावितको नाम:</span>
              <span className="font-bold text-[#1E293B]">{record.full_name}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#64748B]">जिल्ला / ठेगाना:</span>
              <span className="font-medium text-[#1E293B]">{record.district}, {record.municipality}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 bg-[#F4F8FA] border-t border-[#D8E2E8] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 text-sm font-semibold text-[#1E293B] hover:bg-[#E8F3F6] bg-white border border-[#D8E2E8] rounded-lg transition-colors cursor-pointer"
          >
            रद्द गर्नुहोस्
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#DC2626] hover:bg-[#b91c1c] active:bg-[#991b1b] rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>मेटाउँदै...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>स्थायी रूपमा मेटाउनुहोस्</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

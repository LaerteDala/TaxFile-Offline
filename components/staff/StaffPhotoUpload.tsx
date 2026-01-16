import React from 'react';
import { User, Camera, Plus } from 'lucide-react';

interface StaffPhotoUploadProps {
    selectedPhoto: File | null;
    photoPath: string | undefined;
    onPhotoClick: () => void;
    photoInputRef: React.RefObject<HTMLInputElement>;
    onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const StaffPhotoUpload: React.FC<StaffPhotoUploadProps> = ({
    selectedPhoto,
    photoPath,
    onPhotoClick,
    photoInputRef,
    onPhotoChange
}) => {
    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group">
                <div className="w-32 h-32 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group-hover:border-blue-400 transition-all">
                    {selectedPhoto ? (
                        <img src={URL.createObjectURL(selectedPhoto)} alt="Preview" className="w-full h-full object-cover" />
                    ) : photoPath ? (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <User size={48} />
                        </div>
                    ) : (
                        <Camera size={32} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
                    )}
                </div>
                <button
                    type="button"
                    onClick={onPhotoClick}
                    className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95"
                >
                    <Plus size={16} />
                </button>
                <input
                    type="file"
                    ref={photoInputRef}
                    onChange={onPhotoChange}
                    accept="image/*"
                    className="hidden"
                />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fotografia</span>
        </div>
    );
};

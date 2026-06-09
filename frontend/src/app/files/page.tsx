"use client";

import React, { useEffect, useRef } from 'react';
import { useJarvisStore } from '@/hooks/useJarvisStore';
import { FolderSearch, Upload, FileText, ImageIcon, FileCode, Archive } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function FilesPage() {
  const store = useJarvisStore();
  const fetchFiles = useJarvisStore((state) => state.fetchFiles);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await store.uploadFile(e.target.files[0]);
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['png', 'jpg', 'jpeg', 'gif'].includes(ext || '')) return <ImageIcon size={24} className="text-[#00C2FF]" />;
    if (['js', 'ts', 'py', 'json', 'html', 'css'].includes(ext || '')) return <FileCode size={24} className="text-[#F5A623]" />;
    if (['zip', 'tar', 'gz'].includes(ext || '')) return <Archive size={24} className="text-[#FF4D4D]" />;
    return <FileText size={24} className="text-[#6B7F8E]" />;
  };

  return (
    <div className="p-6 md:p-12 w-full h-full flex flex-col gap-6 overflow-y-auto bg-background text-[#E8EDF2]">
      <div className="flex items-center justify-between border-b border-[#1E2A35]/30 pb-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
            <FolderSearch size={24} />
          </div>
          <div>
            <h1 className="text-lg font-mono uppercase tracking-widest text-[#E8EDF2] font-bold">Workspace Files</h1>
            <p className="text-xs text-[#6B7F8E]">Agent accessible file system</p>
          </div>
        </div>
        
        <div>
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload}
          />
          <Button variant="ghost" className="text-xs font-mono uppercase tracking-wider border border-[#1E2A35] text-[#6B7F8E] hover:text-[#00C2FF] hover:border-[#00C2FF] h-9 px-3 rounded-lg transition-all" onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} className="mr-2" />
            Upload File
          </Button>
        </div>
      </div>

      <div className="flex-1 mt-4">
        {store.files.length === 0 ? (
          <div className="text-center p-12 text-[#6B7F8E] border border-dashed border-[#1E2A35] rounded-xl flex flex-col items-center justify-center gap-4">
            <FolderSearch size={36} className="text-[#6B7F8E]/20" />
            <p className="text-xs font-mono uppercase tracking-wider">No files in workspace.</p>
            <Button variant="ghost" size="sm" className="text-xs font-mono uppercase tracking-wider border border-[#1E2A35] text-[#6B7F8E] hover:text-[#00C2FF] hover:border-[#00C2FF] h-8 px-2.5 rounded-md transition-all" onClick={() => fileInputRef.current?.click()}>
              Upload First File
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {store.files.map((file, idx) => (
              <Card key={idx} className="bg-[#0E1318] border-[#1E2A35] hover:shadow-[0_0_12px_rgba(0,194,255,0.15)] transition-all cursor-pointer group">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-3 h-32">
                  <div className="p-2 bg-[#141B22]/50 rounded-lg group-hover:scale-105 transition-transform border border-[#1E2A35]/30">
                    {getFileIcon(file.filename || file.name || 'file.txt')}
                  </div>
                  <span className="text-xs text-[#E8EDF2] font-medium truncate w-full px-2" title={file.filename || file.name}>
                    {file.filename || file.name || 'Unknown'}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

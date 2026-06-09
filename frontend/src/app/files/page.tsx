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
    if (['png', 'jpg', 'jpeg', 'gif'].includes(ext || '')) return <ImageIcon size={24} className="text-blue-400" />;
    if (['js', 'ts', 'py', 'json', 'html', 'css'].includes(ext || '')) return <FileCode size={24} className="text-yellow-400" />;
    if (['zip', 'tar', 'gz'].includes(ext || '')) return <Archive size={24} className="text-red-400" />;
    return <FileText size={24} className="text-white/60" />;
  };

  return (
    <div className="p-6 md:p-12 w-full h-full flex flex-col gap-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <FolderSearch size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Workspace Files</h1>
            <p className="text-sm text-muted-foreground">Agent accessible file system</p>
          </div>
        </div>
        
        <div>
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload}
          />
          <Button variant="glass" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} className="mr-2" />
            Upload File
          </Button>
        </div>
      </div>

      <div className="flex-1 mt-6">
        {store.files.length === 0 ? (
          <div className="text-center p-12 text-muted-foreground border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-4">
            <FolderSearch size={48} className="text-white/10" />
            <p>No files in workspace.</p>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              Upload First File
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {store.files.map((file, idx) => (
              <Card key={idx} className="bg-white/5 border-white/5 hover:border-primary/30 transition-colors cursor-pointer group">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-3 h-32">
                  <div className="p-2 bg-black/40 rounded-lg group-hover:scale-110 transition-transform">
                    {getFileIcon(file.filename || file.name || 'file.txt')}
                  </div>
                  <span className="text-xs text-white/80 font-medium truncate w-full px-2" title={file.filename || file.name}>
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

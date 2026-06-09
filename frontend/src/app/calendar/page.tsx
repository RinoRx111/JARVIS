"use client";

import React, { useEffect, useState } from 'react';
import { useJarvisStore } from '@/hooks/useJarvisStore';
import { CalendarDays, Plus, Clock, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CalendarPage() {
  const store = useJarvisStore();
  const fetchEvents = useJarvisStore((state) => state.fetchEvents);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <div className="p-6 md:p-12 w-full h-full flex flex-col gap-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <CalendarDays size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Schedule Array</h1>
            <p className="text-sm text-muted-foreground">Google Calendar integration</p>
          </div>
        </div>
        
        <Button variant="glass">
          <Plus size={16} className="mr-2" />
          Add Event
        </Button>
      </div>

      <div className="flex-1 mt-6">
        {store.events.length === 0 ? (
          <div className="text-center p-12 text-muted-foreground border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-4">
            <CalendarDays size={48} className="text-white/10" />
            <p>No upcoming events found or token requires synchronization.</p>
            <Button variant="outline" size="sm">Connect Calendar API</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {store.events.map((event) => (
              <Card key={event.id} className="bg-white/5 border-l-4 border-l-primary border-y-white/5 border-r-white/5 hover:bg-white/10 transition-colors">
                <CardContent className="p-4 flex gap-4">
                  <div className="flex flex-col items-center justify-center px-4 border-r border-white/10">
                    <span className="text-xs text-primary font-bold uppercase">{new Date(event.start).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-2xl font-bold text-white">{new Date(event.start).getDate()}</span>
                  </div>
                  <div className="flex-1 py-1">
                    <h3 className="font-semibold text-lg text-white mb-1">{event.summary}</h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(event.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                    {event.description && <p className="text-sm text-white/50 mt-2">{event.description}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

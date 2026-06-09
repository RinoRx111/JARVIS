"use client";

import React, { useEffect } from 'react';
import { Activity, Coins, Cpu, Network } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useJarvisStore } from '@/hooks/useJarvisStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function AnalyticsPage() {
  const store = useJarvisStore();
  const fetchAnalytics = useJarvisStore((state) => state.fetchAnalytics);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const data = store.analyticsData || { tokens: null, tools: null };
  const tokens = data.tokens;
  const tools = data.tools;

  const timeSeriesData = tokens?.time_series 
    ? Object.keys(tokens.time_series).map(date => ({
        date,
        cost: tokens.time_series[date].cost,
        tokens: tokens.time_series[date].prompt + tokens.time_series[date].completion
      }))
    : [];

  const agentData = tools?.agent_invocations
    ? Object.keys(tools.agent_invocations).map(agent => ({
        name: agent,
        calls: tools.agent_invocations[agent]
      }))
    : [];

  return (
    <div className="p-6 md:p-12 w-full h-full flex flex-col gap-6 overflow-y-auto">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-xl text-primary">
          <Activity size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">System Telemetry</h1>
          <p className="text-sm text-muted-foreground">Real-time cost and usage analytics</p>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estimated Cost</p>
                <p className="text-3xl font-bold text-white mt-2">${tokens?.summary?.total_cost_usd?.toFixed(4) || "0.0000"}</p>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-500">
                <Coins size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tokens</p>
                <p className="text-3xl font-bold text-white mt-2">{tokens?.summary?.total_tokens || 0}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full text-primary">
                <Cpu size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Agent Invocations</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {agentData.reduce((acc, curr) => acc + curr.calls, 0)}
                </p>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-full text-amber-500">
                <Network size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg">Token Usage (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {timeSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#888" fontSize={12} tickMargin={10} />
                  <YAxis stroke="#888" fontSize={12} tickFormatter={(val) => `${val / 1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)' }} 
                    itemStyle={{ color: '#00f3ff' }}
                  />
                  <Line type="monotone" dataKey="tokens" stroke="#00f3ff" strokeWidth={2} dot={{ r: 4, fill: '#00f3ff' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No usage data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg">Sub-Agent Workload</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {agentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#888" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#888" fontSize={12} width={100} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="calls" fill="#00f3ff" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No agent activity logged</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

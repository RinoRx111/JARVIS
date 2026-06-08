"use client";

import React, { useState, useEffect } from 'react';
import { UserMemory } from '../hooks/useJarvisStore';

interface KnowledgeGraphProps {
  memories: UserMemory[];
}

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  type: 'core' | 'memory' | 'preference';
}

interface Edge {
  source: string;
  target: string;
}

export default function KnowledgeGraph({ memories }: KnowledgeGraphProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    // 1. Create default center core node
    const coreNode: Node = { id: 'core', label: 'JARVIS Core', x: 150, y: 150, type: 'core' };
    const tempNodes: Node[] = [coreNode];
    const tempEdges: Edge[] = [];

    // 2. Generate random positions around the core for each memory node
    memories.forEach((mem, index) => {
      const angle = (index * 2 * Math.PI) / Math.max(memories.length, 1);
      const radius = 90 + Math.random() * 25; // Randomize distance slightly
      const x = 150 + radius * Math.cos(angle);
      const y = 150 + radius * Math.sin(angle);
      
      const node: Node = {
        id: mem.id,
        label: mem.content.length > 25 ? mem.content.slice(0, 22) + '...' : mem.content,
        x,
        y,
        type: 'memory'
      };

      tempNodes.push(node);
      
      // Connect memory to core
      tempEdges.push({ source: 'core', target: node.id });
      
      // Connect adjacent nodes to form a web loop
      if (index > 0) {
        tempEdges.push({ source: tempNodes[index].id, target: node.id });
      }
    });

    // Connect last memory back to first if multiple exist
    if (memories.length > 2) {
      tempEdges.push({ source: tempNodes[tempNodes.length - 1].id, target: tempNodes[1].id });
    }

    setNodes(tempNodes);
    setEdges(tempEdges);
  }, [memories]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono-digital text-xs">
      <div className="md:col-span-2 border border-cyan-500/20 rounded-lg p-3 bg-slate-950/30 relative min-h-[320px]">
        {/* Background Scan Grid inside visualizer */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,243,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none rounded-lg" />
        
        <div className="absolute top-2 left-2 text-[10px] text-cyan-500/50 uppercase tracking-wider">
          Entity Relationship Mapping (Grid 300x300)
        </div>

        <svg viewBox="0 0 300 300" className="w-full h-full relative z-10 overflow-visible">
          {/* Draw Edges */}
          {edges.map((edge, i) => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;
            return (
              <line
                key={`edge-${i}`}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke={selectedNode?.id === targetNode.id ? "rgba(0, 255, 136, 0.5)" : "rgba(0, 243, 255, 0.15)"}
                strokeWidth={selectedNode?.id === targetNode.id ? "1.5" : "0.75"}
                strokeDasharray={sourceNode.type === 'core' ? "2 2" : "none"}
              />
            );
          })}

          {/* Draw Nodes */}
          {nodes.map((node) => {
            const isCore = node.type === 'core';
            const isSelected = selectedNode?.id === node.id;
            
            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer"
                onClick={() => setSelectedNode(node)}
              >
                {/* Node outer pulse ring */}
                <circle
                  r={isCore ? 14 : 7}
                  fill={isCore ? "rgba(0, 243, 255, 0.25)" : "rgba(0, 243, 255, 0.1)"}
                  stroke={isCore ? "rgba(0, 243, 255, 0.8)" : isSelected ? "rgb(0, 255, 136)" : "rgba(0, 243, 255, 0.4)"}
                  strokeWidth={isSelected ? 2 : 1}
                  className={isSelected || isCore ? "animate-pulse" : ""}
                />
                {/* Central dot */}
                <circle
                  r={isCore ? 5 : 2.5}
                  fill={isCore ? "rgb(0, 243, 255)" : isSelected ? "rgb(0, 255, 136)" : "rgba(0, 243, 255, 0.8)"}
                />
                
                {/* Label text */}
                {!isCore && (
                  <text
                    y="-10"
                    textAnchor="middle"
                    fill={isSelected ? "rgb(0, 255, 136)" : "rgba(175, 230, 255, 0.85)"}
                    fontSize="7"
                    className="font-semibold select-none pointer-events-none"
                  >
                    {node.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Side Info Details */}
      <div className="border border-cyan-500/20 rounded-lg p-3 bg-slate-950/40 flex flex-col justify-between">
        <div>
          <div className="border-b border-cyan-500/10 pb-2 mb-3 text-cyan-400 font-bold uppercase tracking-wider">
            Entity Details
          </div>

          {selectedNode ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/40">NODE_ID:</span>
                <span className="text-cyan-300 select-all">{selectedNode.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">NODE_TYPE:</span>
                <span className="text-cyan-300 uppercase">{selectedNode.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">LOC_COORD:</span>
                <span className="text-cyan-300">[{Math.round(selectedNode.x)}, {Math.round(selectedNode.y)}]</span>
              </div>
              <div className="border-t border-cyan-500/10 pt-2.5 mt-2">
                <div className="text-white/40 mb-1">RAW_METADATA_CONTENT:</div>
                <div className="text-cyan-200 leading-relaxed max-h-40 overflow-y-auto pr-1">
                  {selectedNode.type === 'core' 
                    ? 'Central orchestrator indexing cognitive database nodes.' 
                    : memories.find(m => m.id === selectedNode.id)?.content || selectedNode.label
                  }
                </div>
              </div>
            </div>
          ) : (
            <p className="text-white/30 italic text-center py-12">
              Select a node in the graphic matrix to query details...
            </p>
          )}
        </div>
        
        {selectedNode && selectedNode.type !== 'core' && (
          <div className="border-t border-cyan-500/10 pt-2 mt-4 text-[10px] text-white/40">
            Node status online. Memory index persists in vector buffer.
          </div>
        )}
      </div>
    </div>
  );
}

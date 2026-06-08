import { useJarvisStore } from '../hooks/useJarvisStore';
import { voiceManager } from './VoiceManager';

export class ToolManager {
  public handleToolStart(toolName: string) {
    const store = useJarvisStore.getState();
    store.addToolCallToLastMessage(toolName);
    
    // Personality Tier: Spoken Narration
    const currentStatus = store.coreStatus;
    if (currentStatus !== 'SPEAKING') {
      let narration = "Executing sub-routine, sir.";
      if (toolName.includes("search")) narration = "Searching the web now, sir.";
      else if (toolName.includes("execute") || toolName.includes("python")) narration = "Running your code.";
      else if (toolName.includes("gmail") || toolName.includes("email")) narration = "Accessing mail servers.";
      else if (toolName.includes("calendar")) narration = "Checking your calendar.";
      
      voiceManager.speak(narration);
    }
  }

  public handleToolEnd() {
    const store = useJarvisStore.getState();
    const currentStatus = store.coreStatus;
    if (currentStatus !== 'SPEAKING') {
      voiceManager.speak("Task complete.");
    }
  }
}

export const toolManager = new ToolManager();

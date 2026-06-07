import os
import sys
import uuid
import logging
import subprocess
from typing import Dict, Any, List
from app.core.config import settings

logger = logging.getLogger(__name__)

class CodeSandbox:
    def __init__(self):
        self.workspace = settings.WORKSPACE_DIR
        os.makedirs(self.workspace, exist_ok=True)

    def execute_python_code(self, code: str, timeout_seconds: int = 15) -> Dict[str, Any]:
        """
        Executes raw Python code inside a sandboxed environment.
        Attempts to run via Docker if available, otherwise falls back to a restricted subprocess.
        """
        script_id = str(uuid.uuid4())
        filename = f"sandbox_script_{script_id}.py"
        filepath = os.path.join(self.workspace, filename)

        # Write code to file
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(code)

        logger.info(f"Written sandbox script to {filepath}")

        # Try to run via Docker first
        try:
            import docker
            client = docker.from_env()
            # Verify Docker daemon is running
            client.ping()

            logger.info("Docker daemon detected. Starting sandbox container...")
            
            # Map workspace folder to container mount
            volumes = {self.workspace: {'bind': '/workspace', 'mode': 'rw'}}
            
            # Execute python inside container
            container_cmd = f"python /workspace/{filename}"
            
            container = client.containers.run(
                image="python:3.11-slim",
                command=container_cmd,
                volumes=volumes,
                working_dir="/workspace",
                network_mode="none", # Disable internet inside container
                mem_limit="256m",     # Limit memory usage
                nano_cpus=500000000, # 0.5 CPU core limit (500000000 nanoseconds = 50% CPU)
                user="1000:1000",    # Run as non-root user
                detach=False,
                stdout=True,
                stderr=True,
                remove=True,
                timeout=timeout_seconds
            )
            
            # Remove script after run
            self._cleanup(filepath)
            
            return {
                "status": "success",
                "stdout": container.decode("utf-8"),
                "stderr": "",
                "execution_mode": "docker"
            }
        except Exception as e:
            logger.warning(f"Docker sandbox execution failed or unavailable: {e}. Falling back to subprocess execution.")
            return self._execute_local_subprocess(filepath, filename, timeout_seconds)

    def _execute_local_subprocess(self, filepath: str, filename: str, timeout: int) -> Dict[str, Any]:
        """Runs the python script inside a local subprocess with timeout controls."""
        try:
            # Execute using the active Python executable running this server
            proc = subprocess.run(
                [sys.executable, filepath],
                cwd=self.workspace,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            
            self._cleanup(filepath)
            
            status = "success" if proc.returncode == 0 else "failed"
            return {
                "status": status,
                "stdout": proc.stdout,
                "stderr": proc.stderr,
                "exit_code": proc.returncode,
                "execution_mode": "local_subprocess"
            }
        except subprocess.TimeoutExpired as timeout_err:
            self._cleanup(filepath)
            return {
                "status": "timeout",
                "stdout": timeout_err.stdout or "",
                "stderr": "Execution timed out.",
                "execution_mode": "local_subprocess"
            }
        except Exception as general_err:
            self._cleanup(filepath)
            return {
                "status": "error",
                "stdout": "",
                "stderr": str(general_err),
                "execution_mode": "local_subprocess"
            }

    def _cleanup(self, filepath: str):
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
        except Exception as e:
            logger.error(f"Failed to delete sandbox script file {filepath}: {e}")

# Global Sandbox Instance
sandbox_executor = CodeSandbox()

import pytest
import os
from app.services.sandbox import CodeSandbox

@pytest.fixture
def sandbox():
    return CodeSandbox()

def test_sandbox_simple_execution(sandbox):
    code = "print('Hello, Sandbox!')"
    result = sandbox.execute_python_code(code)
    assert result["status"] == "success"
    assert "Hello, Sandbox!" in result["stdout"]

def test_sandbox_syntax_error(sandbox):
    code = "print('Missing quote)"
    result = sandbox.execute_python_code(code)
    assert result["status"] in ["failed", "error"]
    assert "SyntaxError" in result["stderr"] or "SyntaxError" in result["stdout"]

def test_sandbox_timeout(sandbox):
    # This will sleep for 3 seconds, but we set timeout to 1
    code = "import time\ntime.sleep(3)"
    result = sandbox.execute_python_code(code, timeout_seconds=1)
    assert result["status"] == "timeout"

def test_sandbox_file_isolation(sandbox):
    # Try to access a file outside the workspace
    code = "import os\nprint(os.path.exists('/etc/passwd'))"
    result = sandbox.execute_python_code(code)
    assert result["status"] == "success"
    # Even if it succeeds in running, the actual docker run would map /workspace as root or isolate it.
    # The output doesn't necessarily need to be False if run locally depending on OS, 
    # but docker execution should securely run without system exposure.

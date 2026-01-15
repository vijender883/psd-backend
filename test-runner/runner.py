import sys
import json
import os
from importlib import util

# Add the project root to sys.path so we can import adapters
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)

def load_adapter(adapter_type):
    """
    Dynamically loads the adapter module based on adapter_type.
    Defaults to 'standard' if type is unknown or missing.
    """
    if not adapter_type:
        adapter_type = "standard"
        
    # Map friendly names to filenames if needed, or just use direct mapping
    # e.g., "unordered-list" -> "unordered_list"
    module_name = adapter_type.replace("-", "_")
    file_path = os.path.join(project_root, "adapters", f"{module_name}.py")

    if not os.path.exists(file_path):
        # Fallback to standard if specific adapter file not found
        file_path = os.path.join(project_root, "adapters", "standard.py")

    try:
        spec = util.spec_from_file_location(f"adapters.{module_name}", file_path)
        module = util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module.Adapter()
    except Exception as e:
        # If anything goes wrong loading adapter, fallback to a simple equality check
        class FallbackAdapter:
            def validate(self, a, b): return a == b
        return FallbackAdapter()

def run_tests(payload):
    user_code = payload['user_code']
    problem = payload['problem']
    
    # 1. Execute User Code
    namespace = {}
    try:
        exec(user_code, namespace)
    except Exception as e:
        return {
            "status": "error",
            "error": f"Syntax/Runtime Error during code loading: {str(e)}",
            "results": []
        }

    # 2. Instantiate Solution
    # We assume the class is always named 'Solution' per our template convention
    if 'Solution' not in namespace:
         return {
            "status": "error",
            "error": "Class 'Solution' not found in your code.",
            "results": []
        }
        
    try:
        solution_instance = namespace['Solution']()
    except Exception as e:
         return {
            "status": "error",
            "error": f"Error instantiating Solution class: {str(e)}",
            "results": []
        }

    # 3. Get generic function
    func_name = problem['function_name']
    if not hasattr(solution_instance, func_name):
        return {
            "status": "error",
            "error": f"Function '{func_name}' not found in Solution class.",
            "results": []
        }
    
    func = getattr(solution_instance, func_name)

    # 4. Load Adapter
    adapter = load_adapter(problem.get('adapter_type', 'standard'))

    results = []
    
    # 5. Run Test Cases
    for i, test_case in enumerate(problem['test_cases']):
        inputs = test_case['input'] # Expected to be a list [arg1, arg2...]
        expected = test_case['output']
        
        result_entry = {
            "test_case": i + 1,
            "input": inputs,
            "expected": expected,
            "passed": False,
            "actual": None,
            "error": None
        }

        try:
            # We expect inputs to be a list/tuple of arguments
            # Use * unpacking to pass them as separate args
            # If the input in JSON is NOT a list (legacy), wrap it
            if not isinstance(inputs, list):
                args = [inputs]
            else:
                args = inputs
            
            actual = func(*args)
            result_entry['actual'] = actual
            
            # Validate
            passed = adapter.validate(actual, expected)
            result_entry['passed'] = passed
            
        except Exception as e:
             result_entry['error'] = str(e)
        
        results.append(result_entry)

    # Calculate Summary
    total = len(results)
    passed_count = sum(1 for r in results if r['passed'])
    
    return {
        "status": "success",
        "total": total,
        "passed": passed_count,
        "results": results
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "error": "No payload file provided"}))
        sys.exit(1)
        
    payload_path = sys.argv[1]
    
    try:
        with open(payload_path, 'r') as f:
            payload = json.load(f)
            
        output = run_tests(payload)
        print(json.dumps(output))
        
    except Exception as e:
        print(json.dumps({"status": "error", "error": f"System Error: {str(e)}"}))
        sys.exit(1)

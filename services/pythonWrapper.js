// services/pythonWrapper.js
const fs = require('fs').promises;
const path = require('path');

async function generatePythonWrapper(executionDir, code, problemId = null) {
  let wrapperCode;

  if (problemId) {
    switch (problemId) {
      case 'min_path_sum':
      case 'minimumpathsum':
        wrapperCode = generateMinPathSumWrapper(code);
        break;
      case 'diagonal_traversal':
      case 'diagonaltraversal':
        wrapperCode = generateDiagonalTraversalWrapper(code);
        break;
      case 'length_of_lis':
      case 'longestincreasing':
        wrapperCode = generateLISWrapper(code);
        break;
      case 'count_consecutive_chars':
      case 'countconsecutive':
        wrapperCode = generateConsecutiveCharsWrapper(code);
        break;
      case 'find_closest_element':
      case 'closestvalueinrotatedarray':
        wrapperCode = generateClosestValueWrapper(code);
        break;
      case 'check_inclusion':
      case 'permutationinstring':
        wrapperCode = generatePermutationInStringWrapper(code);
        break;
      case 'total_fruit':
      case 'fruitintobaskets':
        wrapperCode = generateFruitIntoBasketsWrapper(code);
        break;
      case 'is_anagram':
      case 'validanagram':
        wrapperCode = generateValidAnagramWrapper(code);
        break;
      case 'three_sum':
        wrapperCode = generateThreeSumWrapper(code);
        break;
      case 'reverse_string':
        wrapperCode = generateReverseStringWrapper(code);
        break;
      case 'two_sum':
      case 'twosum':
        wrapperCode = generateTwoSumWrapper(code);
        break;
      case 'minimum_gpu_capacity':
        wrapperCode = generateGPUOptimizerWrapper(code);
        break;
      case 'longest_balanced_stretch':
      case 'traffic_flow_analysis':
        wrapperCode = generateTrafficFlowWrapper(code);
        break;
      case 'find_activity_range':
        wrapperCode = generateFindActivityRangeWrapper(code);
        break;
      case 'removeNthFromEnd':
      case 'deletenthfromend':
        wrapperCode = generateRemoveNthFromEndWrapper(code);
        break;
      case 'longestcommonprefix':
        wrapperCode = generateLongestCommonPrefixWrapper(code);
        break;
      case 'target_difference':
        wrapperCode = generateTargetDifferenceWrapper(code);
        break;
      case 'largest_element':
        wrapperCode = generateLargestElementWrapper(code);
        break;
      case 'second_smallest_largest':
        wrapperCode = generateSecondSmallestLargestWrapper(code);
        break;
      default:
        wrapperCode = generateFallbackWrapper(code);
    }
  }

  if (!wrapperCode) {
    // Fallback detection
    if (code.includes('min_path_sum')) wrapperCode = generateMinPathSumWrapper(code);
    else if (code.includes('diagonal_traversal')) wrapperCode = generateDiagonalTraversalWrapper(code);
    else if (code.includes('two_sum')) wrapperCode = generateTwoSumWrapper(code);
    else if (code.includes('target_difference')) wrapperCode = generateTargetDifferenceWrapper(code);
    else wrapperCode = generateFallbackWrapper(code);
  }

  await fs.writeFile(path.join(executionDir, 'solution.py'), wrapperCode);
}

// --- Specific Wrapper Functions ---

function generateTwoSumWrapper(code) {
  return generateGenericWrapper(code, 'two_sum', 'TwoSum', ['nums', 'target'], result => {
    return 'print(f"{result[0]} {result[1]}" if result else "")';
  });
}

function generateTargetDifferenceWrapper(code) {
  return `
import sys

${code}

if __name__ == "__main__":
    line1 = sys.stdin.readline().strip()
    if not line1: sys.exit(0)
    try:
        if line1.startswith('[') and line1.endswith(']'):
            import json
            nums = json.loads(line1)
        else:
            nums = list(map(int, line1.split()))
    except: nums = []
    
    line2 = sys.stdin.readline().strip()
    k = int(line2) if line2 else 0
    
    try:
        if 'Solution' in globals():
            s = Solution()
            method = getattr(s, 'target_difference', getattr(s, 'targetDifference', None))
            result = method(nums, k) if method else target_difference(nums, k)
        else:
            result = target_difference(nums, k)
    except Exception as e:
        print(f"Runtime Error: {e}", file=sys.stderr)
        sys.exit(1)
        
    if result is None: print("")
    elif isinstance(result, str): print(result.strip())
    elif isinstance(result, (list, tuple)):
        if not result: print("")
        elif len(result) > 0 and not isinstance(result[0], (list, tuple)):
            # Flat list [i, j, i2, j2]
            print(" ".join(map(str, result)))
        else:
            try:
                # Helper to check if it's a list of pairs
                if all(isinstance(x, (list, tuple)) and len(x) >= 2 for x in result):
                    res = sorted(result, key=lambda x: (x[0], x[1]))
                    out = []
                    for p in res: out.extend([str(p[0]), str(p[1])])
                    print(" ".join(out))
                else:
                    print(" ".join(map(str, result)))
            except: print(" ".join(map(str, result)))
    else: print(str(result))
`;
}

function generateLongestCommonPrefixWrapper(code) {
  return generateGenericWrapper(code, 'longest_common_prefix', 'LongestPrefix', ['strs'], res => `print(${res} if ${res} is not None else "")`);
}

function generateMinPathSumWrapper(code) {
  return `
import sys

${code}

if __name__ == "__main__":
    line = sys.stdin.readline().split()
    if not line: sys.exit(0)
    m, n = map(int, line)
    grid = []
    for _ in range(m):
        grid.append(list(map(int, sys.stdin.readline().split())))
    
    s = Solution() if 'Solution' in globals() else None
    obj = s if s else sys.modules[__name__]
    method = getattr(obj, 'min_path_sum', getattr(obj, 'minPathSum', None))
    print(method(grid) if method else min_path_sum(grid))
`;
}

function generateDiagonalTraversalWrapper(code) {
  return `
import sys
import collections

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def build_tree(vals):
    if not vals or vals[0] == -1: return None
    root = TreeNode(vals[0])
    q = collections.deque([root])
    i = 1
    while q and i < len(vals):
        node = q.popleft()
        if i < len(vals) and vals[i] != -1:
            node.left = TreeNode(vals[i])
            q.append(node.left)
        i += 1
        if i < len(vals) and vals[i] != -1:
            node.right = TreeNode(vals[i])
            q.append(node.right)
        i += 1
    return root

${code}

if __name__ == "__main__":
    line = sys.stdin.readline().strip()
    if not line: sys.exit(0)
    vals = list(map(int, line.split()))
    root = build_tree(vals)
    
    s = Solution() if 'Solution' in globals() else (DiagonalTraversal() if 'DiagonalTraversal' in globals() else None)
    obj = s if s else sys.modules[__name__]
    method = getattr(obj, 'diagonal_traversal', getattr(obj, 'diagonalTraversal', None))
    result = method(root)
    print(result)
`;
}

function generateLISWrapper(code) {
  return generateGenericWrapper(code, 'length_of_lis', 'LengthOfLIS', ['nums'], res => `print(${res})`);
}

function generateConsecutiveCharsWrapper(code) {
  return generateGenericWrapper(code, 'count_consecutive_chars', 'CountConsecutive', ['s'], res => `print(list(${res}) if ${res} is not None else [])`);
}

function generateClosestValueWrapper(code) {
  return `
import sys

${code}

if __name__ == "__main__":
    n_line = sys.stdin.readline().strip()
    if not n_line: sys.exit(0)
    n = int(n_line)
    nums = list(map(int, sys.stdin.readline().split()))
    target = int(sys.stdin.readline().strip())
    
    s = Solution() if 'Solution' in globals() else (ClosestValueFinder() if 'ClosestValueFinder' in globals() else None)
    obj = s if s else sys.modules[__name__]
    method = getattr(obj, 'find_closest_element', getattr(obj, 'findClosestElement', None))
    print(method(nums, target))
`;
}

function generatePermutationInStringWrapper(code) {
  return `
import sys

${code}

if __name__ == "__main__":
    s1 = sys.stdin.readline().strip()
    s2 = sys.stdin.readline().strip()
    
    s = Solution() if 'Solution' in globals() else (PermutationInString() if 'PermutationInString' in globals() else None)
    obj = s if s else sys.modules[__name__]
    method = getattr(obj, 'check_inclusion', getattr(obj, 'checkInclusion', None))
    print(method(s1, s2))
`;
}

function generateFruitIntoBasketsWrapper(code) {
  return `
import sys

${code}

if __name__ == "__main__":
    n_str = sys.stdin.readline()
    nums = list(map(int, sys.stdin.readline().split()))
    
    s = Solution() if 'Solution' in globals() else (FruitIntoBaskets() if 'FruitIntoBaskets' in globals() else None)
    obj = s if s else sys.modules[__name__]
    method = getattr(obj, 'total_fruit', getattr(obj, 'totalFruit', None))
    print(method(nums))
`;
}

function generateValidAnagramWrapper(code) {
  return `
import sys

${code}

if __name__ == "__main__":
    s1 = sys.stdin.readline().strip()
    s2 = sys.stdin.readline().strip()
    
    s = Solution() if 'Solution' in globals() else (ValidAnagram() if 'ValidAnagram' in globals() else None)
    obj = s if s else sys.modules[__name__]
    method = getattr(obj, 'is_anagram', getattr(obj, 'isAnagram', None))
    print(str(method(s1, s2)).lower())
`;
}

function generateThreeSumWrapper(code) {
  return generateGenericWrapper(code, 'three_sum', 'Solution', ['nums'], res => `print(${res})`);
}

function generateReverseStringWrapper(code) {
  return generateGenericWrapper(code, 'reverse_string', 'Solution', ['s'], res => 'print("".join(s))');
}

function generateGPUOptimizerWrapper(code) {
  return generateGenericWrapper(code, 'minimum_gpu_capacity', 'Solution', ['workloads', 'k'], res => `print(${res})`);
}

function generateTrafficFlowWrapper(code) {
  return generateGenericWrapper(code, 'longest_balanced_stretch', 'TrafficFlowAnalyzer', ['traffic_density'], res => `print(${res})`);
}

function generateLargestElementWrapper(code) {
  return generateGenericWrapper(code, 'find_largest', 'Solution', ['nums'], res => `print(${res})`);
}

function generateFindActivityRangeWrapper(code) {
  return generateGenericWrapper(code, 'find_activity_range', 'Solution', ['activities'], res => `print(${res})`);
}

function generateSecondSmallestLargestWrapper(code) {
  return generateGenericWrapper(code, 'find_second_smallest_largest', 'Solution', ['nums'], res => `print(f"Second Smallest : {${res}[0]}\\nSecond Largest : {${res}[1]}" if ${res} and len(${res}) == 2 else "Second Smallest : -1\\nSecond Largest : -1")`);
}

function generateRemoveNthFromEndWrapper(code) {
  return `
import sys

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def build_list(vals):
    if not vals: return None
    head = ListNode(vals[0])
    curr = head
    for v in vals[1:]:
        curr.next = ListNode(v)
        curr = curr.next
    return head

def list_to_vals(head):
    res = []
    while head:
        res.append(str(head.val))
        head = head.next
    return " ".join(res)

${code}

if __name__ == "__main__":
    line1 = sys.stdin.readline().strip()
    if not line1: sys.exit(0)
    vals = list(map(int, line1.split()))
    line2 = sys.stdin.readline().strip()
    n = int(line2) if line2 else 0
    head = build_list(vals)
    
    s = Solution() if 'Solution' in globals() else None
    obj = s if s else sys.modules[__name__]
    method = getattr(obj, 'removeNthFromEnd', getattr(obj, 'remove_nth_from_end', None))
    result = method(head, n)
    print(list_to_vals(result))
`;
}

function generateFallbackWrapper(code) {
  return `
import sys
import json

${code}

if __name__ == "__main__":
    input_data = sys.stdin.readline().strip()
    if not input_data: sys.exit(0)
    
    try:
        args = json.loads(input_data)
    except:
        args = input_data
        
    if 'Solution' in globals():
        s = Solution()
        methods = [m for m in dir(s) if not m.startswith('__')]
        if methods:
            res = getattr(s, methods[0])(args)
            print(res)
    else:
        import types
        funcs = [f for f in globals().values() if isinstance(f, types.FunctionType)]
        if funcs:
            print(funcs[0](args))
`;
}

function generateGenericWrapper(code, funcName, className, argNames, outputLogic) {
  const inputReading = argNames.map((arg, idx) => {
    if (idx === 0) return `    line1 = sys.stdin.readline().strip()\n    if not line1: sys.exit(0)\n    try: ${arg} = list(map(int, line1.split()))\n    except: ${arg} = line1`;
    return `    line${idx + 1} = sys.stdin.readline().strip()\n    try: ${arg} = int(line${idx + 1})\n    except: ${arg} = line${idx + 1}`;
  }).join('\n');

  return `
import sys

${code}

if __name__ == "__main__":
${inputReading}
    
    s = None
    if '${className}' in globals(): s = ${className}()
    elif 'Solution' in globals(): s = Solution()
    
    obj = s if s else sys.modules[__name__]
    method = getattr(obj, '${funcName}', getattr(obj, '${funcName.replace(/_([a-z])/g, (m, c) => c.toUpperCase())}', None))
    
    try:
        if method:
            result = method(${argNames.join(', ')})
            ${outputLogic('result')}
        else:
            # Fallback to direct function call
            func = globals().get('${funcName}') or globals().get('${funcName.replace(/_([a-z])/g, (m, c) => c.toUpperCase())}')
            if func:
                result = func(${argNames.join(', ')})
                ${outputLogic('result')}
            else:
                print("Error: Function not found", file=sys.stderr)
                sys.exit(1)
    except Exception as e:
        print(f"Runtime Error: {e}", file=sys.stderr)
        sys.exit(1)
`;
}

module.exports = {
  generatePythonWrapper
};

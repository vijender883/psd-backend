// services/pythonWrapper.js
const fs = require("fs").promises;
const path = require("path");

async function generatePythonWrapper(executionDir, code) {
  const isMinPathSum = code.includes("min_path_sum");
  const isDiagonalTraversal = code.includes("diagonal_traversal");
  const isLIS = code.includes("length_of_lis");
  const isConsecutiveChars = code.includes("count_consecutive_chars");
  const isClosestValue = code.includes("find_closest_element");
  const isPermutationInString = code.includes("check_inclusion");
  const isFruitIntoBaskets = code.includes("total_fruit");
  const isValidAnagram = code.includes("is_anagram");
  const isThreeSum = code.includes("three_sum");
  const isReverseString = code.includes("reverse_string");
  const isTwoSum = code.includes("two_sum");
  const isGPUOptimizer = code.includes("minimum_gpu_capacity");
  const isTrafficFlow = code.includes("longest_balanced_stretch");
  const isFindActivityRange = code.includes("find_activity_range");
  const isRemoveNthFromEnd = code.includes("removeNthFromEnd");

  let wrapperCode;
  if (isMinPathSum) {
    wrapperCode = generateMinPathSumWrapper(code);
  } else if (isDiagonalTraversal) {
    wrapperCode = generateDiagonalTraversalWrapper(code);
  } else if (isLIS) {
    wrapperCode = generateLISWrapper(code);
  } else if (isConsecutiveChars) {
    wrapperCode = generateConsecutiveCharsWrapper(code);
  } else if (isClosestValue) {
    wrapperCode = generateClosestValueWrapper(code);
  } else if (isPermutationInString) {
    wrapperCode = generatePermutationInStringWrapper(code);
  } else if (isFruitIntoBaskets) {
    wrapperCode = generateFruitIntoBasketsWrapper(code);
  } else if (isValidAnagram) {
    wrapperCode = generateValidAnagramWrapper(code);
  } else if (isThreeSum) {
    wrapperCode = generateThreeSumWrapper(code);
  } else if (isReverseString) {
    wrapperCode = generateReverseStringWrapper(code);
  } else if (isTwoSum) {
    wrapperCode = generateTwoSumWrapper(code);
  } else if (isGPUOptimizer) {
    wrapperCode = generateGPUOptimizerWrapper(code);
  } else if (isTrafficFlow) {
    wrapperCode = generateTrafficFlowWrapper(code);
  } else if (isFindActivityRange) {
    wrapperCode = generateFindActivityRangeWrapper(code);
  } else if (isRemoveNthFromEnd) {
    wrapperCode = generateRemoveNthFromEndWrapper(code);
  } else {
    wrapperCode = generateLongestCommonPrefixWrapper(code);
  }

  await fs.writeFile(path.join(executionDir, "solution.py"), wrapperCode);
}

function generateRemoveNthFromEndWrapper(code) {
  return `
import sys

# Definition for singly-linked list
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

${code}

def build_linked_list(values):
    """Build linked list from array of values"""
    if not values:
        return None
    
    dummy = ListNode(0)
    current = dummy
    
    for val in values:
        current.next = ListNode(val)
        current = current.next
    
    return dummy.next

def linked_list_to_array(head):
    """Convert linked list to array"""
    result = []
    current = head
    
    while current is not None:
        result.append(current.val)
        current = current.next
    
    return result

if __name__ == "__main__":
    # Read input
    values = list(map(int, input().strip().split()))
    n = int(input().strip())
    
    # Build linked list
    head = build_linked_list(values)
    
    # Create solution object and call function
    solver = Solution()
    result = solver.removeNthFromEnd(head, n)
    
    # Convert result to array and output
    result_array = linked_list_to_array(result)
    if result_array:
        print(' '.join(map(str, result_array)))
    else:
        print('')
`;
}

function generateFindActivityRangeWrapper(code) {
  return `
import sys

${code}

if __name__ == "__main__":
    # Read input
    line = input().strip().split()
    activity_log = list(map(int, line[:-1]))
    target_time = int(line[-1])
    
    # Create solution object and call function
    solver = FindActivityRange()
    result = solver.find_activity_range(activity_log, target_time)
    
    # Output result
    print(f"[{result[0]},{result[1]}]")
`;
}

function generateGPUOptimizerWrapper(code) {
  return `
import sys

${code}

if __name__ == "__main__":
    # Read input
    gpu_memory = list(map(int, input().strip().split()))
    model_requirements = list(map(int, input().strip().split()))
    k = int(input().strip())
    
    # Create solution object and call function
    solver = GPUResourceOptimizer()
    result = solver.minimum_gpu_capacity(gpu_memory, model_requirements, k)
    
    # Output result
    print(result)
`;
}

function generateTrafficFlowWrapper(code) {
  return `
import sys

${code}

if __name__ == "__main__":
    # Read input
    traffic_density = list(map(int, input().strip().split()))
    
    # Create solution object and call function
    solver = TrafficFlowAnalyzer()
    result = solver.longest_balanced_stretch(traffic_density)
    
    # Output result
    print(result)
`;
}

// Add new wrapper generator for Reverse String
function generateReverseStringWrapper(code) {
  return `
import sys

${code}

if __name__ == "__main__":
    # Read input
    chars = input().strip().split()
    
    # Create solution object and call function
    solver = ReverseString()
    solver.reverse_string(chars)
    
    # Output result (space-separated characters)
    print(' '.join(chars))
`;
}

// Add new wrapper generator for Two Sum
function generateTwoSumWrapper(code) {
  return `
import sys

${code}

if __name__ == "__main__":
    # Read input
    nums = list(map(int, input().strip().split()))
    target = int(input().strip())
    
    # Create solution object and call function
    solver = TwoSum()
    result = solver.two_sum(nums, target)
    
    # Output result
    print(f"[{result[0]},{result[1]}]")
`;
}

// Add new wrapper generator for 3Sum
function generateThreeSumWrapper(code) {
  return `
import sys

${code}

def format_result(result):
    if not result:
        return "[]"
    
    # Sort each triplet and the overall result for consistent output
    result = [sorted(triplet) for triplet in result]
    result.sort()
    
    formatted = "["
    for i, triplet in enumerate(result):
        formatted += "["
        formatted += ",".join(str(num) for num in triplet)
        formatted += "]"
        if i < len(result) - 1:
            formatted += ","
    formatted += "]"
    
    return formatted

if __name__ == "__main__":
  # Read input
  nums = list(map(int, input().strip().split()))
  
  # Create solution object and call function
  solver = ThreeSum()
  result = solver.three_sum(nums)
  
  # Output result
  print(format_result(result))
`;
}

// Add new wrapper generator for Valid Anagram
function generateValidAnagramWrapper(code) {
  return `
import sys

${code}

if __name__ == "__main__":
  # Read input
  s = input().strip()
  t = input().strip()
  
  # Create solution object and call function
  solver = ValidAnagram()
  result = solver.is_anagram(s, t)
  
  # Output result
  print(str(result).lower())
`;
}

// Add new wrapper generator for Permutation in String
function generatePermutationInStringWrapper(code) {
  return `
import sys

${code}

if __name__ == "__main__":
  # Read input
  s1 = input().strip()
  s2 = input().strip()
  
  # Create solution object and call function
  solver = PermutationInString()
  result = solver.check_inclusion(s1, s2)
  
  # Output result
  print(str(result).lower())
`;
}

// Add new wrapper generator for Fruit Into Baskets
function generateFruitIntoBasketsWrapper(code) {
  return `
import sys

${code}

if __name__ == "__main__":
  # Read input
  n = int(input().strip())
  fruits = list(map(int, input().strip().split()))
  
  # Create solution object and call function
  solver = FruitIntoBaskets()
  result = solver.total_fruit(fruits)
  
  # Output result
  print(result)
`;
}

function generateClosestValueWrapper(code) {
  return `
import sys

${code}

if __name__ == "__main__":
    # Read input
    n = int(input().strip())
    nums = list(map(int, input().strip().split()))
    target = int(input().strip())
    
    # Create solution object and call function
    solver = ClosestValueFinder()
    result = solver.find_closest_element(nums, target)
    
    # Output result
    print(result)
`;
}

function generateConsecutiveCharsWrapper(code) {
  return `
import sys

${code}

if __name__ == "__main__":
    # Read input
    s = input().strip()
    
    # Create solution object and call function
    solver = CountConsecutive()
    result = solver.count_consecutive_chars(s)
    
    # Output result
    print(result)
`;
}

function generateDiagonalTraversalWrapper(code) {
  return `
import sys

# Definition for a binary tree node
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

${code}

def build_tree(values):
    if not values or values[0] == "-1":
        return None
    
    root = TreeNode(int(values[0]))
    queue = [root]
    i = 1
    
    while queue and i < len(values):
        node = queue.pop(0)
        
        # Left child
        if i < len(values) and values[i] != "-1":
            node.left = TreeNode(int(values[i]))
            queue.append(node.left)
        i += 1
        
        # Right child
        if i < len(values) and values[i] != "-1":
            node.right = TreeNode(int(values[i]))
            queue.append(node.right)
        i += 1
    
    return root

def format_result(result):
    if not result:
        return "[]"
    
    formatted = "["
    for i, diagonal in enumerate(result):
        formatted += "["
        formatted += ",".join(str(val) for val in diagonal)
        formatted += "]"
        if i < len(result) - 1:
            formatted += ","
    formatted += "]"
    
    return formatted

if __name__ == "__main__":
    # Read input
    values = input().strip().split()
    
    # Build tree
    root = build_tree(values)
    
    # Create solution object and call function
    solver = DiagonalTraversal()
    result = solver.diagonal_traversal(root)
    
    # Output result
    print(format_result(result))
`;
}

function generateLISWrapper(code) {
  return `
import sys

${code}

if __name__ == "__main__":
    # Read input
    n = int(input().strip())
    nums = list(map(int, input().strip().split()))
    
    # Create solution object and call function
    solver = LengthOfLIS()
    result = solver.length_of_lis(nums)
    
    # Output result
    print(result)
`;
}

function generateMinPathSumWrapper(code) {
  return `
import sys

${code}

if __name__ == "__main__":
    # Read dimensions
    m, n = map(int, input().strip().split())
    
    # Read grid
    grid = []
    for _ in range(m):
        row = list(map(int, input().strip().split()))
        grid.append(row)
    
    # Create solution object and call function
    solver = MinPathSum()
    result = solver.min_path_sum(grid)
    
    # Output result
    print(result)
`;
}

function generateLongestCommonPrefixWrapper(code) {
  return `
import sys

${code}

if __name__ == "__main__":
    # Read input strings
    strs = input().strip().split()
    
    # Create solution object and call function
    solver = LongestCommonPrefix()
    result = solver.longest_common_prefix(strs)
    
    # Output result
    print(result)
`;
}

module.exports = {
  generatePythonWrapper,
};

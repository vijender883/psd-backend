// services/pythonWrapper.js
const fs = require('fs').promises;
const path = require('path');

async function generatePythonWrapper(executionDir, code) {
  const isMinPathSum = code.includes('min_path_sum');
  const isDiagonalTraversal = code.includes('diagonal_traversal');
  const isLIS = code.includes('length_of_lis');
  const isConsecutiveChars = code.includes('count_consecutive_chars');
  const isClosestValue = code.includes('find_closest_element');
  const isPermutationInString = code.includes('check_inclusion'); // Add this
  const isFruitIntoBaskets = code.includes('total_fruit'); // Add this


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
  } else {
    wrapperCode = generateLongestCommonPrefixWrapper(code);
  }

  await fs.writeFile(path.join(executionDir, 'solution.py'), wrapperCode);
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
`
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
`
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
`
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
`
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
`
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
`
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
`
}

function generateLongestCommonPrefixWrapper(code) {
  return `
import sys

${code}

if __name__ == "__main__":
    # Read input strings
    strs = input().strip().split()
    
    # Create solution object and call function
    solver = LongestPrefix()
    result = solver.longest_common_prefix(strs)
    
    # Output result
    print(result)
`
}

module.exports = {
  generatePythonWrapper
};
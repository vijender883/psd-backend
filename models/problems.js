// models/problems.js
const problems = {
  'twosum': {
    id: "twosum",
    title: "Two Sum",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the *same* element twice.\n\nYou can return the answer in any order.",
    inputFormat: "The first line contains space-separated integers representing the array `nums`.\nThe second line contains a single integer `target`.",
    outputFormat: "Return the indices of the two numbers as space-separated integers.",
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ],
    examples: [
      {
        name: "Example 1",
        input: "2 7 11 15\n9",
        output: "0 1"
      },
      {
        name: "Example 2",
        input: "3 2 4\n6",
        output: "1 2"
      },
      {
        name: "Example 3",
        input: "3 3\n6",
        output: "0 1"
      }
    ],
    miscellaneous: {
      name: "Follow-up",
      description: "Can you come up with an algorithm that is less than O(n²) time complexity?"
    },
    templates: {
      java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n    }\n}",
      python: "class Solution:\n    def two_sum(self, nums, target):\n        # Write your code here\n        pass"
    },
    solution: `class Solution:
    def two_sum(self, nums, target):
        prevMap = {}  # val : index
        
        for i, n in enumerate(nums):
            diff = target - n
            if diff in prevMap:
                return [prevMap[diff], i]
            prevMap[n] = i
        return []`,
    testCases: [
      {
        input: "2 7 11 15\n9",
        expectedOutput: "0 1",
        description: "Basic case"
      },
      {
        input: "3 2 4\n6",
        expectedOutput: "1 2",
        description: "Not sorted array"
      },
      {
        input: "3 3\n6",
        expectedOutput: "0 1",
        description: "Same elements"
      },
      {
        input: "-1 -2 -3 -4 -5\n-8",
        expectedOutput: "2 4",
        description: "Negative numbers"
      }
    ]
  },
  'traffic_flow_analysis': {
    id: "traffic_flow_analysis",
    title: "Smart City Traffic Flow Analysis",
    description: "You're working as a data scientist for a smart city project. The city has installed sensors along a main road that measure traffic density at different points. The sensors return values representing the 'congestion level' at each point (higher values = more congested).\n\nYour task is to find the longest continuous stretch of road where the traffic flow is 'balanced' - meaning the total congestion on the left half equals the total congestion on the right half.\n\nNote: Only consider subarrays with even length (so they can be split into equal halves).",
    inputFormat: "A single line containing space-separated integers representing the traffic_density array.",
    outputFormat: "Return the length of the longest balanced stretch. Return 0 if no balanced stretch exists.",
    constraints: [
      "2 <= len(traffic_density) <= 1000",
      "traffic_density length is always even",
      "1 <= traffic_density[i] <= 100",
      "All values are positive integers",
      "Time complexity should be O(n²) or better",
      "Space complexity should be O(1)"
    ],
    examples: [
      {
        name: "Example 1",
        input: "traffic_density = [3,1,4,2,2,1,3,1]",
        output: "4"
      },
      {
        name: "Example 2",
        input: "traffic_density = [5,1,1,5]",
        output: "4"
      },
      {
        name: "Example 3",
        input: "traffic_density = [1,3,2,4]",
        output: "0"
      }
    ],
    miscellaneous: {
      name: "Hint",
      description: "Use two pointers to define the boundaries of subarrays and efficiently calculate the sums of left and right halves. Consider a nested loop approach where you fix one boundary and extend the other."
    },
    templates: {
      java: "import java.util.*;\n\nclass TrafficFlowAnalyzer {\n    public int longestBalancedStretch(int[] trafficDensity) {\n        // Write your code here\n        int n = trafficDensity.length;\n        int maxLength = 0;\n        \n        return maxLength;\n    }\n}",
      python: "class TrafficFlowAnalyzer:\n    def longest_balanced_stretch(self, traffic_density):\n        \"\"\"\n        Find the longest continuous stretch where left half sum equals right half sum.\n        \n        Args:\n            traffic_density: List[int] - congestion levels at each road segment\n            \n        Returns:\n            int - length of longest balanced stretch, 0 if none exists\n        \"\"\"\n        # Write your code here\n        n = len(traffic_density)\n        max_length = 0\n        \n        return max_length"
    },
    solution: `class TrafficFlowAnalyzer:
    def longest_balanced_stretch(self, traffic_density):
        n = len(traffic_density)
        max_length = 0
        
        # Check all possible even-length subarrays
        for i in range(n):
            for j in range(i + 1, n, 2):  # Ensure even length
                length = j - i + 1
                mid = i + length // 2
                
                left_sum = sum(traffic_density[i:mid])
                right_sum = sum(traffic_density[mid:j+1])
                
                if left_sum == right_sum:
                    max_length = max(max_length, length)
        
        return max_length`,
    testCases: [
      {
        input: "3 1 4 2 2 1 3 1",
        expectedOutput: "4",
        description: "Basic case with balanced subarray [2,2,1,3]"
      },
      {
        input: "5 1 1 5",
        expectedOutput: "4",
        description: "Entire array is balanced"
      },
      {
        input: "1 3 2 4",
        expectedOutput: "0",
        description: "No balanced subarray exists"
      },
      {
        input: "7 7",
        expectedOutput: "2",
        description: "Minimum length array that is balanced"
      },
      {
        input: "5 5 5 5 5 5",
        expectedOutput: "6",
        description: "All same values - entire array balanced"
      },
      {
        input: "2 4 4 2",
        expectedOutput: "4",
        description: "Symmetric array"
      },
      {
        input: "1 1 2 2 3 3",
        expectedOutput: "2",
        description: "Multiple small balanced subarrays [3,3]"
      },
      {
        input: "10 20 30 40",
        expectedOutput: "0",
        description: "Increasing sequence with no balance"
      },
      {
        input: "1 9 9 1 5 5",
        expectedOutput: "4",
        description: "Two balanced subarrays, return longest [1,9,9,1]"
      },
      {
        input: "8 2 6 4",
        expectedOutput: "4",
        description: "Check if [8,2,6,4] is balanced: left=[8,2]=10, right=[6,4]=10"
      }
    ]
  },
  'deletenthfromend': {
    id: "deletenthfromend",
    title: "Remove Nth Node From End of List",
    description: "Given the head of a linked list, remove the nth node from the end of the list and return its head.\n\nFor example, given the linked list: 1 -> 2 -> 3 -> 4 -> 5, and n = 2, the result should be: 1 -> 2 -> 3 -> 5 (the 4th node from the end, which is 4, is removed).",
    inputFormat: "The first line contains space-separated integers representing the linked list nodes.\nThe second line contains a single integer n representing the position from the end.",
    outputFormat: "Return the modified linked list as space-separated integers.",
    constraints: [
      "The number of nodes in the list is sz",
      "1 <= sz <= 30",
      "0 <= Node.val <= 100",
      "1 <= n <= sz"
    ],
    examples: [
      {
        name: "Example 1",
        input: "1 2 3 4 5\n2",
        output: "1 2 3 5"
      },
      {
        name: "Example 2",
        input: "1\n1",
        output: "need to clear later"
      },
      {
        name: "Example 3",
        input: "1 2\n1",
        output: "1"
      }
    ],
    miscellaneous: {
      name: "Follow-up",
      description: "Could you solve this in one pass using the two-pointer technique?"
    },
    templates: {
      javascript: `/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
function removeNthFromEnd(head, n) {
  // Your code here
}`,
      python: `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next

class Solution:
    def removeNthFromEnd(self, head, n):
        # Write your code here
        pass`,
      apex: `/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     public Integer val;
 *     public ListNode next;
 *     public ListNode(Integer val) { this.val = val; }
 *     public ListNode(Integer val, ListNode next) { this.val = val; this.next = next; }
 * }
 */
public class Solution {
    public ListNode removeNthFromEnd(ListNode head, Integer n) {
        // Write your code here
    }
}`
    },
    solution: `function removeNthFromEnd(head, n) {
  // Create a dummy node to handle edge cases
  const dummy = new ListNode(0);
  dummy.next = head;
  
  let first = dummy;
  let second = dummy;
  
  // Move first pointer n+1 steps ahead
  for (let i = 0; i <= n; i++) {
    first = first.next;
  }
  
  // Move both pointers until first reaches the end
  while (first !== null) {
    first = first.next;
    second = second.next;
  }
  
  // Remove the nth node from end
  second.next = second.next.next;
  
  return dummy.next;
}`,
    testCases: [
      {
        input: "1 2 3 4 5\n2",
        expectedOutput: "1 2 3 5",
        description: "Remove 2nd node from end"
      },
      {
        input: "1\n1",
        expectedOutput: "need to clear later",
        description: "Remove only node"
      },
      {
        input: "1 2\n1",
        expectedOutput: "1",
        description: "Remove last node"
      },
      {
        input: "1 2\n2",
        expectedOutput: "2",
        description: "Remove first node in two-node list"
      },
      {
        input: "1 2 3 4 5\n5",
        expectedOutput: "2 3 4 5",
        description: "Remove first node from longer list"
      },
      {
        input: "1 2 3 4 5\n1",
        expectedOutput: "1 2 3 4",
        description: "Remove last node from longer list"
      },
      {
        input: "1 2 3\n2",
        expectedOutput: "1 3",
        description: "Remove middle node"
      }
    ]
  },
  'arraychunk': {
    id: 'arraychunk',
    title: 'Array Chunk',
    description: 'Given an array and a chunk size, divide the array into multiple subarrays where each subarray has a length equal to the chunk size. The last chunk may contain fewer elements if the array length is not evenly divisible by the chunk size.',
    inputFormat: 'First line: JSON array of numbers\nSecond line: Integer representing chunk size',
    outputFormat: 'Return a 2D array where each inner array is a chunk',
    constraints: [
      '1 <= array.length <= 1000',
      '1 <= size <= array.length',
      'Array contains integers only'
    ],
    examples: [
      {
        name: 'Example 1',
        input: '[1, 2, 3, 4, 5]\n2',
        output: '[[1,2],[3,4],[5]]'
      },
      {
        name: 'Example 2',
        input: '[1, 2, 3, 4, 5, 6, 7, 8]\n3',
        output: '[[1,2,3],[4,5,6],[7,8]]'
      }
    ],
    miscellaneous: {
      name: 'Follow-up',
      description: 'Can you solve this without using any built-in array methods like slice()?'
    },
    templates: {
      java: 'N/A',
      python: 'N/A',
      javascript: `function chunk(array, size) {
  // Your code here
}`
    },
    solution: `function chunk(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}`,
    testCases: [
      {
        input: '[1, 2, 3, 4, 5]\n2',
        expectedOutput: '[[1,2],[3,4],[5]]',
        description: 'Basic chunking with remainder'
      },
      {
        input: '[1, 2, 3, 4, 5, 6, 7, 8]\n3',
        expectedOutput: '[[1,2,3],[4,5,6],[7,8]]',
        description: 'Chunking with last incomplete chunk'
      },
      {
        input: '[1, 2, 3, 4]\n4',
        expectedOutput: '[[1,2,3,4]]',
        description: 'Chunk size equals array length'
      },
      {
        input: '[1, 2, 3, 4, 5, 6]\n2',
        expectedOutput: '[[1,2],[3,4],[5,6]]',
        description: 'Perfect division'
      },
      {
        input: '[1]\n1',
        expectedOutput: '[[1]]',
        description: 'Single element'
      },
      {
        input: '[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]\n5',
        expectedOutput: '[[1,2,3,4,5],[6,7,8,9,10]]',
        description: 'Even split'
      }
    ]
  },
  'flattenobject': {
    id: 'flattenobject',
    title: 'Flatten Nested Object',
    description: 'Given a nested JavaScript object, flatten it into a single level object where keys represent the path to each value using dot notation. For example, {a: {b: {c: 1}}} becomes {"a.b.c": 1}.',
    inputFormat: 'JSON object (can be nested with multiple levels)',
    outputFormat: 'Flattened object with dot-notation keys',
    constraints: [
      'Object depth can be up to 10 levels',
      'Keys are strings containing only alphanumeric characters',
      'Values are primitives (numbers, strings, booleans, null)',
      'No arrays in the object',
      'No circular references'
    ],
    examples: [
      {
        name: 'Example 1',
        input: '{"a": 1, "b": {"c": 2}}',
        output: '{"a":1,"b.c":2}'
      },
      {
        name: 'Example 2',
        input: '{"x": {"y": {"z": 3}}}',
        output: '{"x.y.z":3}'
      }
    ],
    miscellaneous: {
      name: 'Follow-up',
      description: 'Can you also implement the reverse operation - unflatten a flattened object back to nested structure?'
    },
    templates: {
      java: 'N/A',
      python: 'N/A',
      javascript: `function flattenObject(obj) {
  // Your code here
}`
    },
    solution: `function flattenObject(obj, prefix = '', result = {}) {
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? \`\${prefix}.\${key}\` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        flattenObject(obj[key], newKey, result);
      } else {
        result[newKey] = obj[key];
      }
    }
  }
  return result;
}`,
    testCases: [
      {
        input: '{"a": 1, "b": {"c": 2}}',
        expectedOutput: '{"a":1,"b.c":2}',
        description: 'Simple nested object'
      },
      {
        input: '{"x": {"y": {"z": 3}}}',
        expectedOutput: '{"x.y.z":3}',
        description: 'Deep nesting'
      },
      {
        input: '{"name": "John", "age": 30}',
        expectedOutput: '{"name":"John","age":30}',
        description: 'Flat object (no nesting)'
      },
      {
        input: '{"user": {"name": "Alice", "address": {"city": "NYC", "zip": "10001"}}}',
        expectedOutput: '{"user.name":"Alice","user.address.city":"NYC","user.address.zip":"10001"}',
        description: 'Multiple nested levels'
      },
      {
        input: '{"a": null, "b": {"c": false, "d": 0}}',
        expectedOutput: '{"a":null,"b.c":false,"b.d":0}',
        description: 'Null, boolean, and zero values'
      },
      {
        input: '{"level1": {"level2": {"level3": {"level4": {"value": 42}}}}}',
        expectedOutput: '{"level1.level2.level3.level4.value":42}',
        description: 'Very deep nesting'
      }
    ]
  },
  'diagonaltraversal': {
    id: 'diagonaltraversal',
    title: 'Binary Tree Diagonal Traversal',
    description: `Given the root of a binary tree, return the diagonal traversal of its nodes' values. A diagonal path consists of nodes that can be reached by following only the right child pointers. When you can't go right anymore, you move to the leftmost node of the next diagonal path.

<div style="text-align: center; margin: 20px 0;">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 650 450">
        <!-- Background for better visibility -->
    <rect width="500" height="400" fill="#ffffff"/>
    
    <!-- Tree edges -->
    <g stroke="#666" stroke-width="2">
        <!-- Level 1 edges -->
        <path d="M250,50 L150,120" />
        <path d="M250,50 L350,120" />
        <!-- Level 2 edges -->
        <path d="M150,120 L100,190" />
        <path d="M150,120 L200,190" />
        <path d="M350,120 L450,190" />
        <!-- Level 3 edge -->
        <path d="M200,190 L175,260" />
        <path d="M450,190 L500,260" />
    </g>

    <!-- Diagonal path highlights -->
    <!-- First diagonal path: 1->3->6->8 -->
    <path d="M250,50 L350,120 L450,190 L500,260" 
          stroke="#4CAF50" stroke-width="4" fill="none" 
          stroke-dasharray="5,5"/>
        <!-- Second diagonal path: 2->5 -->
    <path d="M150,120 L200,190" 
          stroke="#2196F3" stroke-width="4" fill="none"
          stroke-dasharray="5,5"/>
    <!-- Third diagonal path: 4 -->
    <path d="M100,190 L100,190" 
          stroke="#FFC107" stroke-width="4" fill="none"
          stroke-dasharray="5,5"/>
    <!-- Fourth diagonal path: 7 -->
    <path d="M175,260 L175,260" 
          stroke="#9C27B0" stroke-width="4" fill="none"
          stroke-dasharray="5,5"/>

    <!-- Tree nodes -->
    <g>
        <!-- Level 1 -->
        <circle cx="250" cy="50" r="20" fill="white" stroke="#333" stroke-width="2"/>
        <text x="250" y="55" text-anchor="middle" font-family="Arial" font-size="16">1</text>

        <!-- Level 2 -->
        <circle cx="150" cy="120" r="20" fill="white" stroke="#333" stroke-width="2"/>
        <text x="150" y="125" text-anchor="middle" font-family="Arial" font-size="16">2</text>
        
        <circle cx="350" cy="120" r="20" fill="white" stroke="#333" stroke-width="2"/>
        <text x="350" y="125" text-anchor="middle" font-family="Arial" font-size="16">3</text>
        
        <!-- Level 3 -->
        <circle cx="100" cy="190" r="20" fill="white" stroke="#333" stroke-width="2"/>
        <text x="100" y="195" text-anchor="middle" font-family="Arial" font-size="16">4</text>
        
        <circle cx="200" cy="190" r="20" fill="white" stroke="#333" stroke-width="2"/>
        <text x="200" y="195" text-anchor="middle" font-family="Arial" font-size="16">5</text>
        
        <circle cx="450" cy="190" r="20" fill="white" stroke="#333" stroke-width="2"/>
        <text x="450" y="195" text-anchor="middle" font-family="Arial" font-size="16">6</text>

            <!-- Level 4 -->
        <circle cx="175" cy="260" r="20" fill="white" stroke="#333" stroke-width="2"/>
        <text x="175" y="265" text-anchor="middle" font-family="Arial" font-size="16">7</text>
        
        <circle cx="500" cy="260" r="20" fill="white" stroke="#333" stroke-width="2"/>
        <text x="500" y="265" text-anchor="middle" font-family="Arial" font-size="16">8</text>
    </g>

    <!-- Legend -->
    <g transform="translate(20, 320)">
        <rect width="460" height="60" fill="#f8f9fa" rx="5"/>
        <text x="10" y="20" font-family="Arial" font-size="14" fill="#333">Diagonal Paths:</text>
        <g transform="translate(10, 35)">
            <line x1="0" y1="0" x2="20" y2="0" stroke="#4CAF50" stroke-width="3" stroke-dasharray="5,5"/>
            <text x="30" y="5" font-family="Arial" font-size="12">Path 1: 1→3→6→8</text>
            
            <line x1="150" y1="0" x2="170" y2="0" stroke="#2196F3" stroke-width="3" stroke-dasharray="5,5"/>
            <text x="180" y="5" font-family="Arial" font-size="12">Path 2: 2→5</text>
            
            <line x1="270" y1="0" x2="290" y2="0" stroke="#FFC107" stroke-width="3" stroke-dasharray="5,5"/>
            <text x="300" y="5" font-family="Arial" font-size="12">Path 3: 4</text>
            
            <line x1="370" y1="0" x2="390" y2="0" stroke="#9C27B0" stroke-width="3" stroke-dasharray="5,5"/>
            <text x="400" y="5" font-family="Arial" font-size="12">Path 4: 7</text>
        </g>
    </g>
  </svg>
</div>

In the above tree:
- Diagonal 1 (green): 1 → 3 → 6 → 8
- Diagonal 2 (blue): 2 → 5
- Diagonal 3 (yellow): 4
- Diagonal 4 (purple): 7

The output should be: [[1,3,6,8], [2,5], [4], [7]]`,
    inputFormat: 'The input is provided as a series of space-separated integers representing the tree in level-order format. Use -1 to represent null nodes.',
    outputFormat: 'Return a list of lists where each inner list represents nodes in a diagonal path from left to right.',
    constraints: [
      'The number of nodes in the tree is in the range [0, 104]',
      '-100 <= Node.val <= 100'
    ],
    examples: [
      {
        name: 'Example 1',
        input: '1 2 3 4 5 -1 6',
        output: '[[1,3,6],[2,5],[4]]'
      },
      {
        name: 'Example 2',
        input: '1 2 3 4 5 -1 6 -1 -1 -1 7 -1 8',
        output: '[[1,3,6,8],[2,5],[4],[7]]'
      }
    ],
    miscellaneous: {
      name: 'Follow-up',
      description: 'Can you solve this problem using an iterative approach with a queue instead of recursion?'
    },
    templates: {
      java: 'class DiagonalTraversal {\n    public List<List<Integer>> diagonalTraversal(TreeNode root) {\n        // Write your code here\n    }\n}',
      python: 'class DiagonalTraversal:\n    def diagonal_traversal(self, root):\n        # Write your code here\n        pass'
    },
    solution: '// Your diagonal traversal solution here',
    testCases: [
      {
        input: '1 2 3 4 5 -1 6',
        expectedOutput: '[[1,3,6],[2,5],[4]]',
        description: 'Example test case'
      },
      {
        input: '3 9 20 -1 -1 15 7',
        expectedOutput: '[[3,20,7],[9,15]]',
        description: 'Test case with balanced tree'
      }
    ]
  },

  'longestincreasing': {
    id: 'longestincreasing',
    title: 'Longest Increasing Subsequence',
    description: 'Given an integer array nums, return the length of the longest strictly increasing subsequence.\n\nA subsequence is a sequence that can be derived from an array by deleting some or no elements without changing the order of the remaining elements.',
    inputFormat: 'The first line contains an integer n denoting the size of the array.\nThe second line contains n space-separated integers denoting the elements of the array.',
    outputFormat: 'Return an integer representing the length of the longest strictly increasing subsequence.',
    constraints: [
      '1 <= nums.length <= 2500',
      '-104 <= nums[i] <= 104'
    ],
    examples: [
      {
        name: 'Example 1',
        input: '8\n10 9 2 5 3 7 101 18',
        output: '4'
      },
      {
        name: 'Example 2',
        input: '4\n0 1 0 3 2 3',
        output: '4'
      }
    ],
    miscellaneous: {
      name: 'Follow-up',
      description: 'Can you solve this problem in O(n log n) time complexity using binary search?'
    },
    templates: {
      java: 'class LengthOfLIS {\n    public int lengthOfLIS(int[] nums) {\n        // Write your code here\n    }\n}',
      python: 'class LengthOfLIS:\n    def length_of_lis(self, nums):\n        # Write your code here\n        pass'
    },
    solution: '// Your LIS solution here',
    testCases: [
      {
        input: '8\n10 9 2 5 3 7 101 18',
        expectedOutput: '4',
        description: 'Example test case'
      },
      {
        input: '6\n0 1 0 3 2 3',
        expectedOutput: '4',
        description: 'Test case with duplicates'
      },
      {
        input: '7\n7 7 7 7 7 7 7',
        expectedOutput: '1',
        description: 'Test case with all same numbers'
      }
    ]
  },

  'countconsecutive': {
    id: 'countconsecutive',
    title: 'Count Consecutive Characters',
    description: 'Given a string `s` consisting of lowercase English letters, return an array of integers representing the count of consecutive occurrences of each character in the order they appear.',
    inputFormat: 'A single line containing a string of lowercase English letters.',
    outputFormat: 'Return an array of integers where each integer represents the count of consecutive occurrences of a character.',
    constraints: [
      '1 <= s.length <= 10^5',
      's consists of lowercase English letters'
    ],
    examples: [
      {
        name: 'Example 1',
        input: 'aabbb',
        output: '[2, 3]'
      },
      {
        name: 'Example 2',
        input: 'abbcccdddd',
        output: '[1, 2, 3, 4]'
      }
    ],
    miscellaneous: {
      name: 'Follow-up',
      description: 'Can you solve this problem in a single pass through the string with O(1) extra space (excluding the output array)?'
    },
    templates: {
      java: 'class CountConsecutive {\n    public int[] countConsecutiveChars(String s) {\n        // Write your code here\n    }\n}',
      python: 'class CountConsecutive:\n    def count_consecutive_chars(self, s):\n        # Write your code here\n        pass'
    },
    solution: 'class Solution {\n    public int[] countConsecutiveChars(String s) {\n        if (s == null || s.isEmpty()) {\n            return new int[0];\n        }\n        \n        List<Integer> counts = new ArrayList<>();\n        \n        char currentChar = s.charAt(0);\n        int count = 1;\n        \n        for (int i = 1; i < s.length(); i++) {\n            if (s.charAt(i) == currentChar) {\n                count++;\n            } else {\n                counts.add(count);\n                currentChar = s.charAt(i);\n                count = 1;\n            }\n        }\n        \n        counts.add(count);\n        \n        int[] result = new int[counts.size()];\n        for (int i = 0; i < counts.size(); i++) {\n            result[i] = counts.get(i);\n        }\n        \n        return result;\n    }\n}',
    testCases: [
      {
        input: 'aabbb',
        expectedOutput: '[2, 3]',
        description: 'Example test case'
      },
      {
        input: 'a',
        expectedOutput: '[1]',
        description: 'Single character'
      },
      {
        input: 'aa',
        expectedOutput: '[2]',
        description: 'Repeated single character'
      },
      {
        input: 'abbcccdddd',
        expectedOutput: '[1, 2, 3, 4]',
        description: 'Increasing consecutive characters'
      },
      {
        input: 'pjjjtttppprrr',
        expectedOutput: '[1, 3, 3, 3, 3]',
        description: 'Complex pattern'
      },
      {
        input: 'tptptptp',
        expectedOutput: '[1, 1, 1, 1, 1, 1, 1, 1]',
        description: 'Alternating characters'
      },
    ]
  },

  'minimumpathsum': {
    id: 'minimumpathsum',
    title: 'Minimum Path Sum',
    description: 'Given a m x n grid filled with non-negative numbers, find a path from top left to bottom right, which minimizes the sum of all numbers along its path.<br><br>Note: You can only move either down or right at any point in time.<br><br><img src="https://assets.leetcode.com/uploads/2020/11/05/minpath.jpg" alt="Grid Example" style="width: 180px; height: auto; display: block; margin: 1.5rem 1rem 2rem 1rem">',
    inputFormat: 'The first line contains two space-separated integers m and n representing the grid dimensions.\nThe next m lines contain n space-separated integers each representing the grid values.',
    outputFormat: 'Output a single integer representing the minimum path sum.',
    constraints: [
      '1 ≤ m, n ≤ 200',
      '0 ≤ grid[i][j] ≤ 100'
    ],
    examples: [
      {
        name: 'Example 1',
        input: '3 3\n1 3 1\n1 5 1\n4 2 1',
        output: '7'
      },
      {
        name: 'Example 2',
        input: '2 3\n1 2 3\n4 5 6',
        output: '12'
      }
    ],
    miscellaneous: {
      name: 'Follow-up',
      description: 'Can you solve this problem with O(1) space complexity by modifying the input grid in-place?'
    },
    templates: {
      java: 'class MinPathSum {\n    public int minPathSum(int[][] grid) {\n        // Write your code here\n    }\n}',
      python: 'class MinPathSum:\n    def min_path_sum(self, grid):\n        # Write your code here\n        pass'
    },
    solution: 'class MinPathSum {\n    public int minPathSum(int[][] grid) {\n        int m = grid.length;\n        int n = grid[0].length;\n        \n        // Calculate cumulative sums\n        for(int i = 0; i < m; i++) {\n            for(int j = 0; j < n; j++) {\n                if(i == 0 && j == 0) continue;\n                else if(i == 0) grid[i][j] += grid[i][j-1];\n                else if(j == 0) grid[i][j] += grid[i-1][j];\n                else grid[i][j] += Math.min(grid[i-1][j], grid[i][j-1]);\n            }\n        }\n        \n        return grid[m-1][n-1];\n    }\n}',
    testCases: [
      {
        input: '3 3\n1 3 1\n1 5 1\n4 2 1',
        expectedOutput: '7',
        description: 'Example test case'
      },
      {
        input: '2 3\n1 2 3\n4 5 6',
        expectedOutput: '12',
        description: 'Simple rectangular grid'
      },
      {
        input: '1 1\n5',
        expectedOutput: '5',
        description: '1x1 grid'
      },
      {
        input: '3 3\n9 9 9\n9 9 9\n9 9 9',
        expectedOutput: '45',
        description: 'Grid with all same values'
      }
    ]
  },

  'longestcommonprefix': {
    id: 'longestcommonprefix',
    title: 'Longest Common Prefix',
    description: 'Write a function to find the longest common prefix string amongst an array of strings.\n\nIf there is no common prefix, return an empty string "".',
    inputFormat: 'A single line containing space-separated strings.',
    outputFormat: 'Output the longest common prefix string. If there is no common prefix, output an empty string.',
    constraints: [
      '1 ≤ strs.length ≤ 200',
      '0 ≤ strs[i].length ≤ 200',
      'strs[i] consists of only lowercase English letters'
    ],
    examples: [
      {
        name: 'Example 1',
        input: 'flower flow flight',
        output: 'fl'
      },
      {
        name: 'Example 2',
        input: 'dog racecar car',
        output: ''
      }
    ],
    miscellaneous: {
      name: 'Follow-up',
      description: 'Can you solve this problem using a divide-and-conquer approach or trie data structure?'
    },
    templates: {
      java: 'class LongestPrefix {\n    public String longestCommonPrefix(String[] strs) {\n        // Write your code here\n    }\n}',
      python: 'class LongestPrefix:\n    def longest_common_prefix(self, strs):\n        # Write your code here\n        pass'
    },
    solution: 'class LongestPrefix {\n    public String longestCommonPrefix(String[] strs) {\n        if (strs == null || strs.length == 0) return "";\n        \n        String prefix = strs[0];\n        for(int i = 1; i < strs.length; i++) {\n            while(strs[i].indexOf(prefix) != 0) {\n                prefix = prefix.substring(0, prefix.length() - 1);\n                if(prefix.isEmpty()) return "";\n            }\n        }\n        return prefix;\n    }\n}',
    testCases: [
      {
        input: 'flower flow flight',
        expectedOutput: 'fl',
        description: 'Basic test case'
      },
      {
        input: 'dog racecar car',
        expectedOutput: '',
        description: 'No common prefix'
      },
      {
        input: 'interspecies interstellar interstate',
        expectedOutput: 'inters',
        description: 'Longer common prefix'
      },
      {
        input: 'throne throne throne',
        expectedOutput: 'throne',
        description: 'All strings are identical'
      }
    ]
  },

  'closestvalueinrotatedarray': {
    id: 'closestvalueinrotatedarray',
    title: 'Find Closest Value in Rotated Sorted Array',
    description: `Given a sorted array of integers \`nums\` that has been rotated at some pivot point unknown to you beforehand, and a target value \`target\`.

For example, the original array might have been \`[1, 3, 5, 7, 9]\` and after rotation became \`[7, 9, 1, 3, 5]\`.

Find the element in the array that is closest in value to the target. If there are multiple such elements (i.e., two elements that are equidistant from the target), return the smaller one.`,
    inputFormat: 'The first line contains an integer n denoting the size of the array.\nThe second line contains n space-separated integers denoting the elements of the rotated sorted array.\nThe third line contains a single integer denoting the target value.',
    outputFormat: 'Return an integer representing the element in the array that is closest to the target. If there are two elements equidistant from the target, return the smaller one.',
    constraints: [
      '1 <= nums.length <= 10^4',
      '-10^4 <= nums[i] <= 10^4',
      'All values in nums are unique',
      'nums is guaranteed to be rotated at some pivot',
      '-10^4 <= target <= 10^4'
    ],
    examples: [
      {
        name: 'Example 1',
        input: '7\n4 5 6 7 0 1 2\n3',
        output: '2'
      },
      {
        name: 'Example 2',
        input: '5\n5 7 9 1 3\n6',
        output: '5'
      }
    ],
    miscellaneous: {
      name: 'Follow-up',
      description: 'Can you solve this problem in O(log n) time complexity using binary search instead of linear search?'
    },
    templates: {
      java: 'class ClosestValueFinder {\n    public int findClosestElement(int[] nums, int target) {\n        // Write your code here\n    }\n}',
      python: 'class ClosestValueFinder:\n    def find_closest_element(self, nums, target):\n        # Write your code here\n        pass'
    },
    solution: `class ClosestValueFinder {
    public int findClosestElement(int[] nums, int target) {
        if (nums == null || nums.length == 0) {
            return -1;
        }
        
        int closest = nums[0];
        int minDiff = Math.abs(nums[0] - target);
        
        for (int i = 1; i < nums.length; i++) {
            int diff = Math.abs(nums[i] - target);
            
            // Update if found closer element or
            // same distance but smaller value
            if (diff < minDiff || (diff == minDiff && nums[i] < closest)) {
                closest = nums[i];
                minDiff = diff;
            }
        }
        
        return closest;
    }
}`,
    testCases: [
      {
        input: '7\n4 5 6 7 0 1 2\n3',
        expectedOutput: '2',
        description: 'Example test case'
      },
      {
        input: '8\n7 8 1 2 3 4 5 6\n0',
        expectedOutput: '1',
        description: 'Target closer to beginning after rotation'
      },
      {
        input: '5\n5 7 9 1 3\n6',
        expectedOutput: '5',
        description: 'Equidistant elements case'
      },
      {
        input: '5\n3 4 5 1 2\n6',
        expectedOutput: '5',
        description: 'Target greater than all elements'
      },
      {
        input: '5\n5 6 7 1 3\n4',
        expectedOutput: '3',
        description: 'Target between rotation points'
      },
      {
        input: '6\n11 13 15 17 2 5\n1',
        expectedOutput: '2',
        description: 'Target just below smallest value'
      },
      {
        input: '4\n20 30 10 15\n17',
        expectedOutput: '15',
        description: 'Small array with target between elements after pivot'
      },
      {
        input: '7\n50 60 70 80 90 10 20\n55',
        expectedOutput: '50',
        description: 'Target equidistant between two elements, return smaller'
      }
    ]
  },

  'permutationinstring': {
    id: 'permutationinstring',
    title: 'Permutation in String',
    description: 'Given two strings `s1` and `s2`, return `true` if `s2` contains a permutation of `s1`, or `false` otherwise.\n\nIn other words, return `true` if one of `s1`\'s permutations is the substring of `s2`.',
    inputFormat: 'Two lines containing strings s1 and s2, each consisting of lowercase English letters.',
    outputFormat: 'Return true if s2 contains a permutation of s1, or false otherwise.',
    constraints: [
      '1 <= s1.length, s2.length <= 10^4',
      's1 and s2 consist of lowercase English letters'
    ],
    examples: [
      {
        name: 'Example 1',
        input: 'ab\neidbaooo',
        output: 'true'
      },
      {
        name: 'Example 2',
        input: 'ab\neidboaoo',
        output: 'false'
      }
    ],
    miscellaneous: {
      name: 'Follow-up',
      description: 'Can you solve this problem using a sliding window technique with optimized character frequency counting?'
    },
    templates: {
      java: 'class PermutationInString {\n    public boolean checkInclusion(String s1, String s2) {\n        // Write your code here\n    }\n}',
      python: 'class PermutationInString:\n    def check_inclusion(self, s1, s2):\n        # Write your code here\n        pass'
    },
    solution: `class PermutationInString {
    public boolean checkInclusion(String s1, String s2) {
        if (s1.length() > s2.length()) {
            return false;
        }
        
        int[] s1Count = new int[26];
        int[] windowCount = new int[26];
        
        // Count characters in s1
        for (int i = 0; i < s1.length(); i++) {
            s1Count[s1.charAt(i) - 'a']++;
        }
        
        // Initialize the sliding window
        for (int i = 0; i < s1.length(); i++) {
            windowCount[s2.charAt(i) - 'a']++;
        }
        
        // Check if the initial window is a permutation
        if (matches(s1Count, windowCount)) {
            return true;
        }
        
        // Slide the window
        for (int i = s1.length(); i < s2.length(); i++) {
            // Add the new character to the window
            windowCount[s2.charAt(i) - 'a']++;
            // Remove the leftmost character from the window
            windowCount[s2.charAt(i - s1.length()) - 'a']--;
            
            // Check if current window is a permutation
            if (matches(s1Count, windowCount)) {
                return true;
            }
        }
        
        return false;
    }
    
    private boolean matches(int[] s1Count, int[] windowCount) {
        for (int i = 0; i < 26; i++) {
            if (s1Count[i] != windowCount[i]) {
                return false;
            }
        }
        return true;
    }
}`,
    testCases: [
      {
        input: 'ab\neidbaooo',
        expectedOutput: 'true',
        description: 'Example test case 1'
      },
      {
        input: 'ab\neidboaoo',
        expectedOutput: 'false',
        description: 'Example test case 2'
      },
      {
        input: 'adc\ndcda',
        expectedOutput: 'true',
        description: 'Permutation at the end'
      },
      {
        input: 'abc\nccccbbbbaaaa',
        expectedOutput: 'false',
        description: 'Characters match but not as a permutation'
      },
      {
        input: 'hello\noolhel',
        expectedOutput: 'true',
        description: 'Not a complete permutation'
      },
      {
        input: 'a\na',
        expectedOutput: 'true',
        description: 'Single character match'
      }
    ]
  },

  'fruitintobaskets': {
    id: 'fruitintobaskets',
    title: 'Fruit Into Baskets',
    description: 'You are visiting a farm that has a single row of fruit trees arranged from left to right. The trees are represented by an integer array `fruits` where `fruits[i]` is the **type** of fruit the `ith` tree produces.\n\nYou want to collect as much fruit as possible. However, the owner has some strict rules that you must follow:\n\n* You only have **two** baskets, and each basket can only hold a **single type** of fruit. There is no limit on the amount of fruit each basket can hold.\n* Starting from any tree of your choice, you must pick **exactly one fruit** from **every** tree (including the start tree) while moving to the right. The picked fruits must fit in one of your baskets.\n* Once you reach a tree with fruit that cannot fit in your baskets, you must stop.\n\nGiven the integer array `fruits`, return *the **maximum** number of fruits you can pick*.',
    inputFormat: 'The first line contains an integer n denoting the size of the array.\nThe second line contains n space-separated integers denoting the types of fruit in each tree.',
    outputFormat: 'Return an integer representing the maximum number of fruits you can pick.',
    constraints: [
      '1 <= fruits.length <= 10^5',
      '0 <= fruits[i] < fruits.length'
    ],
    examples: [
      {
        name: 'Example 1',
        input: '3\n1 2 1',
        output: '3'
      },
      {
        name: 'Example 2',
        input: '4\n0 1 2 2',
        output: '3'
      }
    ],
    miscellaneous: {
      name: 'Follow-up',
      description: 'Can you solve this problem using a sliding window technique to achieve O(n) time complexity?'
    },
    templates: {
      java: 'class FruitIntoBaskets {\n    public int totalFruit(int[] fruits) {\n        // Write your code here\n    }\n}',
      python: 'class FruitIntoBaskets:\n    def total_fruit(self, fruits):\n        # Write your code here\n        pass'
    },
    solution: `class FruitIntoBaskets {
    public int totalFruit(int[] fruits) {
        if (fruits == null || fruits.length == 0) {
            return 0;
        }
        
        int maxFruits = 0;
        int left = 0;
        
        // Use a map to store the count of each fruit type in the current window
        Map<Integer, Integer> basket = new HashMap<>();
        
        // Expand the window to the right
        for (int right = 0; right < fruits.length; right++) {
            // Add the current fruit to the basket
            basket.put(fruits[right], basket.getOrDefault(fruits[right], 0) + 1);
            
            // If we have more than 2 types of fruits, shrink the window from the left
            while (basket.size() > 2) {
                int leftFruit = fruits[left];
                basket.put(leftFruit, basket.get(leftFruit) - 1);
                
                if (basket.get(leftFruit) == 0) {
                    basket.remove(leftFruit);
                }
                
                left++;
            }
            
            // Update the maximum fruits we can pick
            maxFruits = Math.max(maxFruits, right - left + 1);
        }
        
        return maxFruits;
    }
}`,
    testCases: [
      {
        input: '3\n1 2 1',
        expectedOutput: '3',
        description: 'Example test case 1'
      },
      {
        input: '4\n0 1 2 2',
        expectedOutput: '3',
        description: 'Example test case 2'
      },
      {
        input: '5\n1 2 3 2 2',
        expectedOutput: '4',
        description: 'Example test case 3'
      },
      {
        input: '5\n3 3 3 1 2',
        expectedOutput: '4',
        description: 'Contiguous same fruit type'
      },
      {
        input: '8\n1 2 3 4 5 6 7 8',
        expectedOutput: '2',
        description: 'All different fruit types'
      },
      {
        input: '7\n0 0 0 0 0 0 0',
        expectedOutput: '7',
        description: 'All same fruit type'
      }
    ]
  },
  'validanagram': {
    id: 'validanagram',
    title: 'Valid Anagram',
    description: 'Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, using all the original letters exactly once.',
    inputFormat: 'Two lines containing strings s and t, each consisting of lowercase English letters.',
    outputFormat: 'Return true if t is an anagram of s, or false otherwise.',
    constraints: [
      '1 <= s.length, t.length <= 5 * 10^4',
      's and t consist of lowercase English letters'
    ],
    examples: [
      {
        name: 'Example 1',
        input: 's = \"anagram\"\nt = \"nagaram\"',
        output: 'true'
      },
      {
        name: 'Example 2',
        input: 's = \"rat\"\nt = \"car\"',
        output: 'false'
      }
    ],
    miscellaneous: {
      name: 'Follow-up',
      description: 'Could you solve it in O(n) time using only O(1) extra space? What if the inputs contain Unicode characters?'
    },
    templates: {
      java: 'class ValidAnagram {\n    public boolean isAnagram(String s, String t) {\n        // Write your code here\n    }\n}',
      python: 'class ValidAnagram:\n    def is_anagram(self, s, t):\n        # Write your code here\n        pass'
    },
    solution: `class ValidAnagram {
    public boolean isAnagram(String s, String t) {
        // If lengths are different, they can't be anagrams
        if (s.length() != t.length()) {
            return false;
        }
        
        // Count frequency of each character in both strings
        int[] charCount = new int[26];
        
        for (int i = 0; i < s.length(); i++) {
            charCount[s.charAt(i) - 'a']++;
            charCount[t.charAt(i) - 'a']--;
        }
        
        // Check if all counts are zero
        for (int count : charCount) {
            if (count != 0) {
                return false;
            }
        }
        
        return true;
    }
}`,
    testCases: [
      {
        input: 'anagram\nnagaram',
        expectedOutput: 'true',
        description: 'Example test case 1 - valid anagram'
      },
      {
        input: 'rat\ncar',
        expectedOutput: 'false',
        description: 'Example test case 2 - not an anagram'
      },
      {
        input: 'listen\nsilent',
        expectedOutput: 'true',
        description: 'Classic anagram pair'
      },
      {
        input: 'evil\nvile',
        expectedOutput: 'true',
        description: 'Another valid anagram'
      },
      {
        input: 'a\nab',
        expectedOutput: 'false',
        description: 'Different lengths'
      },
      {
        input: 'ab\nba',
        expectedOutput: 'true',
        description: 'Simple two character anagram'
      },
      {
        input: 'aab\naba',
        expectedOutput: 'true',
        description: 'Anagram with repeated characters'
      },
      {
        input: 'abc\ndef',
        expectedOutput: 'false',
        description: 'Completely different characters'
      }
    ]
  }
};

// Convert problem list to include language-specific templates
const getProblemList = () => Object.values(problems).map(problem => ({
  id: problem.id,
  title: problem.title,
  description: problem.description,
  inputFormat: problem.inputFormat,
  outputFormat: problem.outputFormat,
  constraints: problem.constraints,
  examples: problem.examples,
  miscellaneous: problem.miscellaneous,
  showSolution: !!problem.solution
}));

module.exports = {
  problems,
  getProblemList
};
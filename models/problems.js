// models/problems.js
const problems = {
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
    example: {
      input: '1 2 3 4 5 -1 6',
      output: '[[1,3,6],[2,5],[4]]'
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
    example: {
      input: '8\n10 9 2 5 3 7 101 18',
      output: '4'
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
    example: {
      input: 'aabbb',
      output: '[2, 3]'
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
    example: {
      input: '3 3\n1 3 1\n1 5 1\n4 2 1',
      output: '7'
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
    example: {
      input: 'flower flow flight',
      output: 'fl'
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
    example: {
      input: '7\n4 5 6 7 0 1 2\n3',
      output: '2'
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
  example: problem.example,
  showSolution: !!problem.solution
}));

module.exports = {
  problems,
  getProblemList
};
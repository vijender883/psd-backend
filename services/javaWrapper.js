// File: services/javaWrapper.js
const fs = require('fs').promises;
const path = require('path');

async function generateJavaWrapper(executionDir, code) {
  const isMinPathSum = code.includes('MinPathSum');
  const isDiagonalTraversal = code.includes('DiagonalTraversal');
  const isLIS = code.includes('LengthOfLIS');
  
  let wrapperCode;
  if (isMinPathSum) {
    wrapperCode = generateMinPathSumWrapper(code);
  } else if (isDiagonalTraversal) {
    wrapperCode = generateDiagonalTraversalWrapper(code);
  } else if (isLIS) {
    wrapperCode = generateLISWrapper(code);
  } else {
    wrapperCode = generateLongestCommonPrefixWrapper(code);
  }
  
  await fs.writeFile(path.join(executionDir, 'Solution.java'), wrapperCode);
}

// Add these functions in javaWrapper.js:

// In javaWrapper.js, update the formatResult function in generateDiagonalTraversalWrapper:

function generateDiagonalTraversalWrapper(code) {
  return `
import java.util.*;

class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode(int x) { val = x; }
}

${code}

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String[] values = scanner.nextLine().split("\\s+");
        
        // Create tree from level-order input
        TreeNode root = buildTree(values);
        
        // Call solution
        DiagonalTraversal solver = new DiagonalTraversal();
        List<List<Integer>> result = solver.diagonalTraversal(root);
        
        // Format and print result
        System.out.println(formatResult(result));
    }
    
    private static TreeNode buildTree(String[] values) {
        if (values.length == 0 || values[0].equals("-1")) return null;
        
        Queue<TreeNode> queue = new LinkedList<>();
        TreeNode root = new TreeNode(Integer.parseInt(values[0]));
        queue.offer(root);
        
        for (int i = 1; i < values.length; i += 2) {
            TreeNode current = queue.poll();
            if (current != null) {
                if (i < values.length && !values[i].equals("-1")) {
                    current.left = new TreeNode(Integer.parseInt(values[i]));
                    queue.offer(current.left);
                }
                if (i + 1 < values.length && !values[i + 1].equals("-1")) {
                    current.right = new TreeNode(Integer.parseInt(values[i + 1]));
                    queue.offer(current.right);
                }
            }
        }
        return root;
    }
    
    private static String formatResult(List<List<Integer>> result) {
        if (result == null || result.isEmpty()) return "[]";
        
        StringBuilder sb = new StringBuilder();
        sb.append("[");
        
        for (int i = 0; i < result.size(); i++) {
            List<Integer> diagonal = result.get(i);
            sb.append("[");
            for (int j = 0; j < diagonal.size(); j++) {
                sb.append(diagonal.get(j));
                if (j < diagonal.size() - 1) sb.append(",");
            }
            sb.append("]");
            if (i < result.size() - 1) sb.append(",");
        }
        
        sb.append("]");
        return sb.toString();
    }
}`
}

function generateLISWrapper(code) {
  return `
import java.util.Scanner;

${code}

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        // Read array size
        int n = Integer.parseInt(scanner.nextLine());
        
        // Read array elements
        String[] nums = scanner.nextLine().split("\\s+");
        int[] arr = new int[n];
        for(int i = 0; i < n; i++) {
            arr[i] = Integer.parseInt(nums[i]);
        }
        
        // Call solution
        LengthOfLIS solver = new LengthOfLIS();
        int result = solver.lengthOfLIS(arr);
        
        // Output result
        System.out.println(result);
    }
}`;
}

function generateMinPathSumWrapper(code) {
  return `
import java.util.Scanner;
import java.util.Arrays;

${code}

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        // Read dimensions
        String[] dims = scanner.nextLine().split("\\\\s+");
        int m = Integer.parseInt(dims[0]);
        int n = Integer.parseInt(dims[1]);
        
        // Read grid
        int[][] grid = new int[m][n];
        for(int i = 0; i < m; i++) {
            String[] row = scanner.nextLine().split("\\\\s+");
            for(int j = 0; j < n; j++) {
                grid[i][j] = Integer.parseInt(row[j]);
            }
        }
        
        // Call solution
        MinPathSum solver = new MinPathSum();
        int result = solver.minPathSum(grid);
        
        // Output result
        System.out.println(result);
    }
}`;
}

function generateLongestCommonPrefixWrapper(code) {
  return `
import java.util.Scanner;
import java.util.Arrays;

${code}

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        // Read input strings
        String[] strs = scanner.nextLine().split("\\\\s+");
        
        // Call solution
        LongestPrefix solver = new LongestPrefix();
        String result = solver.longestCommonPrefix(strs);
        
        // Output result
        System.out.println(result);
    }
}`;
}

module.exports = {
  generateJavaWrapper
};
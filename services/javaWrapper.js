// File: services/javaWrapper.js
const fs = require('fs').promises;
const path = require('path');

// Generate a Java wrapper for the submitted code
async function generateJavaWrapper(executionDir, code) {
  // Detect which problem this is for based on the code content
  const isMinPathSum = code.includes('MinPathSum');
  
  const wrapperCode = isMinPathSum ? generateMinPathSumWrapper(code) : generateLongestCommonPrefixWrapper(code);
  await fs.writeFile(path.join(executionDir, 'Solution.java'), wrapperCode);
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
const fs = require('fs').promises;
const path = require('path');

// Generate a Java wrapper for the submitted code
async function generateJavaWrapper(executionDir, code) {
  // Generate wrapper for TwoSum class
  const wrapperCode = `
import java.util.Scanner;
import java.util.Arrays;

${code}

public class Solution {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        // Read array
        String line = scanner.nextLine();
        String[] strNumbers = line.trim().split("\\\\s+");
        int[] numbers = new int[strNumbers.length];
        for (int i = 0; i < strNumbers.length; i++) {
            numbers[i] = Integer.parseInt(strNumbers[i]);
        }
        
        // Read target
        int target = Integer.parseInt(scanner.nextLine());
        
        // Call solution
        TwoSum solver = new TwoSum();
        int[] result = solver.twoSum(numbers, target);
        
        // Format output
        System.out.println(result[0] + " " + result[1]);
    }
}
  `;
  
  await fs.writeFile(path.join(executionDir, 'Solution.java'), wrapperCode);
}

module.exports = {
  generateJavaWrapper
};
// services/javaWrapper.js
const fs = require('fs').promises;
const path = require('path');

async function generateJavaWrapper(executionDir, code, problemId = null) {
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
        wrapperCode = generatePermutationInStringWrapper(code);
        break;
      case 'total_fruit':
        wrapperCode = generateFruitIntoBasketsWrapper(code);
        break;
      case 'two_sum':
      case 'twosum':
        wrapperCode = generateTwoSumWrapper(code);
        break;
      case 'longestcommonprefix':
        wrapperCode = generateLongestCommonPrefixWrapper(code);
        break;
      case 'target_difference':
        wrapperCode = generateTargetDifferenceWrapper(code);
        break;
      case 'traffic_flow_analysis':
        wrapperCode = generateTrafficFlowWrapper(code);
        break;
    }
  }

  if (!wrapperCode) {
    // Basic legacy detection
    if (code.includes('MinPathSum')) {
      wrapperCode = generateMinPathSumWrapper(code);
    } else if (code.includes('DiagonalTraversal')) {
      wrapperCode = generateDiagonalTraversalWrapper(code);
    } else if (code.includes('LengthOfLIS')) {
      wrapperCode = generateLISWrapper(code);
    } else if (code.includes('CountConsecutive')) {
      wrapperCode = generateConsecutiveCharsWrapper(code);
    } else if (code.includes('ClosestValueFinder')) {
      wrapperCode = generateClosestValueWrapper(code);
    } else if (code.includes('PermutationInString')) {
      wrapperCode = generatePermutationInStringWrapper(code);
    } else if (code.includes('FruitIntoBaskets')) {
      wrapperCode = generateFruitIntoBasketsWrapper(code);
    } else if (code.includes('twoSum')) {
      wrapperCode = generateTwoSumWrapper(code);
    } else {
      wrapperCode = generateLongestCommonPrefixWrapper(code);
    }
  }

  // Write to Main.java as per codeExecutor.js requirement
  await fs.writeFile(path.join(executionDir, 'Main.java'), wrapperCode);
}

function generateTwoSumWrapper(code) {
  return `
import java.util.*;

${code}

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextLine()) return;
        String[] numsStr = scanner.nextLine().trim().split("\\\\s+");
        int[] nums = new int[numsStr.length];
        for(int i = 0; i < numsStr.length; i++) {
            nums[i] = Integer.parseInt(numsStr[i]);
        }
        
        if (!scanner.hasNextInt()) return;
        int target = scanner.nextInt();
        
        Solution solver = new Solution();
        int[] result = solver.twoSum(nums, target);
        
        if (result != null && result.length >= 2) {
            System.out.println(result[0] + " " + result[1]);
        }
    }
}`;
}

function generateClosestValueWrapper(code) {
  return `
import java.util.*;

${code}

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextLine()) return;
        int n = Integer.parseInt(scanner.nextLine().trim());
        
        if (!scanner.hasNextLine()) return;
        String[] numsStr = scanner.nextLine().trim().split("\\\\s+");
        int[] nums = new int[n];
        for(int i = 0; i < n; i++) {
            nums[i] = Integer.parseInt(numsStr[i]);
        }
        
        if (!scanner.hasNextLine()) return;
        int target = Integer.parseInt(scanner.nextLine().trim());
        
        ClosestValueFinder solver = new ClosestValueFinder();
        int result = solver.findClosestElement(nums, target);
        System.out.println(result);
    }
}`;
}

function generateConsecutiveCharsWrapper(code) {
  return `
import java.util.*;

${code}

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextLine()) return;
        String s = scanner.nextLine().trim();
        
        CountConsecutive solver = new CountConsecutive();
        int[] result = solver.countConsecutiveChars(s);
        System.out.println(Arrays.toString(result));
    }
}`;
}

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

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextLine()) return;
        String[] values = scanner.nextLine().trim().split("\\\\s+");
        
        TreeNode root = buildTree(values);
        DiagonalTraversal solver = new DiagonalTraversal();
        List<List<Integer>> result = solver.diagonalTraversal(root);
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
}`;
}

function generateLISWrapper(code) {
  return `
import java.util.*;

${code}

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextLine()) return;
        int n = Integer.parseInt(scanner.nextLine().trim());
        if (!scanner.hasNextLine()) return;
        String[] nums = scanner.nextLine().trim().split("\\\\s+");
        int[] arr = new int[n];
        for(int i = 0; i < n; i++) arr[i] = Integer.parseInt(nums[i]);
        
        LengthOfLIS solver = new LengthOfLIS();
        System.out.println(solver.lengthOfLIS(arr));
    }
}`;
}

function generatePermutationInStringWrapper(code) {
  return `
import java.util.*;

${code}

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextLine()) return;
        String s1 = scanner.nextLine().trim();
        if (!scanner.hasNextLine()) return;
        String s2 = scanner.nextLine().trim();
        
        PermutationInString solver = new PermutationInString();
        System.out.println(solver.checkInclusion(s1, s2));
    }
}`;
}

function generateFruitIntoBasketsWrapper(code) {
  return `
import java.util.*;

${code}

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in) ;
        if (!scanner.hasNextLine()) return;
        int n = Integer.parseInt(scanner.nextLine().trim());
        if (!scanner.hasNextLine()) return;
        String[] numsStr = scanner.nextLine().trim().split("\\\\s+");
        int[] fruits = new int[n];
        for(int i = 0; i < n; i++) fruits[i] = Integer.parseInt(numsStr[i]);
        
        FruitIntoBaskets solver = new FruitIntoBaskets();
        System.out.println(solver.totalFruit(fruits));
    }
}`;
}

function generateMinPathSumWrapper(code) {
  return `
import java.util.*;

${code}

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextLine()) return;
        String[] dims = scanner.nextLine().trim().split("\\\\s+");
        int m = Integer.parseInt(dims[0]);
        int n = Integer.parseInt(dims[1]);
        
        int[][] grid = new int[m][n];
        for(int i = 0; i < m; i++) {
            if (!scanner.hasNextLine()) break;
            String[] row = scanner.nextLine().trim().split("\\\\s+");
            for(int j = 0; j < n; j++) grid[i][j] = Integer.parseInt(row[j]);
        }
        
        MinPathSum solver = new MinPathSum();
        System.out.println(solver.minPathSum(grid));
    }
}`;
}

function generateLongestCommonPrefixWrapper(code) {
  return `
import java.util.*;

${code}

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextLine()) return;
        String[] strs = scanner.nextLine().trim().split("\\\\s+");
        
        LongestPrefix solver = new LongestPrefix();
        System.out.println(solver.longestCommonPrefix(strs));
    }
}`;
}

function generateTargetDifferenceWrapper(code) {
  return `
import java.util.*;

${code}

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextLine()) return;
        String line1 = scanner.nextLine().trim();
        if (line1.isEmpty()) return;
        
        String[] numsStr = line1.split("\\\\s+");
        int[] nums = new int[numsStr.length];
        for(int i = 0; i < numsStr.length; i++) {
            nums[i] = Integer.parseInt(numsStr[i]);
        }
        
        if (!scanner.hasNextInt()) return;
        int k = scanner.nextInt();
        
        try {
            // Support both Solution and TargetDifferenceSolution class names
            Object solver;
            java.lang.reflect.Method method;
            
            try {
                Class<?> clazz = Class.forName("Solution");
                solver = clazz.getDeclaredConstructor().newInstance();
                method = clazz.getMethod("targetDifference", int[].class, int.class);
            } catch (Exception e) {
                Class<?> clazz = Class.forName("TargetDifferenceSolution");
                solver = clazz.getDeclaredConstructor().newInstance();
                method = clazz.getMethod("targetDifference", int[].class, int.class);
            }
            
            List<int[]> result = (List<int[]>) method.invoke(solver, nums, k);
            
            if (result == null || result.isEmpty()) {
                System.out.println("");
            } else {
                result.sort((a, b) -> {
                    if (a[0] != b[0]) return a[0] - b[0];
                    return a[1] - b[1];
                });
                
                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < result.size(); i++) {
                    int[] pair = result.get(i);
                    sb.append(pair[0]).append(" ").append(pair[1]);
                    if (i < result.size() - 1) sb.append(" ");
                }
                System.out.println(sb.toString().trim());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}`;
}

function generateTrafficFlowWrapper(code) {
  return `
import java.util.*;

${code}

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (!scanner.hasNextLine()) return;
        String[] numsStr = scanner.nextLine().trim().split("\\\\s+");
        int[] nums = new int[numsStr.length];
        for(int i=0; i<numsStr.length; i++) nums[i] = Integer.parseInt(numsStr[i]);
        
        TrafficFlowAnalyzer solver = new TrafficFlowAnalyzer();
        System.out.println(solver.longestBalancedStretch(nums));
    }
}`;
}

module.exports = {
  generateJavaWrapper
};

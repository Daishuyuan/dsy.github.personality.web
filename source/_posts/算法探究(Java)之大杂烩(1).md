---
title: 算法探究(Java)之大杂烩(1)
date: 2018-02-28 19:08:04
toc: true
tags:
    - 算法
    - Java
---
![迷宫算法封面][1]
***&emsp;&emsp;"A man needs books as a sword needs a whetstone, if it is to keep its edge." --TYRION LANNISTER《Game of Thrones》***
# **迷宫算法** #
> &emsp;&emsp;迷宫算法，也就是在给定的起点和终点以及地图（数组）上，计算出起点到达终点的路径。也就是在迷宫中寻找出口的计算机算法。以下展示了基于java平台的队列迷宫算法和栈迷宫算法。其实还有一种算法叫做A*寻路算法，可以产生起点到终点的最优解，有时间，我会写一个java的类。
&emsp;&emsp;迷宫算法的作用，在游戏中运用的还是比较多的，大家可以想象。游戏中的人工智能也往往把这个当做基础函数来用，可以说这是游戏人工智能的基础。

<!-- more -->
## **基于队列的寻路算法（也称综合布线算法）**##
核心代码如下：
** QueuePath.java **
```java
package findway;
 
import java.util.LinkedList;
 
class Position { // Class Position
    public int row;
    public int col;
 
    Position(int row, int col) {
        this.row = row;
        this.col = col;
    }
 
    public Position() {
        this.row =   0;
        this.col =   0;
    }
 
    public boolean IsEqual(Position x) {
        if ((this.row == x.row) && (this.col == x.col))
            return true;
        else
            return false;
    }
 
    public void add(Position x) {
        this.row += x.row;
        this.col += x.col;
    }
}
 
class ERROR_STRING // Error string
{
    protected final static String StartEqualFinish = "start point equal to the finish point.";
    protected final static String StartOrFinishCantgo = "start point or finish point cant not go.";
}
 
public class QueuePath extends FindPath {
    private final Position offset[] = new Position[  4];
 
    public QueuePath(int[][] x, int height, int width) {
        super(x, height, width);
 
        // Initialize the matrix of offset
        offset[  0] = new Position(  0,   1); // right
        offset[  1] = new Position(  1,   0); // down
        offset[  2] = new Position(  0, -  1); // left
        offset[  3] = new Position(-  1,   0); // up
    }
 
    @Override
    public boolean findway(Position start_point, Position finish_point) {
        // Initialize the start and end
        this.start = new Position(start_point.row +   1, start_point.col +   1);
        this.finish = new Position(finish_point.row +   1, finish_point.col +   1);
        if ((start.row == finish.row) && (start.col == finish.col)) {
            error.add(ERROR_STRING.StartEqualFinish);
            return false;
        }
        if ((map[start.row][start.col] == Notgo)
                || (map[finish.row][finish.col] == Notgo)) {
            error.add(ERROR_STRING.StartOrFinishCantgo);
            return false;
        }
 
        // Reset map and value
        for (int i =   1; i < m -   1; i++)
            for (int j =   1; j < n -   1; j++)
                if (map[i][j] != Notgo)
                    map[i][j] =   0;
        PathLen =   0;
        // End set
 
        // Begin find path
        LinkedList<Position> Q = new LinkedList<Position>();
        map[start.row][start.col] = Notgo +   1; // locked
        Position here = new Position(), nbr = new Position();
        here.row = start.row;
        here.col = start.col;
        try {
            do {
                for (int i =   0; i < offset.length; i++) {
                    nbr.row = here.row + offset[i].row;
                    nbr.col = here.col + offset[i].col;
                    if (map[nbr.row][nbr.col] == Cango) {
                        map[nbr.row][nbr.col] = map[here.row][here.col] +   1;
                        if ((nbr.row == finish.row) && (nbr.col == finish.col))
                            break;
                        Q.addLast(new Position(nbr.row, nbr.col));
                    }
                }
                if ((nbr.row == finish.row) && (nbr.col == finish.col))
                    break;
                if (Q.isEmpty())
                    return false;
                here = Q.removeFirst();
            } while (true);
        } catch (Exception e) {
            e.printStackTrace();
        }
        // End find
 
        // Build the path of map
        here = new Position(finish.row, finish.col);
        PathLen = map[finish.row][finish.col] -   2;
 
        for (int j = PathLen -   1; j >=   0; j--) {
            path.add(  0, new Position(here.row, here.col));
            for (int i =   0; i < offset.length; i++) {
                nbr.row = here.row + offset[i].row;
                nbr.col = here.col + offset[i].col;
                if (map[nbr.row][nbr.col] == j +   2)
                    break;
            }
            here = new Position(nbr.row, nbr.col);
        }
        // End build
 
        return true;
    }
}
```

程序运行的结果如下:
```javascript
The path results is:
(2,1) (3,1) (4,1) (5,1) (6,1) (6,2) (6,3) (7,3) (7,4) (8,4) (8,5) (8,6) (9,6) (10,6) (10,5) (10,4) (10,3) (9,3) (9,2) (9,1)

0 . 0 . . . . 
. A 0 . 0 0 0 
. * . . . . . 
. * 0 . 0 0 . 
. * . 0 . . . 
. * . 0 . 0 . 
0 * * * . . 0 
0 . 0 * * 0 . 
0 0 0 0 * * * 
0 B * * 0 0 * 
0 0 0 * * * * 
PathLen:20
.:It can go
0:barrier
A:start point
B:finish point
*:It is the path
```

## **基于栈的普通寻路算法** ##
核心代码如下：
** StackPath.java **
```java
package findway;
 
import java.util.Stack;
 
class Direction {
    protected int row, col;
    protected String dir;
 
    Direction(int row, int col, String dir) {
        this.row = row;
        this.col = col;
        this.dir = dir;
    }
}
 
class item {
    int x, y, dir;
 
    public item(int i, int j, int k) {
        x = i;
        y = j;
        dir = k;
    }
}
 
public class StackPath extends FindPath {
    private final int SIZE =   8;
    private final Direction offset[] = new Direction[SIZE];
    Stack<item> S;
    item originD;
    int DIR_O =   0;
 
    StackPath(int[][] x, int height, int width) {
        super(x, height, width);
 
        // Initialize the matrix of offset
        offset[  0] = new Direction(-  1,   0, "N"); // N
        offset[  4] = new Direction(  1,   0, "S"); // S
        offset[  6] = new Direction(  0, -  1, "W"); // W
        offset[  2] = new Direction(  0,   1, "E"); // E
        offset[  1] = new Direction(-  1,   1, "NE"); // NE
        offset[  5] = new Direction(  1, -  1, "SW"); // SW
        offset[  7] = new Direction(-  1, -  1, "NW"); // NW
        offset[  3] = new Direction(  1,   1, "SE"); // SE
    }
 
    public void setDir(String Dir) {
        for (int i =   0; i < offset.length; i++) {
            if (offset[i].dir == Dir)
                DIR_O = i;
        }
    }
 
    @Override
    public boolean findway(Position start_point, Position finish_point) {
        // Initialize the start and end
        start = new Position(start_point.row +   1, start_point.col +   1);
        finish = new Position(finish_point.row +   1, finish_point.col +   1);
        originD = new item(start.row, start.col, DIR_O);
        if ((start.row == finish.row) && (start.col == finish.col)) {
            error.add(ERROR_STRING.StartEqualFinish);
            return false;
        }
        if ((map[start.row][start.col] == Notgo)
                || (map[finish.row][finish.col] == Notgo)) {
            error.add(ERROR_STRING.StartOrFinishCantgo);
            return false;
        }
 
        // Reset map and value
        for (int i =   1; i < m -   1; i++)
            for (int j =   1; j < n -   1; j++)
                if (map[i][j] != Notgo)
                    map[i][j] =   0;
        PathLen =   0;
        // End set
 
        // Begin find path
        map[start.row][start.col] = Notgo +   1; // lock
        S = new Stack<item>();
        int i =   0, j =   0, d =   0, g =   0, h =   0;
        item temp;
        S.push(new item(originD.x, originD.y, originD.dir));
        while (!S.isEmpty()) {
            temp = S.pop();
            i = temp.x;
            j = temp.y;
            d = temp.dir;
            while (d < offset.length) {
                g = i + offset[d].row;
                h = j + offset[d].col;
                if ((g == finish.row) && (h == finish.col)) {
                    S.push(new item(i, j, d));
                    S.push(new item(g, h, d));
                    break;
                }
                if (map[g][h] ==   0) {
                    map[g][h] = Notgo +   1;
                    S.push(new item(i, j, d));
                    i = g;
                    j = h;
                    d =   0;
                } else
                    d++;
            }
            if ((g == finish.row) && (h == finish.col))
                break;
        }
        // End find
 
        if (S.isEmpty())
            return false;
 
        // Build the path of map
        PathLen = S.size() -   1;
        while (!S.isEmpty()) {
            item cache = S.pop();
            path.add(  0, new Position(cache.x, cache.y));
        }
        path.remove(  0);
        // End build
 
        return true;
    }
 
}
```
程序运行的结果如下:
```javascript
The path results is:
(2,0) (1,0) (2,1) (2,2) (1,3) (2,4) (2,5) (2,6) (3,6) (4,6) (5,6) (6,5) (7,6) (8,6) (9,6) (10,6) (10,5) (10,4) (10,3) (9,3) (9,2) (9,1) 

0 . 0 . . . . 
* A 0 * 0 0 0 
* * * . * * * 
. . 0 . 0 0 * 
. . . 0 . . * 
. . . 0 . 0 * 
0 . . . . * 0 
0 . 0 . . 0 * 
0 0 0 0 . . * 
0 B * * 0 0 * 
0 0 0 * * * * 
PathLen:22
.:It can go
0:barrier
A:start point
B:finish point
*:It is the path
```

## 其他的代码 ##
** FindPath.java **
```java
package findway;
 
import java.util.ArrayList;
 
public abstract class FindPath {
    protected int PathLen;
    protected Position start, finish;
    protected ArrayList<Position> path=new ArrayList<Position>();
    protected ArrayList<String> error;
    protected int m;
    protected int n;
    protected int height;
    protected int width;
    protected int map[][];
    protected int Cango =   0; // The block is able to go
    protected int Notgo =   1; // The block is unable to go
 
    public FindPath(int[][] x, int height, int width) {
        // Initialize the value
        this.height = height;
        this.width = width;
        this.m = height +   2;
        this.n = width +   2;
        this.map = new int[m][n];
        error = new ArrayList<String>();
 
        // Initialize the map
        for (int i =   1; i < m -   1; i++)
            for (int j =   1; j < n -   1; j++)
                this.map[i][j] = x[i -   1][j -   1];
        for (int p =   0; p < n; p++)
            this.map[  0][p] = Notgo;
        for (int k =   0; k < n; k++)
            this.map[m -   1][k] = Notgo;
        for (int j =   0; j < m; j++)
            this.map[j][  0] = Notgo;
        for (int i =   0; i < m; i++)
            this.map[i][n -   1] = Notgo;
    }
 
    public abstract boolean findway(Position start_point, Position finish_point);
 
    public Position getSize() // Get Path Length
    {
        return new Position(height, width);
    }
 
    public void printPath() // Print Standard List of Path
    {
        System.out.println("The path results is:");
        for (Position site : path)
            System.out.print("(" + (site.row -   1) + "," + (site.col -   1) + ")"
                    + " ");
        System.out.println();
    }
 
    public void printmapValue() // print value of map
    {
        for (int i =   0; i < m; i++) {
            for (int j =   0; j < n; j++)
                System.out.printf("%d\t", map[i][j]);
            System.out.println();
        }
        System.out.println();
    }
 
    public void printErrorImformation() // Print error information
    {
        if (error.size() !=   0)
            for (String s : error)
                System.out.println(s);
    }
 
    public void print() // Print matrix path
    {
        char copy[][] = new char[m][n];
        for (int i =   0; i < m; i++)
            for (int j =   0; j < n; j++)
                if (map[i][j] != Notgo)
                    copy[i][j] = '.';
                else
                    copy[i][j] = '0';
        for (Position site : path)
            copy[site.row][site.col] = '*';
        copy[start.row][start.col] = 'A';
        copy[finish.row][finish.col] = 'B';
        for (int i =   1; i < m -   1; i++) {
            for (int j =   1; j < n -   1; j++)
                System.out.print(copy[i][j] + " ");
            System.out.println();
        }
        System.out.println("PathLen:" + PathLen);
        System.out.println(".:It can go");
        System.out.println("0:barrier");
        System.out.println("A:start point");
        System.out.println("B:finish point");
        System.out.println("*:It is the path");
    }
 
    public ArrayList<Position> getPath() // Get ArrayList of path
    {
        ArrayList<Position> copy = new ArrayList<Position>();
        for (Position site : path)
            copy.add(new Position(site.row -   1, site.col -   1));
        return copy;
    }
}
```

## 调用运行 ##
** MainActivity.java **
```java
package findway;
 
public class MainActivity {
       public static void main(String[] args)
       {
           int map[][]=new int[][]{{ 1, 0, 1, 0, 0, 0, 0},
                                   { 0, 0, 1, 0, 1, 1, 1},
                                   { 0, 0, 0, 0, 0, 0, 0},
                                   { 0, 0, 1, 0, 1, 1, 0},
                                   { 0, 0, 0, 1, 0, 0, 0},
                                   { 0, 0, 0, 1, 0, 1, 0},
                                   { 1, 0, 0, 0, 0, 0, 1},
                                   { 1, 0, 1, 0, 0, 1, 0},
                                   { 1, 1, 1, 1, 0, 0, 0},
                                   { 1, 0, 0, 0, 1, 1, 0},
                                   { 1, 1, 1, 0, 0, 0, 0}};
           QueuePath way=new QueuePath(map,11, 7);
           way.findway(new Position( 1, 1),new Position( 9, 1));
           way.printPath();
           way.print();
            
           //StackPath way=new StackPath(map,11,7);
           //way.setDir("SW");
           //way.findway(new Position(1,1),new Position(9,1));
           //way.printPath();
           //way.print();
       }
}
```


  [1]: /assets/blogImg/blog2018-3-2.jpg
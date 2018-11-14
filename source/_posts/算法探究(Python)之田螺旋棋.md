---
title: 算法探究(Python)之田螺旋棋
date: 2018-04-26 18:26:29
toc: true
tags:
    - 算法
    - Python
---

![田螺旋棋6*6][1]

# **介绍** #
&emsp;&emsp;Surakarta is, according to some reports, a traditional Indonesian board game. It is similar to chequers, but has some unique twists. Your goal, in this project, is to implement the functionality required to ensure that only legal moves are allowed by the Python-based version of Surakarta.

> 根据报导，田螺旋棋是一种传统的印度尼西亚的桌面游戏。它类似于跳棋，但是有一些独特的规则。在本次工程，你的目标就是基于Python，实现功能确保田螺旋棋的合法走棋。

<!--more-->

- The board consists of a six-by-six grid of lines, with two concentric circular tracks at each corner, as shown below. Pieces are placed on the points where lines intersect. Each player starts with twelve pieces (black or white tokens) that are placed on the intersections nearest that player.

> 棋盘是一个6乘6的网格，有两个同心圆弧线在每个角落上，如下（见顶图）。棋子被摆放在线与线的交点处。每个玩家开始有12个棋子（黑色或者白色），它们被摆放在离玩家最近的交点处。

![田螺旋棋4*4][2]

- initially, we will work with a more compact four-by-four version of the Surakarta board, with a single circular track at each corner, as shown below. On this board, each player starts with only four pieces placed on the intersections nearest to that player. However, the functions you implement should also work for a six-by-six version of the board.

> 刚开始，我们可以使用一个4乘4的田螺旋棋棋盘的简化版本，在每个角落只有一个圆环，如下（见上图）。在棋盘上每个玩家仅有四个棋子。然而，你实现的方法应当同时适用于6乘6版本的棋盘。

# **玩法** #
- Players decide at random who moves first. In a turn, a player must make one of two types of move (passing is not allowed):

> 随机决定玩家先手。一回合中，玩家可以以两种方式移动（不允许穿过）：

- A normal move, in which a player moves one of their pieces from one intersection to an adjacent intersection, horizontally, vertically, or diagonally. Pieces may not jump over other pieces, and only one piece may occupy an intersection at any point in time. The circular tracks around each corner may not be used for normal moves.

> 普通移动，每个玩家可以移动他们的棋子从一个交点到另一个相邻的交点，水平、垂直或者对角。棋子不能跳过其他的棋子且同一时刻仅能有一个棋子占据一个交点。环绕每个角落的原形轨迹不能用于普通移动。

![田螺旋棋之普通移动][3]

- A capture move, in which a player slides a piece along a straight line, around a circular track, and then further along a straight line, until it lands on an opposing piece, which is then removed from the board. Pieces making a capture move may move more than one intersection during such a move, but may not jump over other pieces. Note that a capture move must use at least one of the circular tracks, and may use more than one. Update: A capture move can start and/or end on the edge of the board; that is, it can move along a straight line of length zero!

> 捕获移动（吃子），每个玩家沿着直线滑动他们的棋子，沿着原形轨迹然后进入另一个直线，直到遇到一个对方的棋子，对方棋子将从棋盘上移除。捕获移动中必须超过一个交点，但是不能跳过其他棋子。记住，一个捕获移动至少使用一个圆形轨道，可能使用多于一个。更新：一个捕获移动可以在棋盘的边界上开始或结束，可以不经过任何直线。

![田螺旋棋之捕获移动][4]

# **问题** #
In this project, you will answer a number of questions that create functions needed to play the game of Surakarta.
- Question 1: Implement a function make_move_normal(initial, move_start,move_end) that validates and executes if possible, a normal move.
- Question 2: Implement a function make_move_capture(initial, move_start,move_end) that validates and executes if possible, a capture move.
- Question 3: Implement a function make_move_sequence(initial, move_sequence)that validates a sequence of moves constituting part of a game.
- Question 4: This question will require you to create a suite of test cases that can be used to test your make_move_capture function.

# **代码** #
**gameLogic.py**
```python
import math

class Surakarta:
    def __init__(self, size):
        self.size = size
        self.dirs = [(0,1),(0,-1),(1,0),(-1,0)]
        self.points = [(0,0), (0,size-1), (size-1,0), (size-1,size-1)]
        self.block = (int) (size / 2)
        self.arcs = list();
        for i in range(1, self.block):
            for point in self.points:
                if point[1] == size - 1:
                    p1 = (point[0], point[1] - i)
                else:
                    p1 = (point[0], point[1] + i)
                if point[0] == size - 1:
                    p2 = (point[0] - i, point[1])
                else:
                    p2 = (point[0] + i, point[1])
                self.arcs.append([p1, p2]);
        print('board size:', self.size * self.size)
        print('arcs list:', self.arcs)
    
    def get_board_state(self, states):
        board = self.size * self.size
        tempList = list()
        if len(states) == board:
            for i in range(self.size):
                tempElem = list()
                for j in range(self.size):
                    tempElem.append(states[i + j * self.size])
                tempList.append(tempElem)
        return tempList   
    
    def get_str_state(self, stateList):
        tempStr = ''
        for i in range(self.size):
            for j in range(self.size):
                tempStr += stateList[j][i]
        return tempStr
    
    def check(self, pt):
        if len(pt) == 2:
            if type(pt[0]) == int and type(pt[1]) == int :
                    if pt[0] in range(0, self.size) and pt[1] in range(0, self.size):
                        return True
        return False
    
    def getPassablePath(self, commonArcs, states, point):
        dirs = self.dirs
        if point[0] == 0 or point[0] == (self.size - 1):
            dirs = [elem for elem in dirs if elem[0] != 0]
        if point[1] == 0 or point[1] == (self.size - 1):
            dirs = [elem for elem in dirs if elem[1] != 0]
        for _ in dirs:
            pt = point
            while self.check(pt): 
                for arc in self.arcs:
                    if pt in arc and arc not in commonArcs:
                        commonArcs.append(arc)
                        other = [tpt for tpt in arc if tpt[0] != pt[0] and tpt[1] != pt[1]][0]
                        self.getPassablePath(commonArcs, states, other)
                        break   
                pt = (pt[0] + _[0], pt[1] + _[1])
                if self.check(pt) and states[pt[0]][pt[1]] != '.':
                    break
    
    def make_move_normal(self, initial, move_start, move_end):
        boardStates = self.get_board_state(initial)
        if boardStates[move_start[0]][move_start[1]] != '.' and boardStates[move_end[0]][move_end[1]] == '.':
            if self.check(move_start) and self.check(move_end):
                des = math.sqrt((move_start[0] - move_end[0])**2 + (move_start[1] - move_end[1])**2)
                if des <=  math.sqrt(2):
                    swap = boardStates[move_start[0]][move_start[1]]
                    boardStates[move_start[0]][move_start[1]] = boardStates[move_end[0]][move_end[1]]
                    boardStates[move_end[0]][move_end[1]] = swap     
                    return self.get_str_state(boardStates)
        return None
    
    
    def make_move_capture(self, initial, move_start, move_end):
        boardStates = self.get_board_state(initial)
        if boardStates[move_start[0]][move_start[1]] != '.' and boardStates[move_end[0]][move_end[1]] != '.':
            if boardStates[move_start[0]][move_start[1]] != boardStates[move_end[0]][move_end[1]]:
                if self.check(move_start) and self.check(move_end):
                    start_sets = list()
                    end_sets = list()
                    self.getPassablePath(start_sets, boardStates, move_start)
                    self.getPassablePath(end_sets, boardStates, move_end)
                    intersection = [v for v in start_sets if v in end_sets]
                    if len(intersection) > 0:
                        boardStates[move_end[0]][move_end[1]] = boardStates[move_start[0]][move_start[1]]
                        boardStates[move_start[0]][move_start[1]] = '.'
                        return self.get_str_state(boardStates)
        return None
    
    def make_move_sequence(self, initial, move_sequence):
        steps = initial
        for move_step in move_sequence:
            if len(move_step) == 2:
                normal_step = self.make_move_normal(steps, move_step[0], move_step[1])
                capture_step = self.make_move_capture(steps, move_step[0], move_step[1])
                if normal_step is not None:
                    steps = normal_step
                elif capture_step is not None:
                    steps = capture_step
                else:
                    return None
        return steps
    
    def test_for_make_move_sequence(self):
        print(self.make_move_sequence("x.xx..x..o..o.oo", [((1,2), (2,1)), ((0,0), (1,0))]))
        print(self.make_move_sequence("x.xx..x..o..o.oo", [((1,2), (3,1)), ((0,0), (1,0))]))
        print(self.make_move_sequence("x..x.xo.....o..o", [((1,1), (2,1))]))
        print(self.make_move_sequence(".xo.........oooo", [((1,1), (2,1))]))
        print(self.make_move_sequence(".x....o.....oooo", [((1,0), (2,1))]))
```

- init()
> 构造方法里负责生成探索的方向、弧形边的集合，记录棋盘的边长和生成弧形边的组合数。

- get_str_state()
> 将棋盘状态数组转换成字符串。

- get_board_state()
> 将字符串转换成棋盘状态数组。

- getPassablePath()
> 这个函数用于计算一个点可以经过多少个不同的弧形边，使用的方法就是简单的遍历，从而计算点的上、下、左、右方向路径上的每个点，如果有一个点是已经被占据，那么就放弃探索这个路径，如果该点是已知的弧形边上的点（入口），首先将该弧形边入队，然后从路径的另一个点（出口）重新调用该函数，直到找到所有可达的弧形边。（需要注意的是，处于边界的点的运动方向是受限的，比如在上边界的点只能向上、下方向探索，而在角落的点无法探索任何方向）

- make_move_normal()
> 普通走棋只需要判断上下左右的棋子的占据情况就可以了。

- make_move_capture()
> 这个函数其实只是调用了getPassablePath，获得两个点所能经过的所有不同的弧形边集合之后取交集，如果交集为空则走棋非法，反之走棋合法。

最后，感谢Katy提供这么好的题目给我，由衷感谢！！！

  [1]: /assets/blogImg/Surakarta.png
  [2]: /assets/blogImg/Surakarta_Simple.png
  [3]: /assets/blogImg/Surakarta_Normal.png
  [4]: /assets/blogImg/Surakarta_Capture.png

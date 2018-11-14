---
title: 算法探究(Javascript)之线段树
date: 2018-05-08 19:21:02
toc: true
tags:
    - 算法
    - Javascript
---
![线段树封面][1]
***&emsp;&emsp;"Great man are not born great. They grow great."***

# 线段树(Segment Tree) #
In computer science, a segment tree is a tree data structure used for storing information about intervals, or segments. It allows querying which of the stored segments contain a given point. It is, in principle, a static structure; that is, it's a structure that cannot be modified once it's built. A similar data structure is the interval tree. A segment tree for a set I of n intervals uses O(n log n) storage and can be built in O(n log n) time. Segment trees support searching for all the intervals that contain a query point in O(log n + k), k being the number of retrieved intervals or segments.Applications of the segment tree are in the areas of computational geometry, and geographic information systems.The segment tree can be generalized to higher dimension spaces.

> &emsp;&emsp;在计算机科学中，线段树是一个树状数据结构用于存储间隔或线段数据信息。它可以查询给定点所在的已存储的线段。原则上，它是一个静态数据结构。因为它不能在构建之后动态修改。间隔树与之类似。存储由n个间隔组成的集合I的线段树需要O(n log n)空间复杂度，且构建它需要O(n log n)时间复杂度。线段树可在O(log n + k)时间内搜索所有包含给定点的间隔，k是检索的线段或间隔的数目。线段树应用于计算图形学和地理信息系统中。线段树可被推广至高维度空间。（摘自Wiki百科）

<!-- more -->

# 练习一下 #
** SegmentTree.js **
```javascript
/**
 * Crane (POJ 2991)
 * 有一个起重机。我们把起重机看成由N条线段依次首尾相接而成。第i条线段的长度是Li。
 * 最开始，所有的线段都笔直连接，指向上方。
 * 有C条操纵起重机的命令。指令i给出两个正数Si和Ai，效果是使线段Si和Si+1之间的角
 * 度变成Ai度。其中角度指的是从线段Si开始沿着逆时针方向旋转到Si+1所经过的角度。
 * 最开始时所有角度都是180度。
 * 
 * 按顺序执行这C条指令。在每条指令执行之后，输出起重机的前端（第N条线段的端点）
 * 的坐标。假设起重机的支点坐标是（0,0）
 * 
 * 限制条件：
 * 1 <= N, C <= 1000
 * 1 <= Li <= 100
 * 1 <= Si < N, 0 <= Ai <=359
 * 
 * 初始状态:
 * ...
 * | L3
 * | L2
 * | L1
 * 
 * 样例1：
 * N=2, C=1
 * L = {10,5}
 * S = {1}
 * A = {90}
 * 
 * 输出 (5, 10)
 * | ->  __
 * | -> |
 */

function Crane(arrL) {
    // array of segments tree
    var _segments = [];

    // initialization of segment tree
    function __init__(idx, start, end) {
        let vx = 0, vy = 0;
        if (end - start == 1) {
            vy = arrL[start];
        } else {
            let chl = idx * 2 + 1, 
                chr = idx * 2 + 2, 
                mid = Math.floor((start + end) / 2);
            arguments.callee(chl, start, mid);
            arguments.callee(chr, mid, end);
            vy = _segments[chl].vy + _segments[chr].vy;
        }
        _segments[idx] = {
            vx: vx, 
            vy: vy, 
            start: start, 
            end: end
        };
    }

    // postorder traversal
    function postTravel(idx, seg, angle) {
        let chl = idx * 2 + 1, 
            chr = idx * 2 + 2,
            segment = _segments[idx];
        if (segment) {
            arguments.callee(chl, seg, angle);
            arguments.callee(chr, seg, angle);
            if (segment.end > seg) {
                if (_segments[chl] && _segments[chr]) {
                    segment.vx = _segments[chl].vx + _segments[chr].vx;
                    segment.vy = _segments[chl].vy + _segments[chr].vy;
                } else {
                    let norm = Math.sqrt(Math.pow(segment.vx, 2) + Math.pow(segment.vy, 2)),
                        degree = Math.atan2(segment.vy, segment.vx) - (angle / 180) * Math.PI;
                    segment.vx = norm * Math.cos(degree);
                    segment.vy = norm * Math.sin(degree);
                }
            }
        }
    }

    // public methods
    Object.assign(arguments.callee.prototype, {
        change: function(seg, angle) {
            if (seg >= 0 && seg < arrL.length) {
                postTravel(0, seg, angle);
            }
        },
        innerTree: function() {
            return _segments.slice(0);
        },
        getRoot: function() {
            return [_segments[0].vx, _segments[0].vy];
        }
    });

    __init__(0, 0, arrL.length);
}
```

- 读懂这段代码。
&emsp;&emsp;需要了解树的后序遍历和二分法的思想。

- 如何运行这段代码？
&emsp;&emsp;将以上代码粘贴至Chrome(version>=66)控制台(F12)的Console中回车即可运行查看结果，可以运行如下的测试用例:
```javascript
function testCrane(name, craneL, angles) {
    console.log(name);
    for (let angle of angles) {
        let crane = new Crane(craneL);
        crane.change(angle[0], angle[1]);
        let [x,y] = crane.getRoot();
        console.log('(', x.toFixed(2), ',', y.toFixed(2), ')');
    }
}

testCrane("Test Cases 1:", [5, 10], [[1, 90]]);
testCrane("Test Cases 2:", [5, 5, 5], [[1, 270], [2, -90]]);
```

# 平方分割(Sqrt Decomposition)#
> &emsp;&emsp;平方分割是把排成一排的n个元素的每sqrt(n)个分在 <img src="http://latex.codecogs.com/gif.latex?\sqrt n"/>个分在一个桶里进行维护的方法的统称。这样的分割方法可以使对区间的操作的复杂度降至O(<img src="http://latex.codecogs.com/gif.latex?\sqrt n"/>)。其中， 分桶法(Buket Method)是把一排的n个元素分桶，每个桶分别维护自己的内部信息，这也是一种平方分割的思想。

  [1]: /assets/blogImg/307_RSQ_SegmentTree.png
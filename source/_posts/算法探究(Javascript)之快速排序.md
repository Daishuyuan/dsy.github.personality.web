---
title: 算法探究(Javascript)之快速排序
date: 2018-07-29 12:26:42
toc: true
tags:
    - 算法
    - Javascript
---
![快速排序][1]
***&emsp;&emsp;"Courage is going from failure to failure without losing enthusiasm." -- Churchill***
# 快速排序 #
## 前言 ##
> 快速排序（又被称为分区交换排序partition-exchange sort）是一种非常有效率的排序方法。Tony Hoare于1959年开发，他的工作发表于1961年，快速排序直到现在仍然是十分有效的而排序算法。如果运用得当，它将比归并排序和堆排序快二到三倍。快速排序是一种比较排序，意味着它能基于“小于或大于”的规则对一些元素进行排序。它并不是一个稳定排序，这意味着排序相同大小的元素的相对位置可能发生改变。快速排序需要在数组的内部进行操作，并需要一些额外的空间执行排序。从这一点来看，它和选择排序有些类似。快速排序的时间复杂度为O(nlogn)，最坏的情况下的时间复杂度为O(n^2)。

<!-- more -->
## 快速排序的基本思路 ##
快速排序的基本思路其实十分简单，我们可以考虑对以下这个序列进行排序:

0|1|2|3|4|5
:---: | :---: | :---: | :---: | :---: | :---: |
**5***|15|3|12|4|2
首先，选择一个哨兵，比如我们选择**第一个元素**作为一次排序的哨兵，即选择5。我们将比5小的元素排在5的左边，而比5大的元素排在5的右边。那么有：

0|1|2|3|4|5
:---: | :---: | :---: | :---: | :---: | :---: |
4|2|3|**5***|12|15
这样的一趟排序的代码，可以用javascript用如下的方式实现：

```javascript
// 交换
function swap(i, j) {
    if (i >= 0 && i < array.length && j >= 0 && j < array.length) {
        let cache = array[j];
        array[j] = array[i];
        array[i] = cache;
    }
}

/**
 * 内部递归排序方法
 * 
 * @param {*} s 排序的开始位置
 * @param {*} e 排序的终止位置
 */
function innerSort(s, e) {
    if (s < e) {
        let i = s,
            j = e,
            key = array[s]; // 哨兵（把所有数字排到哨兵的左右）
        while (i < j) {
            // 从数组最后开始寻找（1）
            if (array[j] > key) {
                --j;
                continue; // 发现比哨兵大的则继续找
            }
            // 从数组开头开始寻找（2）
            if (array[i] <= key) { // 如果
                ++i;
                continue; // 发现比哨兵小的则继续找
            }
            swap(i, j); // 当（1）找到一个比哨兵小的且（2）找到一个比哨兵大的时交换
        }
        if (array[i] < array[s]) swap(s, i); // 安排哨兵位置，中间位置比哨兵小则交换
    }
}

```

一趟排序之后，我们得到了以5为分割的序列，我们称为一趟排序。之后，我们需要分别对5左边和5右边的序列进行排序，即对4,2,3和12,15进行排序，排序的规则和一趟排序相同。那么我们来看看用程序如何实现这样一个过程吧。下面是一个完整的基于递归的快速排序算法（重复的部分略）：

```javascript
function QuickSortByRecursion(array) {
    function swap(i, j) {
        ... // 略
    }

    function innerSort(s, e) {
        ... // 这部分就是上面，我们之前一趟排序的方法
        innerSort(s, i - 1); // 从开始到哨兵位置进行排序
        innerSort(i + 1, e); // 从哨兵位置到最后进行排序
    }

    innerSort(0, array.length - 1); // 开始排序
    return array;
}
```

## 快速排序的去递归方法实现 ##
要将一个方法去递归，最容易的方式就是加个栈来模拟递归方式的实现。修改方法如下所示：
```javascript
function QuickSortByStack(array) {
    function swap(i, j) {
        if (i >= 0 && i < array.length && j >= 0 && j < array.length) {
            let cache = array[j];
            array[j] = array[i];
            array[i] = cache;
        }
    }

    var stack = [array.length - 1, 0]; // 用一个栈存储每次调用的结果
    while (stack.length > 0) {
        let s = stack.pop(),
            e = stack.pop();
        if (s < e) {
            let i = s,
                j = e,
                key = array[s];
            while (i < j) {
                if (array[j] > key) {
                    --j;
                    continue;
                }
                if (array[i] <= key) {
                    ++i;
                    continue;
                }
                swap(i, j);
            }
            if (array[i] < array[s]) swap(s, i);
            stack.push(i - 1);
            stack.push(s);
            stack.push(e);
            stack.push(i + 1);
        }
    }
    return array;
}
```

## 测试你的代码 ##
下面，我将在我自己的实验环境里测试快速排序算法的性能，以下是我的实验环境：
浏览器： Google Chrome	60.0.3112.90 (正式版本) （32 位）
操作系统：	Windows
语言： JavaScript	V8 6.0.286.52

以下是测试用的脚本
```javascript
function SortTimeTestCase(count) {
    let array = [];
    for (let i = 1; i <= count; ++i) {
        array.push(parseInt(Math.random() * i));
    }
    SortTimeTestCase.prototype.showTime = function (func) {
        let cur = Date.now();
        console.log(func(array.slice(0)));
        console.log(`runtime: ${Date.now() - cur}ms`);
    }
}

var test = new SortTimeTestCase(100000); // 随机产生十万个数字的乱序数组进行测试
test.showTime(QuickSortByRecursion); 
test.showTime(QuickSortByStack);
```
以上的测试结果如下：

基于递归的快速排序算法耗时|基于栈的快速排序算法耗时
:---: | :---:
132-157ms | 333-410ms

基于递归的方法两倍快于非递归的方法，速度还在可以接受的范围内。然而，当我们采用有序的数组测试时，却发生了比较严重的性能问题,如采用以下的有序数组进行测试：
```javascript
    let array = [];
    for (let i = 1; i <= count; ++i) {
        array.push(i);
    }
```
基于递归的快速排序算法耗时|基于栈的快速排序算法耗时
:---: | :---:
Maximum call stack size exceeded | 19242ms

可见，递归的方式直接崩溃了，而基于栈的方式也足足运算了有19s之多。然而，这是为什么呢？原因其实很简单，因为我们每次都是选择第一个作为哨兵，而对于有序的数组而言，每趟排序的哨兵不是在队头就是在队尾，这会造成算法每趟只确定了一个元素的位置，算法的时间复杂度就退化成了O(n^2)。解决的办法当然很简单，就是不选择默认的第一个元素作为哨兵，比如采用中间值或者随机的方式选择哨兵都可以显著改善算法对排序有序或基本有序的序列的性能。下面，我们采用随机选择哨兵的方式优化快速排序对于有序或者基本有序的数组进行排序的性能。

```javascript
function innerSort(s, e) {
    if (s < e) {
        let site = parseInt(Math.random() * (e - s) + s); // 随机选择哨兵
        swap(site, s); // 将哨兵换到开头，这样我们的代码就不需要其他调整了

        // --- 后面就是之前基于递归的快速排序代码 ---
        let i = s,
            j = e,
            key = array[s]; // 哨兵（把所有数字排到哨兵的左右）
        while (i < j) {
            // 从数组最后开始寻找（1）
            if (array[j] > key) {
                --j;
                continue; // 发现比哨兵大的则继续找
            }
            // 从数组开头开始寻找（2）
            if (array[i] <= key) { // 如果
                ++i;
                continue; // 发现比哨兵小的则继续找
            }
            swap(i, j); // 当（1）找到一个比哨兵小的且（2）找到一个比哨兵大的时交换
        }
        if (array[i] < array[s]) swap(s, i); // 安排哨兵位置，中间位置比哨兵小则交换
        innerSort(s, i - 1);
        innerSort(i + 1, e);
    }
}
```
经过测试后，基于递归的快速排序和基于栈的快速排序的性能得到了明显的提升，对于有序或基本有序的数组进行排序的结果如下：

基于递归的快速排序算法耗时|基于栈的快速排序算法耗时
:---: | :---:
100-326ms | 98-326ms
可见，通过修改选定的哨兵的规则，可以极大改善快速排序算法排序有序或基本有序序列的性能。

## 写在最后 ##
通过本次实验和测试，我有几点收获与大家分享：
1. 算法的原理固然简单也容易理解，但是往往写成计算机程序有的时候就不是一件容易的事情，要在观念上转变“我懂即我会编”的思维；
2. 充分测试和推敲你的代码，你的代码相当可能在很多地方存在漏洞，包括代码段执行的顺序也需要反复推敲。
3. 在讨论算法时，我们不仅需要讨论它在什么时候有效，也要注意它在什么时候失效；
4. 读万卷书，行万里路。读书亦难，行路亦难。当编代码没有头绪的时候，不妨听听歌，放松一下。

[1]: /assets/blogImg/Sorting_quicksort_anim.gif
